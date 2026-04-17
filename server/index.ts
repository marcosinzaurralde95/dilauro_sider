import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Almacenamiento en memoria para analytics y leads
const analyticsLog: any[] = [];
const leadsDatabase: any[] = [];

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());

  // Endpoint para analytics
  app.post("/api/analytics", async (req, res) => {
    try {
      const { sessionId, eventType, timestamp, data } = req.body;
      
      const analyticsEntry = {
        sessionId,
        eventType,
        timestamp,
        data,
        recordedAt: new Date().toISOString(),
      };
      
      analyticsLog.push(analyticsEntry);
      
      // Mantener solo los últimos 1000 eventos en memoria
      if (analyticsLog.length > 1000) {
        analyticsLog.shift();
      }
      
      console.log(`[Analytics] ${eventType}:`, data);
      res.json({ success: true });
    } catch (error) {
      console.error("Error en /api/analytics:", error);
      res.status(500).json({ error: "Error al registrar analytics" });
    }
  });

  // Endpoint para capturar leads
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, name, phone, company, sessionId, capturedAt } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: "Email y nombre son requeridos" });
      }
      
      const leadEntry = {
        id: Date.now().toString(),
        email,
        name,
        phone: phone || null,
        company: company || null,
        sessionId,
        capturedAt,
        recordedAt: new Date().toISOString(),
      };
      
      leadsDatabase.push(leadEntry);
      
      console.log(`[Lead Captured] ${name} (${email})`);
      
      res.json({ success: true, leadId: leadEntry.id });
    } catch (error) {
      console.error("Error en /api/leads:", error);
      res.status(500).json({ error: "Error al capturar lead" });
    }
  });

  // Endpoint para obtener estadísticas de analytics
  app.get("/api/analytics/stats", (req, res) => {
    try {
      const eventTypesSet = new Set(analyticsLog.map(e => e.eventType));
      const eventTypes: string[] = [];
      eventTypesSet.forEach(type => eventTypes.push(type as string));
      
      const stats = {
        totalEvents: analyticsLog.length,
        totalLeads: leadsDatabase.length,
        eventTypes,
        recentLeads: leadsDatabase.slice(-10),
        recentEvents: analyticsLog.slice(-20),
      };
      res.json(stats);
    } catch (error) {
      console.error("Error en /api/analytics/stats:", error);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // Endpoint para llamar a Groq API
  app.post("/api/groq", async (req, res) => {
    try {
      const { messages, model, max_tokens, temperature } = req.body;

      // Obtener la clave API de Groq desde las variables de entorno
      const groqApiKey = process.env.Gorq_API;

      if (!groqApiKey) {
        return res.status(500).json({
          error: "Groq API key no configurada",
        });
      }

      // Llamar a la API de Groq
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: model || "mixtral-8x7b-32768",
          messages: messages || [],
          max_tokens: max_tokens || 1024,
          temperature: temperature || 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Groq API Error:", errorData);
        return res.status(response.status).json({
          error: errorData.error?.message || "Error en Groq API",
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error en /api/groq:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

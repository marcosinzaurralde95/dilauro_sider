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

  // Endpoint para enviar emails con Sendgrid
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html, name } = req.body;
      const sendgridApiKey = process.env.SENDGRID_API_KEY;

      if (!sendgridApiKey) {
        console.log("[Email] Sendgrid no configurado, simulando envio a:", to);
        return res.json({ success: true, simulated: true, message: "Email simulado" });
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to, name }] }],
          from: { email: "noreply@dilauro.com", name: "DILAURO" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Sendgrid Error:", error);
        return res.status(response.status).json({ error: "Error al enviar email" });
      }

      console.log(`[Email Sent] To: ${to}, Subject: ${subject}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error en /api/send-email:", error);
      res.status(500).json({ error: "Error al enviar email" });
    }
  });

  // Endpoint para capturar leads
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, name, phone, company, sessionId, capturedAt, segment } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: "Email y nombre son requeridos" });
      }
      
      const leadEntry = {
        id: Date.now().toString(),
        email,
        name,
        phone: phone || null,
        company: company || null,
        segment: segment || "general",
        sessionId,
        capturedAt,
        recordedAt: new Date().toISOString(),
      };
      
      leadsDatabase.push(leadEntry);
      
      console.log(`[Lead Captured] ${name} (${email}) - Segment: ${segment || "general"}`);
      
      // Enviar email de confirmacion al usuario
      const userEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Gracias por tu interes en DILAURO</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>Hemos recibido tu informacion y nos pondremos en contacto pronto para discutir como DILAURO puede transformar tu presencia digital.</p>
          <p><strong>Proximos pasos:</strong></p>
          <ul>
            <li>Nuestro equipo revisara tu solicitud</li>
            <li>Te contactaremos en las proximas 24 horas</li>
            <li>Agendaremos una demo personalizada</li>
          </ul>
          <p>¡Esperamos conectar contigo pronto!</p>
          <p>Equipo DILAURO</p>
        </div>
      `;
      
      // Enviar email al usuario
      fetch("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          name,
          subject: "Bienvenido a DILAURO - Confirmacion de tu solicitud",
          html: userEmailHtml,
        }),
      }).catch(err => console.error("Error sending user email:", err));
      
      // Enviar notificacion al equipo de ventas
      const salesEmailHtml = `
        <div style="font-family: Arial, sans-serif;">
          <h3>Nuevo Lead Capturado</h3>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefono:</strong> ${phone || "No proporcionado"}</p>
          <p><strong>Empresa:</strong> ${company || "No proporcionado"}</p>
          <p><strong>Segmento:</strong> ${segment || "general"}</p>
          <p><strong>Capturado:</strong> ${new Date(capturedAt).toLocaleString()}</p>
        </div>
      `;
      
      fetch("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "ventas@dilauro.com",
          name: "Equipo DILAURO",
          subject: `Nuevo Lead: ${name}`,
          html: salesEmailHtml,
        }),
      }).catch(err => console.error("Error sending sales email:", err));
      
      res.json({ success: true, leadId: leadEntry.id });
    } catch (error) {
      console.error("Error en /api/leads:", error);
      res.status(500).json({ error: "Error al capturar lead" });
    }
  });

  // Endpoint para obtener estadisticas de analytics
  app.get("/api/analytics/stats", (req, res) => {
    try {
      const eventTypesSet = new Set(analyticsLog.map(e => e.eventType));
      const eventTypes: string[] = [];
      eventTypesSet.forEach(type => eventTypes.push(type as string));
      
      // Calcular metricas
      const totalSessions = new Set(analyticsLog.map(e => e.sessionId)).size;
      const totalMessages = analyticsLog.filter(e => e.eventType === "user_message").length;
      const totalLeads = leadsDatabase.length;
      const conversionRate = totalSessions > 0 ? ((totalLeads / totalSessions) * 100).toFixed(2) : "0";
      
      // Agrupar leads por segmento
      const leadsBySegment: Record<string, number> = {};
      leadsDatabase.forEach(lead => {
        const seg = lead.segment || "general";
        leadsBySegment[seg] = (leadsBySegment[seg] || 0) + 1;
      });
      
      const stats = {
        totalEvents: analyticsLog.length,
        totalSessions,
        totalMessages,
        totalLeads,
        conversionRate: `${conversionRate}%`,
        leadsBySegment,
        eventTypes,
        recentLeads: leadsDatabase.slice(-10),
        recentEvents: analyticsLog.slice(-20),
      };
      res.json(stats);
    } catch (error) {
      console.error("Error en /api/analytics/stats:", error);
      res.status(500).json({ error: "Error al obtener estadisticas" });
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

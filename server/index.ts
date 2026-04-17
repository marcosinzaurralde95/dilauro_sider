import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Almacenamiento en memoria para analytics, leads, A/B testing, referrals y suscripciones
const analyticsLog: any[] = [];
const leadsDatabase: any[] = [];
const referralsDatabase: any[] = [];
const subscriptionsDatabase: any[] = [];
const notificationsQueue: any[] = [];
const abTestVariants: Record<string, string[]> = {
  startup: ["variant_a", "variant_b"],
  enterprise: ["variant_a", "variant_b"],
  agency: ["variant_a", "variant_b"],
  freelancer: ["variant_a", "variant_b"],
};
const abTestResults: Record<string, any> = {};

// Planes de suscripción
const SUBSCRIPTION_PLANS = {
  starter: { name: "Starter", price: 2999, currency: "usd", interval: "month", features: ["Presencia básica", "Chatbot IA", "Analytics"] },
  professional: { name: "Professional", price: 7999, currency: "usd", interval: "month", features: ["Presencia premium", "Chatbot IA avanzado", "Analytics completo", "CRM integrado"] },
  enterprise: { name: "Enterprise", price: 19999, currency: "usd", interval: "month", features: ["Todo incluido", "Soporte 24/7", "Integraciones custom", "Equipo dedicado"] },
};

// Comisiones de referral
const REFERRAL_COMMISSION = 0.20; // 20% de comisión

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

  // Endpoint para enviar leads a CRM (HubSpot/Pipedrive)
  app.post("/api/crm/sync", async (req, res) => {
    try {
      const { email, name, phone, company, segment, leadId } = req.body;
      const hubspotApiKey = process.env.HUBSPOT_API_KEY;
      const pipedrivApiKey = process.env.PIPEDRIVE_API_KEY;

      const crmData = {
        email,
        name,
        phone: phone || "",
        company: company || "",
        segment,
        source: "DILAURO_CHATBOT",
        leadId,
      };

      // Enviar a HubSpot si está configurado
      if (hubspotApiKey) {
        try {
          const hubspotResponse = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${hubspotApiKey}`,
            },
            body: JSON.stringify({
              properties: {
                firstname: name.split(" ")[0],
                lastname: name.split(" ").slice(1).join(" "),
                email,
                phone,
                company,
                hs_lead_status: "NEW",
                lifecyclestage: "lead",
                source: "DILAURO_CHATBOT",
              },
            }),
          });

          if (hubspotResponse.ok) {
            console.log(`[CRM] Lead synced to HubSpot: ${email}`);
          }
        } catch (err) {
          console.error("HubSpot sync error:", err);
        }
      }

      // Enviar a Pipedrive si está configurado
      if (pipedrivApiKey) {
        try {
          const pipedrivResponse = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${pipedrivApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email: [{ value: email, primary: true }],
              phone: [{ value: phone, primary: true }],
              org_id: company,
              custom_fields: { segment },
            }),
          });

          if (pipedrivResponse.ok) {
            console.log(`[CRM] Lead synced to Pipedrive: ${email}`);
          }
        } catch (err) {
          console.error("Pipedrive sync error:", err);
        }
      }

      res.json({ success: true, crmData });
    } catch (error) {
      console.error("Error en /api/crm/sync:", error);
      res.status(500).json({ error: "Error al sincronizar con CRM" });
    }
  });

  // Endpoint para webhooks (Zapier, Make, etc)
  app.post("/api/webhooks/trigger", async (req, res) => {
    try {
      const { event, data, webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ error: "webhookUrl requerido" });
      }

      // Enviar a webhook externo
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });

      console.log(`[Webhook] Event '${event}' sent to ${webhookUrl}`);
      res.json({ success: true, webhookStatus: webhookResponse.status });
    } catch (error) {
      console.error("Error en /api/webhooks/trigger:", error);
      res.status(500).json({ error: "Error al enviar webhook" });
    }
  });

  // Endpoint para A/B testing - obtener variante
  app.post("/api/ab-test/variant", async (req, res) => {
    try {
      const { sessionId, segment } = req.body;

      if (!segment || !abTestVariants[segment]) {
        return res.status(400).json({ error: "Segmento invalido" });
      }

      // Seleccionar variante aleatoria
      const variants = abTestVariants[segment];
      const variant = variants[Math.floor(Math.random() * variants.length)];

      // Registrar asignacion
      if (!abTestResults[sessionId]) {
        abTestResults[sessionId] = {};
      }
      abTestResults[sessionId].variant = variant;
      abTestResults[sessionId].segment = segment;
      abTestResults[sessionId].assignedAt = new Date().toISOString();

      console.log(`[A/B Test] Session ${sessionId} assigned to ${variant}`);
      res.json({ variant, sessionId });
    } catch (error) {
      console.error("Error en /api/ab-test/variant:", error);
      res.status(500).json({ error: "Error al asignar variante" });
    }
  });

  // Endpoint para registrar resultado de A/B test
  app.post("/api/ab-test/result", async (req, res) => {
    try {
      const { sessionId, variant, metric, value } = req.body;

      if (!abTestResults[sessionId]) {
        abTestResults[sessionId] = {};
      }

      if (!abTestResults[sessionId].metrics) {
        abTestResults[sessionId].metrics = [];
      }

      abTestResults[sessionId].metrics.push({
        metric,
        value,
        recordedAt: new Date().toISOString(),
      });

      console.log(`[A/B Test] Result recorded for ${sessionId}: ${metric}=${value}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error en /api/ab-test/result:", error);
      res.status(500).json({ error: "Error al registrar resultado" });
    }
  });

  // Endpoint para obtener estadisticas de A/B test
  app.get("/api/ab-test/stats", (req, res) => {
    try {
      const stats: Record<string, any> = {
        variant_a: { conversions: 0, sessions: 0, conversionRate: 0 },
        variant_b: { conversions: 0, sessions: 0, conversionRate: 0 },
      };

      Object.values(abTestResults).forEach((result: any) => {
        const variant = result.variant;
        if (stats[variant]) {
          stats[variant].sessions++;
          if (result.metrics && result.metrics.some((m: any) => m.metric === "conversion" && m.value === true)) {
            stats[variant].conversions++;
          }
        }
      });

      // Calcular tasas de conversion
      Object.keys(stats).forEach(variant => {
        stats[variant].conversionRate = stats[variant].sessions > 0 
          ? ((stats[variant].conversions / stats[variant].sessions) * 100).toFixed(2) 
          : "0";
      });

      res.json(stats);
    } catch (error) {
      console.error("Error en /api/ab-test/stats:", error);
      res.status(500).json({ error: "Error al obtener estadisticas" });
    }
  });

  // Endpoint para capturar leads
  app.post("/api/leads", async (req, res) => {
    try {
      const { email, name, phone, company, sessionId, capturedAt, segment, variant } = req.body;
      
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
        variant: variant || "control",
        sessionId,
        capturedAt,
        recordedAt: new Date().toISOString(),
      };
      
      leadsDatabase.push(leadEntry);
      
      console.log(`[Lead Captured] ${name} (${email}) - Segment: ${segment || "general"} - Variant: ${variant || "control"}`);
      
      // Enviar email de confirmacion
      const userEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Gracias por tu interes en DILAURO</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>Hemos recibido tu informacion y nos pondremos en contacto pronto.</p>
          <p>¡Esperamos conectar contigo pronto!</p>
          <p>Equipo DILAURO</p>
        </div>
      `;
      
      fetch("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          name,
          subject: "Bienvenido a DILAURO",
          html: userEmailHtml,
        }),
      }).catch(err => console.error("Error sending user email:", err));
      
      // Sincronizar con CRM
      fetch("http://localhost:3000/api/crm/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          company,
          segment: segment || "general",
          leadId: leadEntry.id,
        }),
      }).catch(err => console.error("Error syncing to CRM:", err));

      // Disparar webhook para automatizaciones
      const webhookUrl = process.env.ZAPIER_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        fetch("http://localhost:3000/api/webhooks/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "lead_captured",
            data: leadEntry,
            webhookUrl,
          }),
        }).catch(err => console.error("Error triggering webhook:", err));
      }

      // Registrar resultado de A/B test
      if (variant) {
        fetch("http://localhost:3000/api/ab-test/result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            variant,
            metric: "conversion",
            value: true,
          }),
        }).catch(err => console.error("Error recording A/B test result:", err));
      }
      
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
      
      const totalSessions = new Set(analyticsLog.map(e => e.sessionId)).size;
      const totalMessages = analyticsLog.filter(e => e.eventType === "user_message").length;
      const totalLeads = leadsDatabase.length;
      const conversionRate = totalSessions > 0 ? ((totalLeads / totalSessions) * 100).toFixed(2) : "0";
      
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

  // Endpoint para crear sesión de pago con Stripe
  app.post("/api/stripe/checkout", async (req, res) => {
    try {
      const { planId, email, referralCode } = req.body;
      const stripeApiKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeApiKey) {
        return res.status(500).json({ error: "Stripe no configurado" });
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return res.status(400).json({ error: "Plan inválido" });
      }

      // Crear sesión de Stripe Checkout
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeApiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "payment_method_types[0]": "card",
          "line_items[0][price_data][currency]": plan.currency,
          "line_items[0][price_data][product_data][name]": plan.name,
          "line_items[0][price_data][unit_amount]": plan.price.toString(),
          "line_items[0][quantity]": "1",
          "mode": "subscription",
          "success_url": "https://dilauro.com/success?session_id={CHECKOUT_SESSION_ID}",
          "cancel_url": "https://dilauro.com/cancel",
          "customer_email": email,
          "metadata[referralCode]": referralCode || "",
          "metadata[planId]": planId,
        }).toString(),
      });

      const data = await response.json();
      console.log(`[Stripe] Checkout session created for ${email}`);
      res.json({ sessionId: data.id, url: data.url });
    } catch (error) {
      console.error("Error en /api/stripe/checkout:", error);
      res.status(500).json({ error: "Error al crear sesión de pago" });
    }
  });

  // Endpoint para generar código de referral
  app.post("/api/referrals/generate", async (req, res) => {
    try {
      const { userId, email, name } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: "userId y email requeridos" });
      }

      const referralCode = `REF-${userId}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const referralLink = `https://dilauro.com?ref=${referralCode}`;

      const referralEntry = {
        id: Date.now().toString(),
        userId,
        email,
        name,
        referralCode,
        referralLink,
        totalEarnings: 0,
        totalReferrals: 0,
        createdAt: new Date().toISOString(),
      };

      referralsDatabase.push(referralEntry);
      console.log(`[Referral] Code generated: ${referralCode}`);
      res.json(referralEntry);
    } catch (error) {
      console.error("Error en /api/referrals/generate:", error);
      res.status(500).json({ error: "Error al generar código de referral" });
    }
  });

  // Endpoint para registrar referral conversion
  app.post("/api/referrals/convert", async (req, res) => {
    try {
      const { referralCode, newUserId, planId, amount } = req.body;

      if (!referralCode || !newUserId || !planId) {
        return res.status(400).json({ error: "Parámetros requeridos" });
      }

      const referrer = referralsDatabase.find(r => r.referralCode === referralCode);
      if (!referrer) {
        return res.status(404).json({ error: "Código de referral no encontrado" });
      }

      const commission = (amount || SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]?.price || 0) * REFERRAL_COMMISSION;

      const conversion = {
        id: Date.now().toString(),
        referralCode,
        referrerId: referrer.userId,
        newUserId,
        planId,
        amount: amount || SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]?.price,
        commission,
        status: "completed",
        convertedAt: new Date().toISOString(),
      };

      referrer.totalReferrals++;
      referrer.totalEarnings += commission;

      console.log(`[Referral] Conversion: ${referralCode} earned $${(commission / 100).toFixed(2)}`);
      res.json(conversion);
    } catch (error) {
      console.error("Error en /api/referrals/convert:", error);
      res.status(500).json({ error: "Error al procesar referral" });
    }
  });

  // Endpoint para obtener stats de referral
  app.get("/api/referrals/stats/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const referral = referralsDatabase.find(r => r.userId === userId);

      if (!referral) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json(referral);
    } catch (error) {
      console.error("Error en /api/referrals/stats:", error);
      res.status(500).json({ error: "Error al obtener stats" });
    }
  });

  // Endpoint para enviar notificaciones push
  app.post("/api/notifications/send", async (req, res) => {
    try {
      const { userId, title, message, type, data } = req.body;

      const notification = {
        id: Date.now().toString(),
        userId,
        title,
        message,
        type,
        data,
        read: false,
        sentAt: new Date().toISOString(),
      };

      notificationsQueue.push(notification);

      // Mantener solo las últimas 500 notificaciones
      if (notificationsQueue.length > 500) {
        notificationsQueue.shift();
      }

      console.log(`[Notification] Sent to ${userId}: ${title}`);
      res.json({ success: true, notificationId: notification.id });
    } catch (error) {
      console.error("Error en /api/notifications/send:", error);
      res.status(500).json({ error: "Error al enviar notificación" });
    }
  });

  // Endpoint para obtener notificaciones de un usuario
  app.get("/api/notifications/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const userNotifications = notificationsQueue.filter(n => n.userId === userId);
      res.json(userNotifications);
    } catch (error) {
      console.error("Error en /api/notifications/:userId:", error);
      res.status(500).json({ error: "Error al obtener notificaciones" });
    }
  });

  // Endpoint para marcar notificación como leída
  app.post("/api/notifications/:notificationId/read", (req, res) => {
    try {
      const { notificationId } = req.params;
      const notification = notificationsQueue.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ error: "Notificación no encontrada" });
      }

      notification.read = true;
      res.json({ success: true });
    } catch (error) {
      console.error("Error en /api/notifications/:notificationId/read:", error);
      res.status(500).json({ error: "Error al marcar como leída" });
    }
  });

  // Endpoint para obtener planes de suscripción
  app.get("/api/subscription/plans", (req, res) => {
    try {
      const plans = Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
        id,
        ...plan,
      }));
      res.json(plans);
    } catch (error) {
      console.error("Error en /api/subscription/plans:", error);
      res.status(500).json({ error: "Error al obtener planes" });
    }
  });

  // Endpoint para llamar a Groq API
  app.post("/api/groq", async (req, res) => {
    try {
      const { messages, model, max_tokens, temperature } = req.body;

      const groqApiKey = process.env.Gorq_API;

      if (!groqApiKey) {
        return res.status(500).json({
          error: "Groq API key no configurada",
        });
      }

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

  // Serve static files
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

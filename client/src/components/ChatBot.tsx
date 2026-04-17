import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mail, Phone } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface LeadData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  segment?: string;
  captured: boolean;
}

type UserSegment = 'startup' | 'enterprise' | 'agency' | 'freelancer' | 'general';

const QUICK_QUESTIONS = [
  '¿Qué es DILAURO?',
  '¿Cómo funciona?',
  'Beneficios',
  'Solicitar demo',
];

// Prompts personalizados por segmento
const SEGMENT_PROMPTS: Record<UserSegment, string> = {
  startup: `Eres un asistente de soporte especializado en startups para DILAURO. 
Enfatiza: velocidad de implementación, escalabilidad, costo-efectividad, y cómo DILAURO acelera el time-to-market.
Menciona planes flexibles y opciones para empresas en crecimiento.`,
  
  enterprise: `Eres un asistente de soporte especializado en empresas para DILAURO.
Enfatiza: seguridad, escalabilidad empresarial, soporte dedicado, integraciones complejas, y ROI a largo plazo.
Menciona SLA, compliance, y opciones de customización.`,
  
  agency: `Eres un asistente de soporte especializado en agencias para DILAURO.
Enfatiza: capacidad de gestionar múltiples clientes, white-label, herramientas de colaboración, y márgenes de ganancia.
Menciona planes de agencia y beneficios de reseller.`,
  
  freelancer: `Eres un asistente de soporte especializado en freelancers para DILAURO.
Enfatiza: facilidad de uso, automatización, templates reutilizables, y cómo ahorrar tiempo en proyectos.
Menciona precios accesibles y planes por proyecto.`,
  
  general: `Eres un asistente de soporte profesional para DILAURO, una solución de presencia digital premium.
Propuesta de valor: Elegancia que avanza contigo.
Beneficios: Presencia Premium, Claridad Instantánea, Experiencia Fluida, Conversión Optimizada.`
};

const BASE_SYSTEM_PROMPT = `Eres un asistente de soporte profesional para DILAURO, una solución de presencia digital premium diseñada para marcas de élite.

INFORMACIÓN SOBRE DILAURO:
- DILAURO es una plataforma de presencia digital premium con activación rápida, UX sin fricción y diseño orientado a conversión
- Propuesta de valor: Elegancia que avanza contigo
- Beneficios principales: Presencia Premium, Claridad Instantánea, Experiencia Fluida, Conversión Optimizada
- Proceso de activación: 4 pasos - Descubre, Conecta, Decide, Avanza
- Contacto: hola@dilauro.com
- El objetivo es reducir el time-to-value y generar conversiones de alto impacto

INSTRUCCIONES:
1. Responde SOLO sobre DILAURO y temas relacionados con su propuesta de valor
2. Si la pregunta no está relacionada con DILAURO, redirige amablemente al usuario hacia temas relevantes
3. Sé profesional, conciso y orientado a la conversión
4. Mantén un tono premium y sofisticado
5. Ofrece información clara y directa
6. Si el usuario muestra interés en demo o tiene preguntas complejas, sugiere capturar su información de contacto
7. Responde en español, manteniendo la elegancia de la marca`;

export default function ChatBot({ isOpen = false, onClose }: ChatBotProps) {
  const [open, setOpen] = useState(isOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showSegmentSelection, setShowSegmentSelection] = useState(false);
  const [userSegment, setUserSegment] = useState<UserSegment>('general');
  const [leadData, setLeadData] = useState<LeadData>({
    email: '',
    name: '',
    phone: '',
    company: '',
    segment: 'general',
    captured: false,
  });
  const [showEscalation, setShowEscalation] = useState(false);
  const [conversationCount, setConversationCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());

  // Inicializar con selección de segmento
  useEffect(() => {
    if (open && messages.length === 0) {
      setShowSegmentSelection(true);
      const greetingMsg: Message = {
        id: '0',
        type: 'system',
        text: '¿Cuál es tu perfil? Esto nos ayudará a personalizar mejor nuestro soporte.',
        timestamp: new Date(),
      };
      setMessages([greetingMsg]);
    }
  }, [open]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Registrar evento de analytics
  const logAnalytics = async (eventType: string, data: any) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          eventType,
          timestamp: new Date().toISOString(),
          data: { ...data, segment: userSegment },
        }),
      });
    } catch (err) {
      console.error('Error logging analytics:', err);
    }
  };

  // Seleccionar segmento
  const handleSegmentSelection = (segment: UserSegment) => {
    setUserSegment(segment);
    setShowSegmentSelection(false);
    
    const segmentLabels: Record<UserSegment, string> = {
      startup: 'Startup',
      enterprise: 'Empresa',
      agency: 'Agencia',
      freelancer: 'Freelancer',
      general: 'General',
    };

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: `Soy ${segmentLabels[segment]}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      text: `¡Perfecto! Soy especialista en soluciones para ${segmentLabels[segment].toLowerCase()}s. ¿Cómo puedo ayudarte hoy?`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, botMsg]);

    logAnalytics('segment_selected', { segment });
  };

  // Función para llamar a la API de Groq
  const callGroqAPI = async (userMessage: string): Promise<string> => {
    try {
      const conversationHistory = messages
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

      conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      const systemPrompt = BASE_SYSTEM_PROMPT + '\n\n' + SEGMENT_PROMPTS[userSegment];

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...conversationHistory,
          ],
          model: 'mixtral-8x7b-32768',
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Respuesta inesperada de la API');
      }
    } catch (err) {
      console.error('Error al llamar a Groq API:', err);
      throw err;
    }
  };

  // Detectar si el usuario quiere una demo o tiene interés
  const shouldShowLeadForm = (text: string): boolean => {
    const keywords = ['demo', 'precio', 'costo', 'plan', 'contratar', 'empezar', 'solicitar', 'contacto', 'email'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Detectar si necesita escalada a humanos
  const shouldEscalate = (text: string): boolean => {
    const keywords = ['urgente', 'problema', 'error', 'no funciona', 'ayuda', 'soporte', 'hablar con', 'persona'];
    return keywords.some(keyword => text.toLowerCase().includes(keyword));
  };

  // Manejar envío de mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    setConversationCount(prev => prev + 1);

    await logAnalytics('user_message', {
      message: input,
      conversationCount,
      leadCaptured: leadData.captured,
    });

    try {
      if (shouldEscalate(input) && conversationCount > 2) {
        setShowEscalation(true);
        const escalationMsg: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          text: '🔄 Detectamos que podrías necesitar ayuda especializada. ¿Te gustaría que te conectemos con un agente humano?',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, escalationMsg]);
        await logAnalytics('escalation_offered', { reason: 'user_request' });
        setIsLoading(false);
        return;
      }

      const botResponse = await callGroqAPI(input);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      if (shouldShowLeadForm(input) && !leadData.captured) {
        setTimeout(() => {
          setShowLeadForm(true);
        }, 1000);
      }

      await logAnalytics('bot_response', {
        responseLength: botResponse.length,
        conversationCount,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: `Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo o contacta a nuestro equipo en hola@dilauro.com`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
      await logAnalytics('error', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío de formulario de leads
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadData.email || !leadData.name) {
      setError('Por favor completa al menos nombre y email');
      return;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          segment: userSegment,
          sessionId: sessionIdRef.current,
          capturedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar lead');
      }

      setLeadData(prev => ({ ...prev, captured: true }));
      setShowLeadForm(false);

      const confirmMsg: Message = {
        id: Date.now().toString(),
        type: 'system',
        text: `✅ ¡Gracias ${leadData.name}! Hemos recibido tu información. Nos pondremos en contacto pronto a ${leadData.email}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);

      await logAnalytics('lead_captured', {
        email: leadData.email,
        name: leadData.name,
        company: leadData.company,
        segment: userSegment,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      await logAnalytics('lead_capture_error', { error: errorMsg });
    }
  };

  // Manejar escalada a humanos
  const handleEscalation = async () => {
    const escalationMsg: Message = {
      id: Date.now().toString(),
      type: 'system',
      text: '📞 Perfecto. Un agente humano se pondrá en contacto contigo pronto. Mientras tanto, puedes escribirnos a hola@dilauro.com o llamar a nuestro equipo de soporte.',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, escalationMsg]);
    setShowEscalation(false);

    if (!leadData.captured) {
      setShowLeadForm(true);
    }

    await logAnalytics('escalation_accepted', {});
  };

  // Manejar preguntas rápidas
  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
      form?.dispatchEvent(new Event('submit', { bubbles: true }));
    }, 0);
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
    logAnalytics('chat_closed', { conversationCount, segment: userSegment });
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            logAnalytics('chat_opened', {});
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center z-40 hover:scale-110"
          aria-label="Abrir chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Ventana del chat */}
      {open && (
        <div className="fixed bottom-6 right-6 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">DILAURO Support</h3>
              <p className="text-xs text-blue-100">IA + Soporte Humano 🤖</p>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-blue-500 p-1 rounded transition"
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Selección de Segmento */}
          {showSegmentSelection && (
            <div className="px-4 py-4 bg-blue-50 border-b border-blue-200">
              <div className="grid grid-cols-2 gap-2">
                {(['startup', 'enterprise', 'agency', 'freelancer'] as UserSegment[]).map((seg) => (
                  <button
                    key={seg}
                    onClick={() => handleSegmentSelection(seg)}
                    className="bg-white border border-blue-300 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs font-medium transition"
                  >
                    {seg.charAt(0).toUpperCase() + seg.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : msg.type === 'system'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-none'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Indicador de escritura */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Mostrar error si existe */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                {error}
              </div>
            )}

            {/* Botones de escalada */}
            {showEscalation && (
              <div className="flex gap-2">
                <button
                  onClick={handleEscalation}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-medium transition flex items-center justify-center gap-1"
                >
                  <Phone size={14} /> Sí, conectarme
                </button>
                <button
                  onClick={() => setShowEscalation(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 px-3 py-2 rounded text-xs font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Lead */}
          {showLeadForm && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
              <p className="text-xs text-blue-900 font-medium mb-2">📧 Cuéntanos más para ayudarte mejor:</p>
              <form onSubmit={handleLeadSubmit} className="space-y-2">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={leadData.name}
                  onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Tu email"
                  value={leadData.email}
                  onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={leadData.phone}
                  onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Empresa (opcional)"
                  value={leadData.company}
                  onChange={(e) => setLeadData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition"
                >
                  Enviar información
                </button>
              </form>
            </div>
          )}

          {/* Preguntas rápidas */}
          {messages.length <= 2 && !isLoading && !showLeadForm && !showSegmentSelection && (
            <div className="px-4 py-3 bg-white border-t border-slate-200">
              <p className="text-xs text-slate-600 mb-2 font-medium">Preguntas frecuentes:</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 px-2 py-1 rounded transition font-medium"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            data-chat-form
            className="border-t border-slate-200 p-3 bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition"
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

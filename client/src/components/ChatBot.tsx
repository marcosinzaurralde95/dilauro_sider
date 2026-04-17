import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Base de conocimiento del chatbot
const KNOWLEDGE_BASE: Record<string, string[]> = {
  'que es dilauro': [
    'DILAURO es una solución de presencia digital premium diseñada para marcas de élite. Ofrecemos una experiencia de activación rápida, UX sin fricción y diseño orientado a conversión de alto impacto.',
  ],
  'como funciona': [
    'DILAURO funciona en 4 pasos simples: 1) Descubre nuestra propuesta en segundos, 2) Conecta con el valor de forma clara, 3) Decide tu siguiente paso sin dudas, 4) Avanza hacia la conversión real.',
  ],
  'cuales son los beneficios': [
    'Nuestros principales beneficios son: Presencia Premium (identidad digital sobria y memorable), Claridad Instantánea (mensajes precisos), Experiencia Fluida (estructura intuitiva), y Conversión Optimizada (CTAs estratégicos).',
  ],
  'precio': [
    'Para información sobre precios y planes personalizados, te invitamos a solicitar una demo o hablar directamente con nuestro equipo. Cada solución es adaptada a las necesidades específicas de tu marca.',
  ],
  'como solicitar acceso': [
    'Puedes solicitar acceso de varias formas: 1) Haz clic en el botón "Solicitar acceso" en la parte superior, 2) Completa el formulario de contacto, 3) Envía un email a hola@dilauro.com, o 4) Conecta con nosotros en LinkedIn.',
  ],
  'tiempo de activacion': [
    'DILAURO está diseñado para activación inmediata. Sin esperas, sin rodeos. La mayoría de nuestros clientes ven resultados en las primeras 48 horas de implementación.',
  ],
  'soporte': [
    'Contamos con un equipo de soporte disponible para ayudarte. Puedes contactarnos a través de: Email: hola@dilauro.com, LinkedIn, o directamente a través de este chat. ¿Hay algo específico en lo que podamos ayudarte?',
  ],
  'contacto': [
    'Puedes contactarnos de varias formas: Email: hola@dilauro.com, LinkedIn: linkedin.com/company/dilauro, o a través de este chat. Estamos aquí para ayudarte con cualquier pregunta.',
  ],
  'demo': [
    'Nos encantaría mostrarte cómo DILAURO puede transformar tu presencia digital. Haz clic en "Solicitar una demo" en la página o envíanos un email a hola@dilauro.com para agendar una sesión personalizada.',
  ],
};

// Respuestas por defecto
const DEFAULT_RESPONSES = [
  '¿Podrías reformular tu pregunta? Estoy aquí para ayudarte con información sobre DILAURO.',
  'Interesante pregunta. Para obtener una respuesta más detallada, te recomiendo que hables directamente con nuestro equipo. ¿Hay algo más en lo que pueda ayudarte?',
  'No tengo información específica sobre eso, pero nuestro equipo puede ayudarte. ¿Te gustaría que te conectemos con alguien del equipo?',
];

const GREETING_MESSAGES = [
  '¡Hola! 👋 Bienvenido a DILAURO. Soy tu asistente de soporte. ¿Cómo puedo ayudarte hoy?',
  '¡Hola! 👋 Estoy aquí para responder tus preguntas sobre DILAURO. ¿Qué te gustaría saber?',
  '¡Bienvenido! 👋 Soy el chatbot de DILAURO. ¿En qué puedo asistirte?',
];

const QUICK_QUESTIONS = [
  '¿Qué es DILAURO?',
  '¿Cómo funciona?',
  'Beneficios',
  'Solicitar demo',
];

export default function ChatBot({ isOpen = false, onClose }: ChatBotProps) {
  const [open, setOpen] = useState(isOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
      setMessages([
        {
          id: '1',
          type: 'bot',
          text: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [open]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Función para encontrar respuesta en la base de conocimiento
  const findAnswer = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [key, responses] of Object.entries(KNOWLEDGE_BASE)) {
      if (lowerMessage.includes(key)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
  };

  // Manejar envío de mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simular delay de respuesta (como si estuviera "escribiendo")
    setTimeout(() => {
      const botResponse = findAnswer(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
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
  };

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
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
              <p className="text-xs text-blue-100">Respuestas instantáneas 24/7</p>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-blue-500 p-1 rounded transition"
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>

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

            <div ref={messagesEndRef} />
          </div>

          {/* Preguntas rápidas (mostrar solo si no hay muchos mensajes) */}
          {messages.length <= 1 && !isLoading && (
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

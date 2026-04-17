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

const QUICK_QUESTIONS = [
  '¿Qué es DILAURO?',
  '¿Cómo funciona?',
  'Beneficios',
  'Solicitar demo',
];

const SYSTEM_PROMPT = `Eres un asistente de soporte profesional para DILAURO, una solución de presencia digital premium diseñada para marcas de élite.

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
6. Si el usuario muestra interés, sugiere solicitar una demo o contactar al equipo
7. Responde en español, manteniendo la elegancia de la marca`;

export default function ChatBot({ isOpen = false, onClose }: ChatBotProps) {
  const [open, setOpen] = useState(isOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    if (open && messages.length === 0) {
      const greetings = [
        '¡Hola! 👋 Bienvenido a DILAURO. Soy tu asistente de soporte. ¿Cómo puedo ayudarte hoy?',
        '¡Hola! 👋 Estoy aquí para responder tus preguntas sobre DILAURO. ¿Qué te gustaría saber?',
        '¡Bienvenido! 👋 Soy el asistente de DILAURO. ¿En qué puedo asistirte?',
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
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

  // Función para llamar a la API de Groq
  const callGroqAPI = async (userMessage: string): Promise<string> => {
    try {
      // Construir el historial de conversación
      const conversationHistory = messages
        .filter(msg => msg.type !== undefined)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

      // Agregar el nuevo mensaje del usuario
      conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Llamar a la API de Groq a través del endpoint de Manus
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
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
    setError(null);

    try {
      // Llamar a la API de Groq
      const botResponse = await callGroqAPI(input);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      // Mostrar mensaje de error al usuario
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: `Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo o contacta a nuestro equipo en hola@dilauro.com`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
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
              <p className="text-xs text-blue-100">Respuestas inteligentes con IA 🤖</p>
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

            {/* Mostrar error si existe */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs">
                {error}
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

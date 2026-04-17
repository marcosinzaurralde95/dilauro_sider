export default function Home() {
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold tracking-tight text-slate-900">DILAURO</div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#propuesta" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Propuesta</a>
            <a href="#beneficios" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Beneficios</a>
            <a href="#proceso" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Proceso</a>
            <a href="#contacto" className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 hover:bg-slate-50 transition">Contacto</a>
            <a href="#" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200">Empezar</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-16 text-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <span className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-blue-600 uppercase tracking-wider mb-6">Nueva Generación Digital</span>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">Elegancia que <br className="hidden md:block" />avanza contigo.</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">Diseñado para quienes exigen una experiencia impecable. Minimalismo, precisión y valor inmediato en una propuesta creada para destacar.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Descubrir DILAURO</a>
            <a href="#" className="px-8 py-3 border border-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition">Solicitar acceso</a>
          </div>
        </div>
      </header>

      {/* Value Proposition */}
      <section id="propuesta" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="inline-block px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-blue-600 uppercase tracking-wider mb-6">Propuesta de Valor</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Una experiencia diseñada para activar e impresionar.</h2>
              <p className="text-lg text-slate-600 mb-8">En DILAURO, cada detalle existe por una razón: acelerar la conexión entre la marca y la decisión. Estética high-end, claridad radical y una experiencia creada para mostrar valor desde el primer momento.</p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong className="text-slate-900">Activación inmediata:</strong>
                    <p className="text-slate-600">Sin esperas, sin rodeos.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong className="text-slate-900">UX sin fricción:</strong>
                    <p className="text-slate-600">Navegación intuitiva y fluida.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong className="text-slate-900">Time-To-Value reducido:</strong>
                    <p className="text-slate-600">El valor se percibe al instante.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl h-96 flex items-center justify-center relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl font-bold opacity-5 transform -rotate-45">DILAURO PREVIEW</div>
              <div className="relative z-10 text-center">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-slate-500 font-medium">Espacio para demostración visual</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Todo lo que una marca contemporánea necesita</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Presencia Premium", desc: "Una identidad digital sobria, moderna y memorable que respira autoridad." },
              { title: "Claridad Instantánea", desc: "Mensajes precisos que comunican valor sin esfuerzo al usuario." },
              { title: "Experiencia Fluida", desc: "Una estructura intuitiva pensada para avanzar hacia la conversión." },
              { title: "Conversión Optimizada", desc: "Arquitectura enfocada en la acción con CTAs estratégicamente ubicados." }
            ].map((benefit, idx) => (
              <div key={idx} className="p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 transition duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="proceso" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Activación sin interrupciones</h2>
            <p className="text-lg text-slate-600">De la primera impresión a la acción en 4 pasos simples.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: "Descubre", desc: "Entiende la propuesta en segundos." },
              { num: 2, title: "Conecta", desc: "Percibe el valor con claridad total." },
              { num: 3, title: "Decide", desc: "Encuentra el siguiente paso sin dudar." },
              { num: 4, title: "Avanza", desc: "Convierte interés en acción real." }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {step.num}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">El siguiente estándar empieza aquí</h2>
          <p className="text-lg text-slate-600 mb-8">DILAURO convierte claridad, estética y velocidad en una experiencia superior.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Solicitar una demo</a>
            <a href="#" className="px-8 py-3 border border-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition">Hablar con DILAURO</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4">DILAURO</h3>
              <p className="text-slate-400 text-sm">Elegancia digital para una nueva generación de marcas exigentes.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navegación</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition">Inicio</a></li>
                <li><a href="#propuesta" className="hover:text-blue-400 transition">Propuesta</a></li>
                <li><a href="#beneficios" className="hover:text-blue-400 transition">Beneficios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="mailto:hola@dilauro.com" className="hover:text-blue-400 transition">hola@dilauro.com</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <p>&copy; 2026 DILAURO. Todos los derechos reservados.</p>
            <p>Diseñado para marcas que entienden el valor de la primera impresión.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

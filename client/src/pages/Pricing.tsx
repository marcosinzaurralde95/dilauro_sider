import { useState, useEffect } from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription/plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleCheckout = async () => {
    if (!email) {
      alert('Por favor ingresa tu email');
      return;
    }

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          email,
          referralCode: referralCode || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirigir a Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al procesar el pago');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Cargando planes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Planes de DILAURO</h1>
          <p className="text-xl text-slate-600">Elige el plan perfecto para tu negocio</p>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 transition transform hover:scale-105 ${
                selectedPlan === plan.id
                  ? 'bg-blue-600 text-white shadow-2xl ring-2 ring-blue-400'
                  : 'bg-white text-slate-900 shadow-lg'
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${(plan.price / 100).toFixed(2)}</span>
                <span className={selectedPlan === plan.id ? 'text-blue-100' : 'text-slate-600'}>/mes</span>
              </div>

              <button
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full py-2 px-4 rounded-lg font-semibold mb-6 transition ${
                  selectedPlan === plan.id
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedPlan === plan.id ? 'Seleccionado' : 'Seleccionar'}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check size={20} className={selectedPlan === plan.id ? 'text-green-300' : 'text-green-500'} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Checkout Form */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Completa tu compra</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Código de Referral (opcional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="REF-XXXXX"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              Proceder al Pago
              <ArrowRight size={20} />
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            Los pagos son procesados de forma segura por Stripe
          </p>
        </div>

        {/* Beneficios */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="font-bold text-slate-900 mb-2">Seguro</h3>
            <p className="text-slate-600">Tus datos están protegidos con encriptación de nivel empresarial</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-slate-900 mb-2">Rápido</h3>
            <p className="text-slate-600">Acceso inmediato a tu plan después del pago</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold text-slate-900 mb-2">Soporte</h3>
            <p className="text-slate-600">Equipo disponible 24/7 para ayudarte</p>
          </div>
        </div>
      </div>
    </div>
  );
}

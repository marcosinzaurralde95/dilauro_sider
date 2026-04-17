import { useState, useEffect } from 'react';
import { Copy, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ReferralStats {
  id: string;
  userId: string;
  email: string;
  name: string;
  referralCode: string;
  referralLink: string;
  totalEarnings: number;
  totalReferrals: number;
  createdAt: string;
}

export default function Referrals() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
      fetchStats(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStats = async (id: string) => {
    try {
      const response = await fetch(`/api/referrals/stats/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    if (!userId) {
      alert('Por favor inicia sesión primero');
      return;
    }

    try {
      const response = await fetch('/api/referrals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: localStorage.getItem('userEmail') || 'user@example.com',
          name: localStorage.getItem('userName') || 'Usuario',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Programa de Referrals</h1>
          <p className="text-slate-600 mb-6">Por favor inicia sesión para acceder al programa de referrals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Programa de Referrals</h1>
          <p className="text-xl text-slate-600">Gana comisiones invitando a otros usuarios</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Referrals Totales</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.totalReferrals || 0}</p>
              </div>
              <Users size={32} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Ganancias Totales</p>
                <p className="text-3xl font-bold text-slate-900">${((stats?.totalEarnings || 0) / 100).toFixed(2)}</p>
              </div>
              <DollarSign size={32} className="text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Comisión por Referral</p>
                <p className="text-3xl font-bold text-slate-900">20%</p>
              </div>
              <TrendingUp size={32} className="text-purple-500" />
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        {stats ? (
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tu Código de Referral</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Código</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stats.referralCode}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                  <button
                    onClick={() => copyToClipboard(stats.referralCode)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link de Referral</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stats.referralLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(stats.referralLink)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                  >
                    <Copy size={18} />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
            <p className="text-slate-600 mb-4">No tienes un código de referral aún</p>
            <button
              onClick={generateReferralCode}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Generar Código de Referral
            </button>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Cómo Funciona</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Comparte tu código</h3>
                <p className="text-slate-600">Envía tu código de referral a amigos y colegas</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Ellos se suscriben</h3>
                <p className="text-slate-600">Cuando usan tu código para suscribirse a un plan</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Ganas comisión</h3>
                <p className="text-slate-600">Recibe el 20% de cada suscripción que generes</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Retira tus ganancias</h3>
                <p className="text-slate-600">Transfiere tus comisiones a tu cuenta bancaria mensualmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface ABTestStats {
  variant_a: {
    conversions: number;
    sessions: number;
    conversionRate: string;
  };
  variant_b: {
    conversions: number;
    sessions: number;
    conversionRate: string;
  };
}

export default function ABTesting() {
  const [stats, setStats] = useState<ABTestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ab-test/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching A/B test stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStats, 30000);
    }
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin mb-4">
            <RefreshCw size={32} />
          </div>
          <p>Cargando A/B test stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Variant A',
      sessions: stats.variant_a.sessions,
      conversions: stats.variant_a.conversions,
      conversionRate: parseFloat(stats.variant_a.conversionRate),
    },
    {
      name: 'Variant B',
      sessions: stats.variant_b.sessions,
      conversions: stats.variant_b.conversions,
      conversionRate: parseFloat(stats.variant_b.conversionRate),
    },
  ];

  const winner = parseFloat(stats.variant_a.conversionRate) > parseFloat(stats.variant_b.conversionRate) 
    ? 'Variant A' 
    : parseFloat(stats.variant_b.conversionRate) > parseFloat(stats.variant_a.conversionRate)
    ? 'Variant B'
    : 'Tie';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">A/B Testing Dashboard</h1>
            <p className="text-slate-400">DILAURO - Optimización de Chatbot</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchStats}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <RefreshCw size={18} /> Actualizar
            </button>
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              Auto-actualizar
            </label>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Ganador</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{winner}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Variant A Conversion Rate</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.variant_a.conversionRate}%</p>
            <p className="text-xs text-slate-400 mt-2">{stats.variant_a.conversions} / {stats.variant_a.sessions}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm">Variant B Conversion Rate</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{stats.variant_b.conversionRate}%</p>
            <p className="text-xs text-slate-400 mt-2">{stats.variant_b.conversions} / {stats.variant_b.sessions}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sesiones y Conversiones */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Sesiones vs Conversiones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="sessions" fill="#3b82f6" name="Sesiones" />
                <Bar dataKey="conversions" fill="#10b981" name="Conversiones" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasa de Conversión */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Tasa de Conversión</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => `${value}%`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="#8b5cf6" 
                  name="Conversion Rate (%)"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-green-400" />
            Recomendaciones
          </h3>
          <div className="space-y-3 text-slate-300">
            {winner !== 'Tie' ? (
              <>
                <p>✅ <strong>{winner}</strong> está ganando con una tasa de conversión de <strong>{winner === 'Variant A' ? stats.variant_a.conversionRate : stats.variant_b.conversionRate}%</strong></p>
                <p>📊 Diferencia: <strong>{Math.abs(parseFloat(stats.variant_a.conversionRate) - parseFloat(stats.variant_b.conversionRate)).toFixed(2)}%</strong></p>
                <p>🎯 Recomendación: Implementar {winner} como variante por defecto en el chatbot</p>
              </>
            ) : (
              <p>⚖️ Ambas variantes tienen tasas de conversión similares. Continúa recopilando datos para obtener resultados más concluyentes.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Última actualización: {new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}

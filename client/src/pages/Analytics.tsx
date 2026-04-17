import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, TrendingUp, Users, MessageSquare, Mail } from 'lucide-react';

interface AnalyticsStats {
  totalEvents: number;
  totalSessions: number;
  totalMessages: number;
  totalLeads: number;
  conversionRate: string;
  leadsBySegment: Record<string, number>;
  eventTypes: string[];
  recentLeads: any[];
  recentEvents: any[];
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh cada 30 segundos si está habilitado
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
          <p>Cargando analytics...</p>
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

  // Preparar datos para gráficos
  const segmentData = Object.entries(stats.leadsBySegment).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard de Analytics</h1>
            <p className="text-slate-400">DILAURO - Métricas en Tiempo Real</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Sesiones Totales</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalSessions}</p>
              </div>
              <Users size={32} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Mensajes</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalMessages}</p>
              </div>
              <MessageSquare size={32} className="text-purple-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Leads Capturados</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalLeads}</p>
              </div>
              <Mail size={32} className="text-green-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Tasa de Conversión</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.conversionRate}</p>
              </div>
              <TrendingUp size={32} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Leads por Segmento */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Leads por Segmento</h3>
            {segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-8">Sin datos disponibles</p>
            )}
          </div>

          {/* Eventos por Tipo */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Tipos de Eventos</h3>
            <div className="space-y-2">
              {stats.eventTypes.map((eventType) => {
                const count = stats.recentEvents.filter(e => e.eventType === eventType).length;
                return (
                  <div key={eventType} className="flex justify-between items-center">
                    <span className="text-slate-300">{eventType}</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leads Recientes */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-white mb-4">Leads Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Segmento</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.length > 0 ? (
                  stats.recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                      <td className="py-3 px-4 text-white">{lead.name}</td>
                      <td className="py-3 px-4 text-slate-300">{lead.email}</td>
                      <td className="py-3 px-4 text-slate-300">{lead.company || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-600/30 text-purple-300 px-2 py-1 rounded text-xs">
                          {lead.segment || 'general'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(lead.recordedAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-4 text-center text-slate-400">
                      Sin leads capturados aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

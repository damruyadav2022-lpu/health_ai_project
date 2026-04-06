import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  TrendingUp, Activity, Users, Thermometer, ShieldCheck, 
  Heart, AlertTriangle, CheckCircle2
} from 'lucide-react';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import { historyAPI, patientsAPI } from '../api/client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    admissionsTrend: [{name: 'Jan', value: 5}, {name: 'Feb', value: 8}],
    diseasePrevalence: [{name: 'Common Cold', value: 10}],
    statusDistribution: [{name: 'Stable', value: 100}],
    vitalsAverage: { hr: 72, temp: 98.6, spo2: 98 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, patRes] = await Promise.all([
          historyAPI.list(1, 1000).catch(() => ({ data: { items: [] } })),
          patientsAPI.list().catch(() => ({ data: [] }))
        ]);

        const histItems = Array.isArray(histRes?.data?.items) ? histRes.data.items : [];
        const patItems = Array.isArray(patRes?.data) ? patRes.data : [];
        
        setHistory(histItems);
        setPatients(patItems);

        // 1. Admissions Trend
        const trendMap = {};
        patItems.forEach(p => {
          if (p?.created_at) {
            try {
              const date = new Date(p.created_at);
              if (!isNaN(date.getTime())) {
                const month = MONTHS[date.getMonth()];
                trendMap[month] = (trendMap[month] || 0) + 1;
              }
            } catch(e) {}
          }
        });
        const admissionsTrend = Object.entries(trendMap).map(([name, value]) => ({ name, value }));

        // 2. Disease Prevalence
        const diseaseMap = {};
        histItems.forEach(h => {
          if (h?.top_disease) {
            diseaseMap[h.top_disease] = (diseaseMap[h.top_disease] || 0) + 1;
          }
        });
        const diseasePrevalence = Object.entries(diseaseMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        // 3. Status Distribution
        const statusMap = { Stable: 0, Critical: 0, Unstable: 0, Recovered: 0 };
        patItems.forEach(p => {
          const s = p?.status || 'Stable';
          if (statusMap[s] !== undefined) statusMap[s]++;
        });
        const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

        // 4. Vitals
        const validCount = Math.max(patItems.length, 1);
        const vitalsAverage = {
          hr: Math.round(patItems.reduce((acc, p) => acc + (Number(p?.heart_rate) || 72), 0) / validCount),
          spo2: Math.round(patItems.reduce((acc, p) => acc + (Number(p?.oxygen_level) || 98), 0) / validCount),
          temp: (patItems.reduce((acc, p) => acc + (Number(p?.temperature) || 98.6), 0) / validCount).toFixed(1),
        };

        setStats({
          admissionsTrend: admissionsTrend.length ? admissionsTrend : stats.admissionsTrend,
          diseasePrevalence: diseasePrevalence.length ? diseasePrevalence : stats.diseasePrevalence,
          statusDistribution: statusDistribution.length ? statusDistribution : stats.statusDistribution,
          vitalsAverage
        });
      } catch (err) {
        console.error("Critical Analytics Engine Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Nexus Analytics">
        <div className="flex h-[80vh] w-full items-center justify-center">
           <div className="flex flex-col items-center gap-6 text-center">
              <Activity className="h-14 w-14 text-brand-500 animate-pulse" />
              <div className="space-y-1">
                 <p className="text-white font-bold tracking-widest text-sm uppercase">Neural Sync Active</p>
                 <p className="text-slate-500 text-[10px] uppercase tracking-widest">Optimizing Data Hub...</p>
              </div>
           </div>
        </div>
      </Layout>
    );
  }

  // Safety Checks for metrics
  const safeHistory = history || [];
  const safePatients = patients || [];
  const activeCases = safePatients.filter(p => p?.status === 'Critical' || p?.status === 'Unstable').length;
  const treatedPatients = safePatients.filter(p => p?.status === 'Stable' || p?.status === 'Recovered').length;

  return (
    <Layout title="Advanced Medical Intelligence">
      <div className="space-y-6 pb-12">
        {/* KPI Row */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Critical Path" value={activeCases} icon={AlertTriangle} color="#ef4444" subtitle="Active High-Risk Monitoring" delay={0} />
          <KPICard title="Condition Stabilized" value={treatedPatients} icon={CheckCircle2} color="#10b981" subtitle="Condition Resolved" delay={0.05} />
          <KPICard title="Total Records" value={safeHistory.length} icon={Activity} color="#0ea5e9" subtitle="Clinical assessments" delay={0.10} />
          <KPICard title="Average Satiety" value={`${stats.vitalsAverage.spo2}%`} icon={ShieldCheck} color="#8b5cf6" subtitle="SpO2 Normalization" delay={0.15} />
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="xl:col-span-2 glass p-6 rounded-3xl h-[420px]">
            <h3 className="text-white font-bold mb-8 flex items-center gap-3">
              <TrendingUp size={20} className="text-blue-400" /> Patient Ingress Analysis
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.admissionsTrend}>
                  <defs>
                    <linearGradient id="nexus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0a0f18', border: '1px solid #1e293b', borderRadius: '14px' }} />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={5} fill="url(#nexus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-3xl h-[420px]">
            <h3 className="text-white font-bold mb-8 flex items-center gap-3">
              <Activity size={20} className="text-emerald-400" /> Status Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <Tooltip cursor={{ fill: '#1e293b20' }} contentStyle={{ background: '#0a0f18', border: 'none', borderRadius: '10px' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                    {stats.statusDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.name === 'Critical' ? '#ef4444' : (entry.name === 'Stable' ? '#10b981' : '#f59e0b')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="glass p-6 rounded-3xl h-[420px]">
            <h3 className="text-white font-bold mb-8 flex items-center gap-3">
              <Activity size={20} className="text-purple-400" /> Neural Diagnosis Prevalence
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.diseasePrevalence.length ? stats.diseasePrevalence : [{name: 'Syncing...', value: 1}]}
                    cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={10} dataKey="value"
                  >
                    {stats.diseasePrevalence.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0a0f18', border: 'none', borderRadius: '10px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="xl:col-span-2 glass p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 h-[420px] items-center">
             <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 h-full group hover:bg-blue-500/10 transition-all">
                <Heart className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={48} />
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Heart Rate Average</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-6xl font-black">{stats.vitalsAverage.hr}</span>
                  <span className="text-slate-600 text-lg font-bold">BPM</span>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-purple-500/5 border border-purple-500/10 h-full group hover:bg-purple-500/10 transition-all">
                <Thermometer className="text-purple-400 mb-6 group-hover:scale-110 transition-transform" size={48} />
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Thermal Average</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-6xl font-black">{stats.vitalsAverage.temp}</span>
                  <span className="text-slate-600 text-lg font-bold">°F</span>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-emerald-500/[0.08] border border-emerald-500/20 h-full shadow-2xl shadow-emerald-500/10">
                <ShieldCheck className="text-emerald-400 mb-6" size={56} />
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Neural Status</p>
                <p className="text-emerald-400 text-5xl font-black tracking-tighter">PRIME</p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-slate-500 text-[9px] uppercase tracking-widest">Nodes Synchronized</span>
                </div>
             </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}

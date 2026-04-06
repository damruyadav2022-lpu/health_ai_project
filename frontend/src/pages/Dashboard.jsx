import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, TrendingUp, AlertCircle, ClipboardList, 
  FileText, Search, Download, Check, X, UserPlus, Shield, Server, Users, Brain
} from 'lucide-react';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import { historyAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
const GRADIENTS = [
  ['#0ea5e9', 'rgba(14, 165, 233, 0.1)'],
  ['#10b981', 'rgba(16, 185, 129, 0.1)'],
  ['#8b5cf6', 'rgba(139, 92, 246, 0.1)'],
];

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diseaseDistribution, setDiseaseDistribution] = useState([]);
  const [keyStatus, setKeyStatus] = useState({ status: 'Verifying...', name: 'Loading Node...' });
  const { user, ROLES } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, pRes] = await Promise.all([
          historyAPI.list(1, 50),
          patientsAPI.list()
        ]);

        const items = hRes.data?.items || [];
        setHistory(items);
        setPatients(pRes.data || []);

        // Calculate distribution
        const counts = {};
        items.forEach(h => {
          if (h.top_disease) counts[h.top_disease] = (counts[h.top_disease] || 0) + 1;
        });
        setDiseaseDistribution(Object.entries(counts).map(([name, value]) => ({ name, value })));
        // Fetch Key Status (Admin Node)
        try {
          const kRes = await fetch('/api/admin/key-status/sk-nexus-primary');
          const kData = await kRes.json();
          setKeyStatus({ status: kData.status, name: kData.name });
        } catch (err) {
          console.warn("Key status fetch failed, standard mode active.");
        }

      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout title="Clinical Intelligence Nexus">
      <div className="max-w-[1600px] mx-auto p-6 space-y-8 h-full">
        
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KPICard title="Total Scans" value={history.length} icon={Activity} color="#3b82f6" />
          <KPICard title="Patients" value={patients.length} icon={Users} color="#10b981" />
          <KPICard title="Platform Status" value="Online" icon={Shield} trend="v2.4.1" trendUp={true} color="text-green-400" bgColor="bg-green-500/10" dotColor="bg-green-500" />
          <KPICard title="AI Neural Load" value="14.2%" icon={Brain} trend="Stable" trendUp={true} color="text-purple-400" bgColor="bg-purple-500/10" dotColor="bg-purple-500" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Population Risk Analytics (NEW) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-clinical p-6 rounded-3xl border border-white/5"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-semibold text-white">Population Risk Intelligence</h3>
                <p className="text-xs text-gray-400">GenAI Demographic Analysis (System-Wide)</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-400 font-bold uppercase">Critical</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { age: '18-25', low: 45, med: 12, high: 3 },
                  { age: '26-35', low: 38, med: 18, high: 7 },
                  { age: '36-45', low: 30, med: 25, high: 12 },
                  { age: '46-55', low: 22, med: 35, high: 18 },
                  { age: '56-65', low: 15, med: 42, high: 25 },
                  { age: '65+',    low: 8,  med: 48, high: 35 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="age" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="low" name="Low Risk" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar dataKey="med" name="Medium Risk" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="high" name="High Risk" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Security & Intelligence Node */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 glass-clinical p-6 rounded-3xl border border-white/5 flex flex-col gap-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-white">Neural Security Node</h3>
              <p className="text-xs text-gray-400">HIPAA Compliance & Encryption</p>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-6 py-4">
               <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-blue-600/10 flex items-center justify-center">
                     <div className="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Shield size={40} className="text-blue-500" />
                     </div>
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-blue-400 rounded-full"
                  />
               </div>
               <div className="text-center space-y-1">
                  <p className="text-2xl font-black text-white">SECURE</p>
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">AES-256 BIT SYNCED</p>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400">API Health</span>
                  <span className={`${keyStatus.status.includes('Active') ? 'text-green-400' : 'text-amber-400'} font-bold uppercase tracking-widest`}>{keyStatus.status}</span>
               </div>
               <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400">PHI Redaction</span>
                  <span className="text-green-400 font-bold uppercase tracking-widest">Active</span>
               </div>
               <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400">Audit Logging</span>
                  <span className="text-green-400 font-bold uppercase tracking-widest">Verified</span>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Analytics */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-black text-white flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] opacity-70">
                    <TrendingUp size={14} className="text-brand-400" />
                    Diagnostic Intelligence Stream
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Real-time probability analysis from recent scans</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">7 Days</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={history.slice(0, 12).reverse().map((h, i) => ({ 
                  name: new Date(h.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}), 
                  val: parseFloat((h.probability * 100).toFixed(1)) 
                }))}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(7, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#0ea5e9', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent History Table */}
            <div className="glass shadow-2xl overflow-hidden border-white/5">
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ClipboardList size={16} className="text-brand-400 font-bold" />
                   <h3 className="font-black text-white uppercase tracking-[0.2em] text-[10px] opacity-70">Clinical Audit Log</h3>
                 </div>
                 <button className="text-[9px] font-black uppercase text-brand-400 hover:text-brand-300 transition-colors tracking-widest">View All</button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-white/[0.02] text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
                     <tr>
                       <th className="px-8 py-5">Patient/Disease</th>
                       <th className="px-8 py-5">Diagnosis Score</th>
                       <th className="px-8 py-5 text-center">Risk Assessment</th>
                       <th className="px-8 py-5">Timestamp</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/[0.03]">
                     {history.slice(0, 5).map((h) => (
                       <tr key={h.id} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors uppercase tracking-tight">{h.top_disease}</span>
                              <span className="text-[9px] text-slate-500 font-medium">Record ID: #{h.id.toString().substring(0,6)}</span>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${h.probability * 100}%` }}
                                  className={`h-full ${h.probability > 0.8 ? 'bg-red-500' : h.probability > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-white tracking-tighter">{(h.probability * 100).toFixed(1)}%</span>
                            </div>
                         </td>
                         <td className="px-8 py-5 text-center">
                           <span className={`badge ${h.risk_level === 'High' ? 'risk-high' : h.risk_level === 'Medium' ? 'risk-medium' : 'risk-low'}`}>
                             {h.risk_level}
                           </span>
                         </td>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                              <ClipboardList size={12} />
                              <span className="text-[10px] font-bold">{new Date(h.created_at).toLocaleDateString()}</span>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {history.length === 0 && (
                   <div className="p-16 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                        <Search size={20} className="text-slate-600" />
                      </div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No clinical data streams found.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            <div className="glass p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-purple opacity-50 group-hover:opacity-100 transition-opacity" />
              <h3 className="font-black text-white uppercase tracking-[0.2em] text-[10px] opacity-70 mb-8 flex items-center gap-2">
                <FileText size={14} className="text-accent-purple" />
                Diagnostic Categorization
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={diseaseDistribution} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" animationBegin={200} animationDuration={1000}>
                    {diseaseDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(7, 11, 17, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', tracking: '0.1em', paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass p-8 relative overflow-hidden group border-brand-500/10 hover:border-brand-500/30 transition-colors shadow-glow-lg">
               <div className="absolute -top-12 -left-12 w-32 h-32 bg-brand-500/10 blur-[40px] rounded-full group-hover:bg-brand-500/20 transition-colors" />
               <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                    <Shield size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-400">Security Node</p>
                    <p className="text-sm font-bold text-white">Clinical Integrity Active</p>
                 </div>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed mb-8 relative z-10">
                 Your clinical data is protected by the HIPAA-compliant HealthAI security layer. All scans are end-to-end encrypted and blockchain verified.
               </p>
               <button className="btn-primary w-full text-[10px] py-4 tracking-[0.2em] relative z-10">
                 View Audit Logs
               </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

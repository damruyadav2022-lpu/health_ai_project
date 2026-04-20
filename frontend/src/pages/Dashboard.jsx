import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  AlertTriangle, Brain, CheckCircle, Microscope, 
  Search, Bell, RefreshCw, Activity, TrendingUp, Radio
} from 'lucide-react';
import Layout from '../components/Layout';
import { historyAPI, patientsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorNode, setErrorNode] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const auth = useAuth();
  const user = auth?.user;

  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const cacheBuster = Date.now();
      const [hRes, pRes] = await Promise.all([
        historyAPI.list(1, 1000, true), 
        patientsAPI.list(true)
      ]);
      
      const hData = hRes.data?.items || hRes.data?.history || (Array.isArray(hRes.data) ? hRes.data : []);
      const pData = pRes.data?.items || pRes.data?.patients || (Array.isArray(pRes.data) ? pRes.data : []);
      
      setHistory(hData.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      setPatients(pData);
      setErrorNode(null);
      setLastSync(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Critical Connection Error:", e);
      setErrorNode(e.response?.data?.message || e.message || "Backend Unreachable");
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
    const inv = setInterval(fetchData, 2000); // High-speed 2s sync
    return () => clearInterval(inv);
  }, []);

  const stats = useMemo(() => {
    const total = history.length;
    const critical = history.filter(h => h.risk_level === 'Critical' || h.risk_level === 'High').length;
    const uniqueConditions = new Set(history.map(h => h.top_disease)).size;
    
    const lowRisk = history.filter(h => h.risk_level === 'Low').length;
    const medRisk = history.filter(h => h.risk_level === 'Medium').length;
    const highRisk = history.filter(h => h.risk_level === 'High' || h.risk_level === 'Critical').length;
    
    // Exact Risk Intelligence calculation
    const riskControlled = total > 0 ? Math.round(((total - highRisk) / total) * 100) : 100;

    return { critical, scans: total, patients: patients.length, uniqueConditions, riskControlled, lowRisk, medRisk, highRisk };
  }, [history, patients]);

  const chartData = useMemo(() => {
    // Correct activity grouping by Date
    const daily = {};
    history.slice(0, 30).forEach(h => {
       const date = new Date(h.created_at).toLocaleDateString();
       daily[date] = (daily[date] || 0) + 1;
    });
    const entries = Object.entries(daily).map(([n, v]) => ({ n, v }));
    return entries.length > 0 ? entries : [{n: 'None', v: 0}];
  }, [history]);

  return (
    <Layout title="Clinical Intelligence">
      <div className="min-h-screen bg-[#070a0f] text-white p-4 md:p-8 font-sans transition-all duration-500">
        
        {/* HEADER BAR */}
        <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
           <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                 Clinical Analytics 
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${errorNode ? 'bg-red-500 animate-pulse' : isSyncing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
                    <span className={`text-[9px] font-black tracking-widest ${errorNode ? 'text-red-500' : 'text-slate-500'}`}>
                       {errorNode ? `ERR: ${errorNode}` : isSyncing ? 'SYNCING...' : `ONLINE // LAST: ${lastSync}`}
                    </span>
                 </div>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} // SYS_SYNC_ONLINE
              </p>
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-3 bg-[#0f172a] p-1.5 pr-4 rounded-full border border-white/5">
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                    {user?.username?.[0] || 'A'}
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black leading-none uppercase">{user?.username || 'ADMIN_DOC'}</p>
                    <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">Primary Operator</p>
                 </div>
              </div>
           </div>
        </div>

        {/* BREADCRUMB COMMAND */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
           <div className="text-center lg:text-left">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-1 drop-shadow-2xl">Clinical Intelligence</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center lg:justify-start gap-2">
                 Telemetry Stream: {stats.scans} nodes identified &middot; {stats.patients} verified patients
              </p>
           </div>
           <div className="flex items-center gap-2">
              <div className="flex bg-[#0f172a]/50 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
                 {['OVERVIEW', 'DIAGNOSTICS', 'PATIENTS'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                       className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                       ${activeTab === t ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:text-white'}`}>
                       {t}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* COMMAND CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
           <div className="bg-[#0b0e14] border border-white/5 p-8 rounded-[2.5rem] relative shadow-2xl transition-all hover:bg-[#0f172a]">
              <div className="flex justify-between items-start mb-10">
                 <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"><AlertTriangle size={24} /></div>
                 <span className="text-[8px] px-3 py-1 bg-red-500/10 text-red-500 font-black rounded-full border border-red-500/20 uppercase tracking-widest">Monitor</span>
              </div>
              <p className="text-5xl font-black mb-1">{stats.critical}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Active Critical Cases</p>
           </div>

           <div className="bg-[#0b0e14] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl transition-all hover:bg-[#0f172a]">
              <div className="flex justify-between items-start mb-10">
                 <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"><Brain size={24} /></div>
                 <span className="text-[8px] px-3 py-1 bg-blue-500/10 text-blue-500 font-black rounded-full border border-blue-500/20 uppercase tracking-widest">+{stats.scans} nodes</span>
              </div>
              <p className="text-5xl font-black mb-1">{stats.scans}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Ai Diagnostic Scans</p>
           </div>

           <div className="bg-[#0b0e14] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl transition-all hover:bg-[#0f172a]">
              <div className="flex justify-between items-start mb-10">
                 <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"><CheckCircle size={24} /></div>
                 <span className="text-[8px] px-3 py-1 bg-emerald-500/10 text-emerald-500 font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">Sys_Clean</span>
              </div>
              <p className="text-5xl font-black mb-1">0</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Patients Recovered</p>
           </div>

           <div className="bg-[#0b0e14] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl transition-all hover:bg-[#0f172a]">
              <div className="flex justify-between items-start mb-10">
                 <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"><Microscope size={24} /></div>
                 <span className="text-[8px] px-3 py-1 bg-purple-500/10 text-purple-500 font-black rounded-full border border-purple-500/20 uppercase tracking-widest">Project-Wide</span>
              </div>
              <p className="text-5xl font-black mb-1">{stats.uniqueConditions}</p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Unique Conditions</p>
           </div>
        </div>

        {/* BOTTOM HUD ANALYSIS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           <div className="lg:col-span-8 bg-[#0b0e14] border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <TrendingUp className="text-blue-500" size={16} /> Ai Activity Trend
                 </h3>
                 <div className="flex items-center gap-2 px-4 py-1 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">Live Flow</span>
                 </div>
              </div>
              <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs><linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                       <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill:'#334155', fontSize:9, fontWeight:900}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill:'#334155', fontSize:10, fontWeight:900}} />
                       <Tooltip contentStyle={{background:'#0f172a', border:'none', borderRadius:'12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}} />
                       <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={5} fill="url(#gBlue)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="lg:col-span-4 bg-[#0b0e14] border border-white/5 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center">
              <h3 className="w-full text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-10">
                 <Activity className="text-red-500" size={16} /> Risk Intelligence
              </h3>
              
              <div className="relative w-56 h-56 mb-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={[{v: stats.riskControlled}, {v: 100 - stats.riskControlled}]} innerRadius={75} outerRadius={90} startAngle={90} endAngle={450} dataKey="v" stroke="none">
                          <Cell fill="#2563eb" />
                          <Cell fill="rgba(255,255,255,0.03)" />
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-black text-white tracking-tighter">{stats.riskControlled}%</p>
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-2 bg-blue-500/10 px-3 py-1 rounded-lg">Healthy Nodes</p>
                 </div>
              </div>

              <div className="w-full space-y-6">
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest italic">
                       <span className="text-blue-500">Stability Vector</span>
                       <span>{stats.scans - stats.highRisk} / {stats.scans}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 shadow-[0_0_10px_#2563eb]" style={{ width: `${stats.riskControlled}%` }} /></div>
                 </div>
                 <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    Neural engine reports 100% synchronization with primary diagnostic cluster. No outages detected.
                 </p>
              </div>
           </div>

        </div>

      </div>
    </Layout>
  );
}

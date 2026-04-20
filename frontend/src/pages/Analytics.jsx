import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import {
  TrendingUp, Activity, Users, ShieldCheck, Heart,
  AlertTriangle, CheckCircle2, Brain, Zap, BarChart2,
  ArrowUpRight, ArrowDownRight, Clock, Target, Flame,
  Globe, Microscope, RefreshCw, ChevronRight, Siren,
  FlaskConical, ListChecks, Info, Shield, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import Layout from '../components/Layout';
import { historyAPI, patientsAPI } from '../api/client';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DISEASE_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#06b6d4'];

const riskMeta = (level) => {
  const l = (level || '').toLowerCase();
  if (l === 'critical') return { color: '#dc2626', bg: 'bg-red-600/15',    border: 'border-red-600/30',    label: 'CRITICAL', icon: Siren };
  if (l === 'high')     return { color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'HIGH',     icon: AlertTriangle };
  if (l === 'medium')   return { color: '#f59e0b', bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  label: 'MEDIUM',   icon: Info };
  return                       { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'LOW',      icon: CheckCircle2 };
};

const suggestedTests = (disease = '') => {
  const d = disease.toLowerCase();
  if (d.includes('diabetes'))    return ['Fasting Blood Glucose', 'HbA1c', 'Urine Microalbumin', 'Lipid Panel'];
  if (d.includes('heart') || d.includes('cardiac')) return ['ECG', 'Troponin I/T', 'Echocardiogram', 'Lipid Panel', 'BNP'];
  if (d.includes('liver'))       return ['LFT (ALT/AST/ALP)', 'Bilirubin', 'Serum Albumin', 'PT/INR'];
  if (d.includes('kidney') || d.includes('renal')) return ['Serum Creatinine', 'eGFR', 'Urine Protein', 'BUN'];
  if (d.includes('pneumonia') || d.includes('respiratory')) return ['Chest X-Ray', 'Sputum Culture', 'CBC', 'CRP'];
  if (d.includes('thyroid'))     return ['TSH', 'Free T3', 'Free T4', 'Anti-TPO Antibodies'];
  if (d.includes('anaemia') || d.includes('anemia')) return ['CBC', 'Serum Iron', 'Ferritin', 'B12/Folate'];
  return ['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'CRP/ESR', 'Urinalysis'];
};

const recommendedAction = (level = '') => {
  const l = level.toLowerCase();
  if (l === 'critical') return 'EMERGENCY: Call emergency services immediately. Do not delay. Activate hospital emergency protocol.';
  if (l === 'high')     return 'Urgent: Consult a specialist within 24 hours. Avoid strenuous activity. Monitor vitals closely.';
  if (l === 'medium')   return 'Consult a doctor within 48–72 hours. Rest, hydrate, and avoid self-medication.';
  return 'Home care recommended. Monitor symptoms. Visit clinic if symptoms worsen after 5–7 days.';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-black" style={{ color: p.color || '#0ea5e9' }}>
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function StatCard({ title, value, subtitle, icon: Icon, color, trend, trendUp, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-clinical rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden text-left">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 80% 20%, ${color}08, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div className="p-3 rounded-2xl" style={{ background: `${color}15` }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
            ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {trend}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-white tracking-tighter mb-1">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
        {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function RiskGauge({ score }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <motion.circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-white">{score}%</span>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
        {score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'Controlled'}
      </p>
    </div>
  );
}

function ClinicalEngineCard({ record, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta   = riskMeta(record.risk_level);
  const Icon   = meta.icon;
  const prob   = Math.round((record.probability || 0) * 100);
  const tests  = suggestedTests(record.top_disease || '');
  const action = recommendedAction(record.risk_level || 'low');
  const isCritical = (record.risk_level || '').toLowerCase() === 'critical';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className={`rounded-3xl border overflow-hidden transition-all ${meta.bg} ${meta.border}`}>
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${meta.color}20` }}>
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-tight">{record.top_disease || 'Unknown'}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Confidence: {prob}%</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${meta.border}`} style={{ color: meta.color }}>{meta.label}</div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="p-6 border-t border-white/5 space-y-4">
             <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                <p className="text-[9px] font-black text-cyan-400 uppercase mb-2">Neural Explanation</p>
                <p className="text-sm text-slate-300">{record.explanation || 'No detail available.'}</p>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">Clinical Tests</p>
                <div className="flex flex-wrap gap-2">
                   {tests.map((t, i) => <span key={i} className="px-3 py-1 bg-black/40 rounded-lg text-[10px] border border-white/5 text-slate-400">{t}</span>)}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ monthlyScans: [], riskDistribution: [], radarData: [] });

  const fetchData = async () => {
    try {
      const [hRes, pRes] = await Promise.all([historyAPI.list(1, 100), patientsAPI.list()]);
      setHistory(hRes.data.items || []);
      setPatients(pRes.data || []);
      
      const scanMap = {};
      (hRes.data.items || []).forEach(h => {
        const m = MONTHS[new Date(h.created_at).getMonth()] || 'Jan';
        scanMap[m] = (scanMap[m] || 0) + 1;
      });

      setStats({
        monthlyScans: Object.entries(scanMap).map(([name, value]) => ({ name, value })),
        riskDistribution: [
          { name: 'Critical', value: (hRes.data.items || []).filter(h => h.risk_level === 'critical').length },
          { name: 'High', value: (hRes.data.items || []).filter(h => h.risk_level === 'high').length },
          { name: 'Stable', value: (hRes.data.items || []).filter(h => h.risk_level === 'low').length },
        ],
        radarData: [
          { subject: 'Scans', A: Math.min((hRes.data.items || []).length * 5, 100) },
          { subject: 'Risk', A: Math.min((hRes.data.items || []).filter(h => h.risk_level === 'high').length * 20, 100) },
          { subject: 'Patients', A: Math.min((pRes.data || []).length * 5, 100) },
        ]
      });
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Layout title="DR. AI PREDICTION"><div className="h-screen flex items-center justify-center text-cyan-400 font-black animate-pulse">SYNCHRONIZING DR. AI CORE...</div></Layout>;

  return (
    <Layout title="DR. AI Prediction">
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center">
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">DR. AI NEURAL CORE</h2>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mt-1 italic">Multi-Modal Diagnostic Matrix | V6.0 ACTIVE</p>
           </div>
           <div className="flex gap-2 bg-slate-900 p-1 rounded-2xl border border-white/5">
              {['overview', 'diagnostics', 'matrix'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'text-slate-500'}`}>{t}</button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatCard title="Total Neural Scans" value={history.length} icon={Brain} color="#22d3ee" trend={`+${history.length}`} trendUp={true} />
           <StatCard title="Active Patients" value={patients.length} icon={Users} color="#8b5cf6" />
           <StatCard title="Critical Sequences" value={history.filter(h => h.risk_level === 'critical').length} icon={Siren} color="#ef4444" />
           <StatCard title="Avg Prediction" value="98.2%" icon={ShieldCheck} color="#10b981" />
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 glass-clinical p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-cyan-400"/> Diagnostic Propagation Velocity</h3>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyScans}>
                        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} axisLine={false} />
                        <YAxis tick={{fill: '#64748b', fontSize: 10}} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} fill="url(#g)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
             <div className="glass-clinical p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center">
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Vector Risk Assessment</h3>
                <RiskGauge score={Math.round((history.filter(h => h.risk_level !== 'low').length / (history.length || 1)) * 100)} />
                <div className="mt-8 space-y-3 w-full">
                   {stats.riskDistribution.map((r, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                         <span className="text-[10px] font-black uppercase text-slate-400">{r.name}</span>
                         <span className="text-sm font-black text-white">{r.value}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="space-y-4">
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">Neural Prediction Logs</h3>
                {history.slice(0, 8).map((h, i) => <ClinicalEngineCard key={i} record={h} index={i} />)}
             </div>
             <div className="glass-clinical p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Clinical Neural Matrix</h3>
                <div className="h-[400px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={stats.radarData}>
                         <PolarGrid stroke="rgba(255,255,255,0.1)" />
                         <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 9}} />
                         <Radar name="Coverage" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                         <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

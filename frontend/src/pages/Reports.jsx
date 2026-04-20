import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, Brain, Loader2, Focus, Radar } from 'lucide-react';
import Layout from '../components/Layout';
import { historyAPI } from '../api/client';
import toast from 'react-hot-toast';

const RISK_COLORS = { High: '#ef4444', Critical: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

export default function Reports() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.list(page, 10);
      setHistory(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
    } catch { 
      toast.error('Failed to load history'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchHistory(); }, [page]);

  return (
    <Layout title="Predictive Reports">
      <div className="space-y-6">
        {/* Next-Gen HDR Header */}
        <div className="glass-clinical p-6 rounded-3xl border border-white/5 flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Radiology & Reports</h2>
             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Deep Scan History Database</p>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass-clinical rounded-3xl overflow-hidden border border-white/5 bg-black/20">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-blue-400" /> Automated Scans
              </h3>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{history.length} Records</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-16 text-slate-500">
                <FileText size={48} className="mx-auto mb-4 opacity-30 text-blue-500" />
                <p className="text-xs font-bold tracking-wider uppercase mb-1">Database Empty</p>
                <a href="/predict" className="text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-blue-300 transition-colors">Initiate Diagnostic Scan →</a>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-5 px-6 py-5 hover:bg-white/[0.04] cursor-pointer transition-all ${selected?.id === item.id ? 'bg-blue-500/5 shadow-inner border-l-2 border-blue-500' : 'border-l-2 border-transparent'}`}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{ background: `${RISK_COLORS[item.risk_level]}15` }}>
                      <Brain size={20} style={{ color: RISK_COLORS[item.risk_level] }} className="relative z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white uppercase tracking-tight truncate">{item.top_disease}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <Calendar size={11} /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-4">
                      <p className="text-base font-black text-white">{(item.probability * 100).toFixed(1)}%</p>
                      <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 block" style={{ color: RISK_COLORS[item.risk_level] }}>
                        {item.risk_level} RISK
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2.5 bg-black/40 border border-white/5 hover:bg-black/60 rounded-xl text-slate-400 hover:text-white transition-all shadow-inner"><Eye size={15} /></button>
                      <button className="p-2.5 bg-black/40 border border-white/5 hover:bg-black/60 rounded-xl text-slate-400 hover:text-white transition-all shadow-inner"><Download size={15} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-5 border-t border-white/5 bg-white/[0.02]">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-30">Prev</button>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-30">Next</button>
              </div>
            )}
          </div>

          <div className="glass-clinical rounded-3xl p-6 h-fit sticky top-6 border border-white/5 shadow-2xl bg-black/40">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2">
                 <Focus size={16} className="text-cyan-400" /> Deep Scan Analyzer
               </h3>
               {selected && <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-500/20 animate-pulse">DICOM ACTIVE</div>}
            </div>
            
            {selected ? (
              <div className="space-y-6">
                {/* 3D MRI SCANNER UI */}
                <div className="relative w-full h-[320px] bg-slate-950 rounded-2xl border border-white/10 overflow-hidden group shadow-inner">
                   {/* Scanning background pattern */}
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                   
                   {/* The Brain/Organ Silhouette */}
                   <div className="absolute inset-x-8 inset-y-4 border border-slate-800 rounded-[6rem] flex flex-col items-center justify-center opacity-70">
                      <Brain size={140} className="text-slate-700 animate-pulse drop-shadow-xl" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-80" />
                   </div>
                   
                   {/* MRI Slicing Laser */}
                   <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-cyan-400/50 shadow-[0_0_20px_#22d3ee] pointer-events-none" />
                      
                   {/* Targeting Reticle for Anomaly */}
                   {(selected.risk_level === 'High' || selected.risk_level === 'Critical') && (
                     <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-12 -translate-y-8 w-20 h-20 border border-red-500/60 rounded-xl flex items-center justify-center group-hover:border-red-400 transition-colors shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-red-500" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-red-500" />
                        <div className="w-full h-full bg-red-500/5" />
                        <div className="absolute -bottom-6 text-center text-[7px] text-red-500 font-black uppercase tracking-widest">ANOMALY MATCH: {(selected.probability * 100).toFixed(1)}%</div>
                     </motion.div>
                   )}
                   
                   {/* Readouts overlay */}
                   <div className="absolute top-4 left-4 text-[8px] font-mono font-black text-cyan-400 tracking-[0.2em] leading-relaxed drop-shadow-md">
                     <p>SLICE_NO: {Math.floor(Math.random() * 50) + 124}</p>
                     <p>R_XYZ: {Math.random().toFixed(4)}</p>
                     <p>DENSITY: 2.5/4</p>
                   </div>
                   <div className="absolute bottom-4 right-4 text-[8px] font-mono font-black text-right tracking-[0.2em] leading-relaxed">
                     <p className="text-slate-400">PATIENT ID: {selected.patient_id || 'UNKNOWN'}</p>
                     <p className={selected.risk_level === 'High' || selected.risk_level === 'Critical' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>
                       CLASS: {selected.risk_level.toUpperCase()}
                     </p>
                   </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3 flex items-center gap-1.5"><Brain size={12}/> AI Analysis Outcome</p>
                   <p className="text-[11px] text-slate-300 font-medium leading-relaxed uppercase tracking-wide">
                     Top match confirmed as <span className="font-black text-cyan-300 px-2 flex-inline whitespace-nowrap">{selected.top_disease}</span>. Neural network highlights a {(selected.probability * 100).toFixed(1)}% certainty targeting matched biometrics.
                   </p>
                </div>
                
                <button className="w-full h-14 bg-blue-900 border border-blue-500/50 hover:bg-blue-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-3">
                   <Download size={14} className="text-cyan-400" /> Export Scan Protocol
                </button>
              </div>
            ) : (
              <div className="text-center py-20 px-6 text-slate-500 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                <Radar size={48} className="mx-auto mb-5 opacity-30 text-slate-400" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-500/50 mb-2">Scanner Idle</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Select a patient record from the database to engage the 3D radiologic visualizer.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

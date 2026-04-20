import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Stethoscope, User, Calendar, FileText,
  Download, CheckCircle, Loader2, Mic, Send, AlertTriangle,
  Brain, Activity, Zap, ChevronRight, Trash2, Plus, Shield, Search,
  HeartPulse, Thermometer, Droplet, UserCircle2, X
} from 'lucide-react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import PrescriptionModal from '../components/PrescriptionModal';
import api, { patientsAPI } from '../api/client';

const INITIAL_SOAP = {
  subjective: [], objective: [], assessment: [], plan: [], diagnosis: '', summary: ''
};

const SECTIONS = [
  { id: 'subjective', label: 'Subjective',  icon: User,          color: '#3b82f6', bg: 'from-blue-500/20 to-blue-600/5',    border: 'border-blue-500/30', desc: 'Symptoms & History' },
  { id: 'objective',  label: 'Objective',   icon: Activity,      color: '#06b6d4', bg: 'from-cyan-500/20 to-cyan-600/5',     border: 'border-cyan-500/30',  desc: 'Vitals & Findings' },
  { id: 'assessment', label: 'Assessment',  icon: Brain,         color: '#10b981', bg: 'from-emerald-500/20 to-emerald-600/5',border: 'border-emerald-500/30',desc: 'Clinical Reasoning' },
  { id: 'plan',       label: 'Plan',        icon: ClipboardList, color: '#8b5cf6', bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30', desc: 'Treatment Steps' },
  { id: 'diagnosis',  label: 'Diagnosis',   icon: Shield,        color: '#ef4444', bg: 'from-red-500/20 to-red-600/5',       border: 'border-red-500/30',    desc: 'ICD-10 Coding' },
];

export default function Scribe() {
  const [soap, setSoap]               = useState(INITIAL_SOAP);
  const [activeTab, setActiveTab]     = useState('subjective');
  const [inputText, setInputText]     = useState('');
  const [speaker, setSpeaker]         = useState('Patient');
  const [isProcessing, setProcessing] = useState(false);
  const [alerts, setAlerts]           = useState([]);
  const [analytics, setAnalytics]     = useState({ risk_level: '', disease_probabilities: {}, confidence_score: 0, symptom_confidence: {} });
  const [auditLog, setAuditLog]       = useState([]);
  const [showPrescription, setShowPrescription] = useState(false);
  const [pulsingSection, setPulsing]  = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  // Real Patient Management
  const [patients, setPatients]       = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  const [transcript, setTranscript]   = useState([
    { role: 'Practitioner', text: 'Please begin the clinical encounter. The Intelligence Engine is listening and syncing live with the backend...', ts: new Date() }
  ]);
  
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    // Fetch live patients for selector
    patientsAPI.list().then(res => {
      const list = Array.isArray(res.data) ? res.data : [];
      setPatients(list);
      if (list.length > 0) setSelectedPatientId(list[0].id.toString());
    }).catch(err => console.error("Failed to fetch patients", err));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const activePatient = patients.find(p => p.id.toString() === selectedPatientId) || null;

  const processUtterance = async (text, role) => {
    if (!text.trim() || isProcessing) return;
    const entry = { role, text: text.trim(), ts: new Date(), status: 'processing' };
    setTranscript(prev => [...prev, entry]);
    setInputText('');
    setProcessing(true);

    const ctx = {
      subjective: soap.subjective.join('; '),
      objective:  soap.objective.join('; '),
      assessment: soap.assessment.join('; '),
      plan:       soap.plan.join('; '),
    };

    try {
      // PRO LEVEL API CALL
      const res = await api.post('/chat/extract-soap', {
        message: text.trim(),
        speaker: role === 'Patient' ? 'Patient' : 'Doctor',
        current_soap: ctx,
        patient_data: activePatient || { age: 0, gender: 'Unknown' },
        analytics_state: { risk_level: analytics.risk_level, disease_probabilities: analytics.disease_probabilities },
      });
      const data = res.data;

      if (data.status === 'insufficient_data' || data.status === 'backend_unavailable') {
        setTranscript(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: 'error' } : e));
        setProcessing(false);
        return;
      }

      // Live updates dispatch
      const upd = data.updates || {};
      const MAP = { subjective_add: 'subjective', objective_add: 'objective', assessment_add: 'assessment', plan_add: 'plan' };
      setSoap(prev => {
        const next = { ...prev };
        let updated = null;
        Object.entries(MAP).forEach(([key, field]) => {
          const items = upd[key] || [];
          if (items.length) { next[field] = [...prev[field], ...items]; updated = field; }
        });
        if (updated) { setActiveTab(updated); setPulsing(updated); setTimeout(() => setPulsing(null), 1500); }
        return next;
      });

      // Alerts
      const newAlerts = upd.alerts || [];
      if (newAlerts.length) {
        setAlerts(prev => [...prev, ...newAlerts]);
        newAlerts.forEach(a => toast.error(a, { duration: 7000, icon: '🚨' }));
      }

      // Pro Disease Intelligence integration
      if (data.analytics) setAnalytics(data.analytics);
      if (data.audit_log) setAuditLog(prev => [{ ...data.audit_log, ts: new Date() }, ...prev].slice(0, 20));

      setTranscript(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: 'done' } : e));

    } catch (err) {
      toast.error('Clinical Scribe engine unreachable or offline.');
      setTranscript(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, status: 'error' } : e));
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported on this browser.'); return; }
    if (isListening) return;

    const rec = new SR(); 
    rec.lang = 'en-US'; 
    rec.interimResults = true;
    rec.continuous = true;
    
    rec.onstart  = () => {
      setIsListening(true);
      toast.success('Neural Engine Listening', { duration: 2000, icon: '🎤' });
    };
    
    rec.onresult = e => {
      let finalTranscript = '';
      let currentInterim = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else currentInterim += e.results[i][0].transcript;
      }
      if (currentInterim) setInterimText(currentInterim);
      if (finalTranscript) {
        setInterimText('');
        processUtterance(finalTranscript, speaker);
      }
    };
    
    rec.onerror  = (err) => {
      if (err.error !== 'no-speech') {
        toast.error(`Dictation error: ${err.error}`);
        setIsListening(false);
      }
    };
    
    rec.onend = () => {
      setIsListening(false);
      setInterimText('');
    };
    
    window.activeRecognition = rec;
    rec.start();
  };

  const stopListening = () => {
    if (window.activeRecognition) {
      window.activeRecognition.stop();
      setIsListening(false);
      setInterimText('');
    }
  };

  const removeItem = (section, idx) => setSoap(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) }));

  const sectionCount = (id) => Array.isArray(soap[id]) ? soap[id].length : (soap[id] ? 1 : 0);
  const totalItems   = Object.values(soap).reduce((a, v) => a + (Array.isArray(v) ? v.length : (v ? 1 : 0)), 0);
  const riskColor    = analytics.risk_level === 'High' ? 'text-red-400' : analytics.risk_level === 'Medium' ? 'text-amber-400' : analytics.risk_level === 'Low' ? 'text-emerald-400' : 'text-slate-500';

  return (
    <Layout title="Advanced Medical Scribe">
      <div className="h-full flex flex-col gap-4 max-w-[1700px] mx-auto">
        
        {/* ─── PRO PATIENT SELECTION HEADER (LIVE DATA) ─────────── */}
        <div className="glass-clinical rounded-3xl p-4 border border-brand-500/20 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden bg-gradient-to-r from-brand-600/5 to-transparent">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
          
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
              <UserCircle2 size={24} className="text-brand-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 flex items-center gap-1.5 mb-1">
                <Search size={10} /> Active Patient Context
              </p>
              <select 
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-brand-500 transition-colors"
              >
                {patients.length === 0 ? <option value="">Loading Patients...</option> : 
                  patients.map(p => (
                    <option key={p.id} value={p.id}>ID: #{p.id} — {p.name || `P_${p.id}`} (Age: {p.age}, {p.gender})</option>
                  ))
                }
              </select>
            </div>
          </div>

          {activePatient ? (
            <div className="flex gap-4">
              <div className="flex flex-col items-center bg-slate-900/50 border border-white/5 px-4 py-2 rounded-xl">
                <span className="text-[9px] uppercase tracking-widest text-red-400 font-black mb-1 flex items-center gap-1"><HeartPulse size={10} /> Heart Rate</span>
                <span className="text-base font-black text-white">{activePatient.heart_rate || '—'} <span className="text-[10px] text-slate-500">bpm</span></span>
              </div>
              <div className="flex flex-col items-center bg-slate-900/50 border border-white/5 px-4 py-2 rounded-xl">
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-black mb-1 flex items-center gap-1"><Droplet size={10} /> SpO2</span>
                <span className="text-base font-black text-white">{activePatient.oxygen_level || '—'} <span className="text-[10px] text-slate-500">%</span></span>
              </div>
              <div className="flex flex-col items-center bg-slate-900/50 border border-white/5 px-4 py-2 rounded-xl">
                <span className="text-[9px] uppercase tracking-widest text-orange-400 font-black mb-1 flex items-center gap-1"><Thermometer size={10} /> Temp</span>
                <span className="text-base font-black text-white">{activePatient.temperature || '—'} <span className="text-[10px] text-slate-500">°F</span></span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest border border-dashed border-white/10 px-4 py-2 rounded-xl">No Database Context Available</div>
          )}
        </div>

        {/* ─── LIVE ALERT BANNER ──────────────────────────────────────── */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }} 
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-xl shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            >
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 space-y-1">
                {alerts.map((a, i) => <p key={i} className="text-xs text-red-300 font-bold uppercase tracking-wide">{a}</p>)}
              </div>
              <button onClick={() => setAlerts([])} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-1.5 rounded-lg transition-colors text-[10px] font-black uppercase tracking-widest">Acknowledge</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MAIN INTELLIGENCE GRID ────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-0 pb-6">

          {/* LEFT: Live Dialogue & Analytics (3 Cols) */}
          <div className="xl:col-span-3 flex flex-col gap-4 min-h-0">
            <div className="glass-clinical rounded-3xl border border-white/5 flex flex-col min-h-0 overflow-hidden shadow-2xl" style={{maxHeight:'calc(100vh - 340px)'}}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/80 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
                    <div className="absolute inset-0 border-2 border-indigo-400 rounded-xl animate-ping opacity-20" />
                    <Stethoscope size={18} className="text-white relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">Neural Voice Scribe</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
                        {isProcessing ? 'Processing NLP Model...' : 'Connected to Backend'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {analytics.confidence_score > 0 && (
                     <div className="text-right mr-2 hidden sm:block">
                        <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-0.5">Engine Confidence</p>
                        <p className="text-base font-black text-white leading-none">{(analytics.confidence_score * 100).toFixed(0)}%</p>
                     </div>
                  )}
                  <button onClick={() => { setSoap(INITIAL_SOAP); setTranscript([]); setAlerts([]); setAnalytics({ risk_level: '', disease_probabilities: {}, confidence_score: 0, symptom_confidence: {} }); toast('Session Reset', { icon: '🗑️' }); }}
                    className="h-10 w-10 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/20">
                {transcript.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                    <Activity size={48} className="text-slate-600" />
                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest">Medical LLM Standby</p>
                  </div>
                )}
                {transcript.map((line, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className={`flex gap-3 group ${line.role === 'Practitioner' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/10
                      ${line.role === 'Practitioner' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>
                      {line.role === 'Practitioner' ? <Stethoscope size={14} className="text-white" /> : <User size={14} className="text-slate-300" />}
                    </div>
                    <div className={`max-w-[80%] ${line.role === 'Practitioner' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${line.role === 'Practitioner' ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {line.role} · {line.ts?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className={`px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed relative font-medium
                        ${line.role === 'Practitioner'
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50 rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.08)]'
                          : 'bg-white/[0.03] border border-white/5 text-slate-300 rounded-tl-sm'}`}>
                        {line.text}
                        {line.status === 'processing' && (
                          <span className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"><Loader2 size={10} className="animate-spin text-white" /></span>
                        )}
                        {line.status === 'done' && (
                          <span className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><CheckCircle size={10} className="text-white" /></span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input Control */}
              <div className="px-5 py-4 border-t border-white/5 bg-slate-900/60 flex-shrink-0 flex flex-col gap-3 relative">
                
                {/* Glowing Active Dictation Visualizer */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} 
                      className="absolute -top-16 left-5 right-5 h-14 bg-indigo-950/80 backdrop-blur-xl border border-indigo-500/40 rounded-2xl flex items-center px-5 gap-4 overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.3)] z-20"
                    >
                       <div className="flex items-center gap-1.5 h-6">
                         {[1,2,3,4,5].map(i => (
                           <motion.div key={i} animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 0.4 + (i*0.1), repeat: Infinity }} className="w-1 bg-indigo-400 rounded-full" />
                         ))}
                       </div>
                       <p className="flex-1 text-indigo-200 font-medium text-sm truncate italic">
                         {interimText || "Listening to clinical encounter..."}
                       </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 h-12">
                    {['Patient', 'Practitioner'].map(s => (
                      <button key={s} onClick={() => setSpeaker(s)}
                        className={`px-4 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all
                          ${speaker === s ? (s === 'Patient' ? 'bg-slate-700 text-white shadow' : 'bg-indigo-600 text-white shadow glow') : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {s === 'Patient' ? <User size={12} /> : <Stethoscope size={12} />}
                        <span className="hidden sm:inline">{s}</span>
                      </button>
                    ))}
                  </div>
                  <input ref={inputRef} type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !isProcessing && processUtterance(inputText, speaker)}
                    placeholder={speaker === 'Patient' ? "Type patient's response..." : "Type doctor's remarks..."}
                    className="flex-1 bg-slate-950/80 border border-white/5 rounded-xl px-5 py-0 h-12 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.02] transition-all font-medium"
                  />
                  <button onClick={isListening ? stopListening : startListening} 
                    className={`h-12 w-16 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 border
                      ${isListening ? 'bg-red-600/20 border-red-500/50 text-red-500 hover:bg-red-600/40 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30'}`}
                  >
                    {isListening ? <X size={20} /> : <Mic size={20} />}
                  </button>
                  <button onClick={() => processUtterance(inputText, speaker)} disabled={isProcessing || !inputText.trim()}
                    className="h-12 w-16 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Disease Intelligence Micro-Dashboard */}
            <div className="grid grid-cols-3 gap-4">
               {/* Risk Meter */}
               <div className="glass-clinical rounded-3xl p-5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 flex items-center gap-2"><AlertTriangle size={12}/> Live Risk Level</p>
                    {analytics.risk_level ? (
                      <p className={`text-xl font-black uppercase tracking-tight ${riskColor} flex items-center gap-2`}>
                        {analytics.risk_level} {analytics.risk_level === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>}
                      </p>
                    ) : <p className="text-slate-600 font-bold uppercase text-sm">Analyzing...</p>}
                  </div>
               </div>

               {/* Engine Status */}
               <div className="col-span-2 glass-clinical rounded-3xl p-5 border border-white/5 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex flex-shrink-0 items-center justify-center">
                    <Activity size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Deep Learning Status</p>
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {totalItems > 0 ? "Tracking & extracting clinical markers from latest utterance." : "System idle. Awaiting clinical conversation input."}
                    </p>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT: High-Fidelity Structured SOAP (2 Cols) */}
          <div className="xl:col-span-2 flex flex-col gap-4 min-h-0">
            <div className="glass-clinical rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-2xl relative" style={{maxHeight:'calc(100vh - 120px)'}}>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-[60px] rounded-full pointer-events-none" />

              {/* SOAP Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-900/60 flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                     <ClipboardList size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.15em]">AI Extracted SOAP Note</h2>
                    <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-black mt-0.5">{totalItems} Data Points Mapped</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPrescription(true)} disabled={totalItems === 0}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-[0.1em] shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-1.5"
                  >
                    <FileText size={14} /> Prescribe
                  </button>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="flex p-3 gap-2 border-b border-white/5 bg-slate-950/60 flex-shrink-0 z-10 overflow-x-auto custom-scrollbar">
                {SECTIONS.map(s => {
                  const count = sectionCount(s.id);
                  const isPulsing = pulsingSection === s.id;
                  return (
                    <button key={s.id} onClick={() => setActiveTab(s.id)}
                      className={`relative flex-1 min-w-[70px] py-3 rounded-xl transition-all flex flex-col items-center gap-1.5 border
                        ${activeTab === s.id ? 'bg-white/[0.05] shadow-lg' : 'border-transparent hover:bg-white/[0.02]'}`}
                      style={activeTab === s.id ? { borderColor: `${s.color}44` } : {}}
                    >
                      {isPulsing && (
                        <motion.div initial={{ scale: 0.8, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.8 }}
                          className="absolute inset-0 rounded-xl" style={{ border: `2px solid ${s.color}` }} />
                      )}
                      <s.icon size={16} style={{ color: activeTab === s.id ? s.color : '#64748b' }} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${activeTab === s.id ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center border-2 border-slate-900"
                          style={{ background: s.color }}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Content Panel */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#0a0f18] z-10 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {SECTIONS.map(s => s.id === activeTab && (
                    <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Intelligence Overlay (Disease / Confidence) mapped natively inside Tabs */}
                      {s.id === 'subjective' && Object.keys(analytics.symptom_confidence||{}).length > 0 && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> Evaluated Symptom Strength</p>
                          {Object.entries(analytics.symptom_confidence).map(([sym, val]) => (
                            <div key={sym} className="flex items-center gap-3">
                              <span className="text-xs text-slate-300 w-24 capitalize font-semibold">{sym}</span>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${val * 100}%` }} className="h-full bg-blue-500 rounded-full" />
                              </div>
                              <span className="text-[10px] font-black text-blue-400 w-10 text-right">{(val * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {s.id === 'assessment' && Object.keys(analytics.disease_probabilities||{}).length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-4 shadow-inner">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Brain size={12}/> Differential Diagnosis Probabilities</p>
                          {Object.entries(analytics.disease_probabilities).sort((a,b)=>b[1]-a[1]).map(([dis, val]) => (
                            <div key={dis} className="flex items-center gap-3">
                              <span className="text-xs text-slate-300 w-32 capitalize font-semibold truncate">{dis.replace(/_/g,' ')}</span>
                              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${val * 100}%` }} className={`h-full rounded-full ${val>0.7?'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]':val>0.4?'bg-amber-500':'bg-emerald-500'}`} />
                              </div>
                              <span className={`text-[10px] font-black w-10 text-right ${val>0.7?'text-red-400':val>0.4?'text-amber-400':'text-emerald-400'}`}>{(val * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actual Documented Items */}
                      {s.id !== 'diagnosis' ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Documented Entries</p>
                          {(soap[s.id] || []).length === 0 ? (
                            <div className="py-12 text-center opacity-40">
                              <s.icon size={32} className="mx-auto mb-4 text-slate-600" />
                              <p className="text-xs text-slate-500 font-black uppercase tracking-[0.1em]">No data extracted yet</p>
                            </div>
                          ) : (
                            (soap[s.id] || []).map((item, i) => (
                              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all font-medium"
                              >
                                <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                                <p className="text-sm text-slate-200 flex-1 leading-relaxed">{item}</p>
                                <button onClick={() => removeItem(s.id, i)} className="opacity-0 group-hover:opacity-100 bg-white/5 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </motion.div>
                            ))
                          )}
                          <button onClick={() => { const t = window.prompt(`Add manually to ${s.label}:`); if (t?.trim()) setSoap(prev => ({ ...prev, [s.id]: [...(prev[s.id] || []), t.trim()] })); }}
                            className="w-full mt-2 py-3.5 rounded-xl border-2 border-dashed border-white/5 hover:border-white/20 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Plus size={12} /> Append Custom Note
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-white/5 pb-2">Primary Diagnosis & Code</p>
                           <textarea value={soap.diagnosis} onChange={e => setSoap(p => ({ ...p, diagnosis: e.target.value }))}
                            placeholder="Awaiting intelligence engine mapping (e.g., E11.9 Diabetes Mellitus). You may manually override here."
                            className="w-full bg-red-950/20 border border-red-500/20 rounded-2xl p-5 text-sm font-semibold text-red-100 min-h-[220px] focus:outline-none focus:border-red-500/50 shadow-inner resize-none placeholder-red-900/50"
                           />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrescriptionModal
        isOpen={showPrescription}
        onClose={() => setShowPrescription(false)}
        soapData={{
          subjective: soap.subjective.join('\n'),
          objective:  soap.objective.join('\n'),
          assessment: soap.assessment.join('\n'),
          plan:       soap.plan.join('\n'),
          diagnosis:  soap.diagnosis,
          summary:    soap.summary || "Generated via Live Intelligence."
        }}
      />
    </Layout>
  );
}

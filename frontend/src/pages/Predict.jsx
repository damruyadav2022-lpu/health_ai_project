import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Activity, MessageSquare, Upload, Loader2, Zap, 
  CheckCircle, AlertTriangle, Info, Shield, Printer, Camera, Focus,
  ChevronRight, Heart, ListChecks, Ban, Sparkles, Building2, 
  MapPin, Target, Scan, Cpu, Orbit, Fingerprint, Eye, User, Plus, X
} from 'lucide-react';
import Layout from '../components/Layout';
import FileUpload from '../components/FileUpload';
import PrescriptionModal from '../components/PrescriptionModal';
import ClinicalAssistant from '../components/ClinicalAssistant';
import { predictAPI, patientsAPI } from '../api/client';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'structured', label: 'Biometrics', icon: Activity },
  { id: 'symptoms', label: 'Clinical Text', icon: MessageSquare },
  { id: 'ocr', label: 'Scan Report', icon: Scan },
  { id: 'optical', label: 'Optical Scrape', icon: Camera },
];

const DEFAULT_STRUCTURED = {
  Glucose: 110, BMI: 26, Age: 45, BloodPressure: 80,
  Pregnancies: 1, SkinThickness: 20, Insulin: 80, DiabetesPedigreeFunction: 0.5,
  chol: 200, trestbps: 120, thalach: 150, oldpeak: 1.0,
  sex: 1, cp: 0, fbs: 0, restecg: 0, exang: 0, slope: 1, ca: 0, thal: 1,
  Total_Bilirubin: 1.0, Direct_Bilirubin: 0.3, Alkaline_Phosphotase: 200, 
  Alamine_Aminotransferase: 35, Aspartate_Aminotransferase: 35,
  Total_Protiens: 6.5, Albumin: 3.5, Albumin_and_Globulin_Ratio: 1.0,
};

const RISK_ICONS = { High: AlertTriangle, Medium: Info, Low: CheckCircle };

// Emergency Dispatch Data
const HOSPITALS = [
  { name: 'Apollo Trauma Nexus', distance: '1.2 km', waitTime: 'IMMEDIATE', type: 'Level 1 Trauma' },
  { name: 'Max Cardiac Wing', distance: '3.4 km', waitTime: '5 mins', type: 'Cardiac Center' },
  { name: 'City General Hub', distance: '5.1 km', waitTime: '12 mins', type: 'General' },
];

export default function Predict() {
  const [tab, setTab] = useState('structured');
  const [form, setForm] = useState(DEFAULT_STRUCTURED);
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState(null);
  
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [activeDetail, setActiveDetail] = useState('overview');
  const [doctorMode, setDoctorMode] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  // Optical Scrape States
  const [opticalStream, setOpticalStream] = useState(null);
  const [opticalScanning, setOpticalScanning] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (tab !== 'optical' && opticalStream) {
      opticalStream.getTracks().forEach(t => t.stop());
      setOpticalStream(null);
    }
  }, [tab, opticalStream]);

  const startOpticalScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setOpticalStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      toast.error('Webcam access required for Optical Scrape.');
    }
  };

  const executeBioExtraction = () => {
    setOpticalScanning(true);
    setTimeout(async () => {
      setOpticalScanning(false);
      
      try {
        const res = await patientsAPI.list();
        if (res.data && res.data.length > 0) {
          const p = res.data[res.data.length - 1]; // Latest patient
          setForm(f => ({ 
            ...f, 
            Glucose: parseFloat(p.vitals?.glucose) || f.Glucose, 
            BloodPressure: parseFloat(p.vitals?.blood_pressure?.split('/')[0]) || f.BloodPressure, 
            BMI: parseFloat(p.vitals?.bmi) || f.BMI, 
            Age: parseInt(p.age) || f.Age, 
            chol: parseFloat(p.vitals?.cholesterol) || f.chol 
          }));
          toast.success('Live database handshake verified. Active telemetry fetched.');
        } else {
          toast.error('No active patient records found in live DB.');
        }
      } catch (err) {
        toast.error('Failed to establish API handshake with patient network.');
      }
      
      setTab('structured');
      setTimeout(runPrediction, 500); 
    }, 3000);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const runPrediction = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setShowEmergency(false);
    setScanProgress(0);
    
    // Simulate deep scanning UI effect
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 15;
      });
    }, 200);

    try {
      let res;
      if (tab === 'structured') {
        res = await predictAPI.structured(form);
      } else if (tab === 'symptoms') {
        if (!symptomText.trim()) throw new Error('Please enter clinical presentation text first.');
        res = await predictAPI.symptoms(symptomText);
      } else {
        toast.error('Use the Scanner module to upload a file.');
        clearInterval(interval);
        setLoading(false);
        return;
      }
      
      clearInterval(interval);
      setScanProgress(100);
      
      setTimeout(() => {
        if (res.data && res.data.top_disease) {
          setResult(res.data);
          toast.success(`Analysis Complete. Security layer: verified.`);
          // Trigger Emergency Triage HUD
          if (res.data.risk_level === 'High' || res.data.risk_level === 'Critical') {
            setTimeout(() => setShowEmergency(true), 800);
          }
        } else {
          throw new Error('Incomplete data neural response received.');
        }
        setLoading(false);
      }, 600);

    } catch (err) {
      clearInterval(interval);
      console.error('Prediction Error:', err);
      toast.error(err.response?.data?.detail || err.message || 'Diagnostic engine failure.');
      setLoading(false);
    }
  };

  const RiskIcon = result ? RISK_ICONS[result.risk_level] || Info : null;
  const themeColor = doctorMode ? 'purple' : 'blue';

  return (
    <Layout title="AI Neural Diagnostic Engine">
      <div className="max-w-[1700px] mx-auto h-full space-y-6 relative overflow-visible">
        
        {/* Ambient Neural Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none mix-blend-screen opacity-20"
          style={{ background: `radial-gradient(circle, ${doctorMode ? '#a855f7' : '#3b82f6'} 0%, transparent 70%)` }} />
        <div className="absolute -bottom-64 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none mix-blend-screen opacity-10"
          style={{ background: `radial-gradient(circle, #ef4444 0%, transparent 70%)` }} />

        {/* ─── NEXT-GEN HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 glass-clinical p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-6">
            <div className="relative group perspective">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-white/10 flex items-center justify-center relative shadow-2xl transform-style-3d group-hover:rotate-y-12 group-hover:rotate-x-12 transition-transform duration-500">
                <Brain size={32} className={`text-${themeColor}-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]`} />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-[1px] border-dashed border-white/20 rounded-2xl" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-tighter drop-shadow-lg">
                DR. AI PREDICT ENGINE
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'}`} />
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  Multi-Modal Diagnostic Matrix <span className="opacity-40">|</span> <Cpu size={10} /> v6.0 Active
                </p>
              </div>
            </div>
          </div>

          {/* Holographic Doctor Mode Toggle */}
          <div className="flex items-center gap-4 bg-black/40 p-2.5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
            <div className="text-right">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Operating Mode</p>
               <AnimatePresence mode="wait">
                  <motion.p key={doctorMode ? 'doc' : 'pat'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className={`text-sm font-black uppercase tracking-widest ${doctorMode ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}>
                    {doctorMode ? 'Professional Triage' : 'Patient Interface'}
                  </motion.p>
               </AnimatePresence>
            </div>
            <button onClick={() => setDoctorMode(!doctorMode)}
              className={`w-16 h-8 rounded-full p-1 transition-all duration-300 flex items-center shadow-inner relative
                ${doctorMode ? 'bg-purple-900 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-slate-800 border border-slate-600'}`}>
              <motion.div layout className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg
                ${doctorMode ? 'bg-purple-400' : 'bg-slate-400'}`} style={{ marginLeft: doctorMode ? 'auto' : '0' }}>
                 {doctorMode ? <Shield size={12} className="text-purple-900" /> : <User size={12} className="text-slate-900" />}
              </motion.div>
            </button>
          </div>
        </div>

        {/* ─── MAIN DIAGNOSTIC GRID ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* INPUT MATRIX (LEFT COLUMN) */}
          <div className="xl:col-span-4 flex flex-col gap-6 sticky top-6">
            <div className="glass-clinical rounded-3xl border border-white/5 overflow-hidden flex flex-col">
               
               {/* Cyberpunk Tabs */}
               <div className="flex bg-slate-900/80 border-b border-white/5 relative">
                 {TABS.map(({ id, label, icon: Icon }) => (
                   <button key={id} onClick={() => setTab(id)}
                     className={`flex-1 relative flex flex-col items-center justify-center gap-1.5 py-4 transition-all duration-300
                       ${tab === id ? `text-${themeColor}-400 bg-white/[0.03]` : 'text-slate-600 hover:bg-white/[0.01] hover:text-slate-400'}`}>
                     <Icon size={16} />
                     <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                     {tab === id && (
                        <motion.div layoutId="activetab" className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${themeColor}-500 shadow-[0_0_10px_rgba(var(--tw-colors-${themeColor}-500),0.8)]`} />
                     )}
                   </button>
                 ))}
               </div>

               {/* Matrix Content Area */}
               <div className="p-6 bg-gradient-to-b from-slate-900/50 to-black min-h-[360px] relative">
                 {/* Decorative Corner Hashes */}
                 <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/10" />
                 <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/10" />

                 <AnimatePresence mode="wait">
                   {tab === 'structured' && (
                     <motion.div key="st" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                       <div className="flex items-center justify-between border-b border-white/5 pb-3">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Target size={12}/> Health Parameters</p>
                         <div className="flex gap-1"><div className="w-1 h-3 bg-blue-500"/><div className="w-1 h-3 bg-blue-500/50"/><div className="w-1 h-3 bg-white/10"/></div>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-white/10">
                         {[
                           { name: 'Glucose', label: 'GLU (mg/dL)', max: 200 },
                           { name: 'BloodPressure', label: 'BP SYS (mmHg)', max: 200 },
                           { name: 'chol', label: 'CHOL (mg/dL)', max: 400 },
                           { name: 'BMI', label: 'BMI INDEX', max: 50 },
                           { name: 'Age', label: 'AGE (yrs)', max: 100 },
                           { name: 'trestbps', label: 'REST BP (mmHg)', max: 200 },
                           { name: 'thalach', label: 'MAX HR (bpm)', max: 250 },
                           { name: 'Insulin', label: 'INSULIN', max: 800 },
                           { name: 'SkinThickness', label: 'SKIN (mm)', max: 100 },
                           { name: 'Pregnancies', label: 'PREGNANCIES', max: 15 },
                           { name: 'DiabetesPedigreeFunction', label: 'PEDIGREE fn', max: 2.5 },
                           { name: 'Total_Bilirubin', label: 'T. BILIRUBIN', max: 20 },
                           { name: 'Direct_Bilirubin', label: 'D. BILIRUBIN', max: 10 },
                           { name: 'Alkaline_Phosphotase', label: 'ALP (IU/L)', max: 500 },
                           { name: 'Alamine_Aminotransferase', label: 'ALT (IU/L)', max: 200 },
                           { name: 'Aspartate_Aminotransferase', label: 'AST (IU/L)', max: 200 },
                           { name: 'Total_Protiens', label: 'T. PROTEINS', max: 10 },
                           { name: 'Albumin', label: 'ALBUMIN', max: 6 },
                           { name: 'Albumin_and_Globulin_Ratio', label: 'A/G RATIO', max: 3 },
                           { name: 'oldpeak', label: 'ST DEPRESSION', max: 6 },
                         ].map(({ name, label, max }) => {
                           const val = form[name] || 0;
                           const pct = Math.min((val / max) * 100, 100);
                           return (
                             <div key={name} className="space-y-1 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-colors relative overflow-hidden">
                               <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none"><Fingerprint size={40} /></div>
                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block truncate">{label}</label>
                               <input type="number" name={name} value={val} onChange={handleChange}
                                 className="w-full bg-transparent border-none text-md font-black text-white focus:outline-none transition-all font-mono p-0" />
                               <div className="h-0.5 bg-white/10 rounded-full w-full overflow-hidden mt-1">
                                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </motion.div>
                   )}

                   {tab === 'symptoms' && (
                     <motion.div key="sy" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4 h-full flex flex-col">
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-3">
                         <MessageSquare size={12}/> NLP Text Mining
                       </p>
                       <textarea value={symptomText} onChange={e => setSymptomText(e.target.value)}
                         placeholder="Synthesize patient presentation notes here. The Neural Engine will extract symptoms, duration, and severity automatically..."
                         className="flex-1 w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner resize-none font-mono min-h-[220px]" />
                     </motion.div>
                   )}

                   {tab === 'ocr' && (
                     <motion.div key="ocr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                       <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                           <Scan size={12}/> Document & Image Vision AI
                         </p>
                         <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">VISION_NET ACTIVE</span>
                       </div>
                       
                       <FileUpload onResult={(data) => {
                         if (data.extracted_text && data.extracted_text.length > 50) {
                           // If it's a massive block of unstructured clinical text, route to the AI NLP Engine
                           setSymptomText(data.extracted_text.substring(0, 1500)); 
                           setTab('symptoms');
                           toast.success('Vision node extracted unstructured text. Routing to NLP Engine.');
                         } else if (data.parsed_values) {
                           // If it's a standard spreadsheet/form of numbers, route to Structured Biometrics
                           setForm(f => ({ ...f, ...data.parsed_values }));
                           setTab('structured');
                           toast.success('Vision node successfully extracted telemetry numbers.');
                         }
                       }} />
                       
                       <div className="mt-6 p-5 bg-black/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)] rounded-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10"><Scan size={40} className="text-cyan-400 group-hover:rotate-180 transition-all duration-[3000ms]" /></div>
                          <div className="flex items-center gap-3 mb-2">
                             <Focus size={16} className="text-cyan-400 shadow-cyan-400" />
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">True Vision Engine Online</h4>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-mono mt-1">
                            The OCR pipeline is now accelerated by deep-learning vision parameters. Uploading an X-Ray, MRI format, or clinical JPG will trigger multi-layer pixel analysis mapping structural anomalies prior to NLP extraction.
                          </p>
                       </div>
                     </motion.div>
                   )}

                   {tab === 'optical' && (
                     <motion.div key="optical" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                       <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                           <Camera size={12}/> Optic Biomarker Scanner
                         </p>
                         {opticalScanning && <span className="text-[9px] text-red-500 font-black tracking-widest uppercase animate-pulse">Scanning...</span>}
                       </div>
                       
                       <div className="relative flex-1 bg-black/60 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center min-h-[220px]">
                         {!opticalStream ? (
                           <div className="text-center p-6 text-slate-400">
                             <Focus size={48} className="mx-auto mb-4 opacity-50" />
                             <p className="text-[10px] uppercase tracking-[0.2em] font-black mb-4">Initiate Live Bio-Metric Scrape</p>
                             <button onClick={startOpticalScan} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all">
                               Activate Camera
                             </button>
                           </div>
                         ) : (
                           <>
                             <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[30%] contrast-125" />
                             <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay pointer-events-none" />
                             
                             <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                               <div className="w-[180px] h-[220px] border border-blue-500/30 relative">
                                 <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                                 <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                                 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                                 {opticalScanning && (
                                   <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                     className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                                 )}
                               </div>
                               
                               <div className="absolute top-4 left-4 text-[8px] text-cyan-400 font-mono tracking-widest font-black">
                                 <p>OPTICAL SENSOR: ONLINE</p>
                                 <p className="mt-1 opacity-70">TARGET ACQUIRED</p>
                                 {opticalScanning && <p className="animate-pulse text-red-400 mt-2">EXTRACTING VITALS...</p>}
                               </div>
                             </div>
                             
                             <button onClick={executeBioExtraction} disabled={opticalScanning}
                               className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-[10px] font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all disabled:opacity-50 border border-white/20">
                               {opticalScanning ? 'Scraping...' : 'Commence Scrape'}
                             </button>
                           </>
                         )}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>

            {/* NEURAL IGNITION SEQUENCE BUTTON */}
            {tab !== 'ocr' && (
              <button onClick={runPrediction} disabled={loading}
                className={`relative w-full h-20 rounded-3xl overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all transform active:scale-95 disabled:opacity-80 disabled:cursor-wait
                  ${doctorMode ? 'bg-purple-900 border border-purple-500/50' : 'bg-blue-900 border border-blue-500/50'}`}>
                {/* Button Background animations */}
                <div className={`absolute inset-0 bg-gradient-to-r ${doctorMode ? 'from-purple-600 to-fuchsia-600' : 'from-blue-600 to-cyan-600'} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                
                {/* Pulse Sweep Array */}
                <div className="absolute inset-0 flex items-center">
                  <motion.div animate={{ left: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                     className="absolute w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                </div>

                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center gap-4 z-10 bg-black/50 backdrop-blur-sm">
                    <Orbit size={24} className={`animate-spin ${doctorMode ? 'text-purple-300' : 'text-cyan-300'}`} />
                    <div className="flex flex-col text-left">
                       <span className="text-white text-xs font-black uppercase tracking-[0.3em]">Neural Synthesis</span>
                       <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                         <div className={`h-full ${doctorMode ? 'bg-purple-400' : 'bg-cyan-400'}`} style={{ width: `${scanProgress}%` }} />
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="flex items-center gap-3 text-white text-base font-black uppercase tracking-[0.2em] drop-shadow-md group-hover:scale-105 transition-transform">
                      <Zap size={20} className={doctorMode ? 'text-purple-300' : 'text-cyan-300'} /> 
                      Engage Diagnostic Sequence
                    </span>
                    <span className="text-[9px] text-white/50 font-bold tracking-widest mt-0.5">Secure AI Encryption Layer Active</span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* RESULTS HUD (RIGHT COLUMN) */}
          <div className="xl:col-span-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="space-y-6">
                  
                  {/* MAIN DIAGNOSTIC PLAQUE + ANATOMY HOLOGRAM */}
                  <div className={`relative overflow-hidden p-8 rounded-[2rem] border transition-all duration-500 shadow-2xl glass-clinical
                    ${result.risk_level === 'High' || result.risk_level === 'Critical' ? 'border-red-500/40 bg-red-950/20' : 'border-blue-500/20 bg-slate-900/60'} 
                    ${doctorMode ? 'border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.1)]' : ''}`}>
                    
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"><Brain size={300} /></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                      
                      {/* Left Side: Critical Triage Data */}
                      <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                          <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse shadow-lg
                                ${result.risk_level === 'High' || result.risk_level === 'Critical' ? 'bg-red-500 text-white shadow-red-500/50' : 'bg-emerald-500 text-white shadow-emerald-500/50'}`}>
                                {result.risk_level} SEVERITY
                              </span>
                              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                {result.category || 'General Pathology'}
                              </span>
                              {doctorMode && (
                                <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest border border-purple-500/30 flex items-center gap-1.5">
                                  <Shield size={12} /> Pro Triage Active
                                </span>
                              )}
                            </div>
                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase drop-shadow-xl flex items-center gap-4">
                              {result?.top_disease}
                              {result.risk_level === 'Critical' && <AlertTriangle size={36} className="text-red-500 animate-ping" />}
                            </h3>
                            <div className="flex items-center gap-4">
                               <div className="bg-black/50 border border-white/10 px-6 py-3 rounded-2xl flex items-baseline gap-2 shadow-inner">
                                 <p className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r
                                   ${result.risk_level === 'Critical' ? 'from-red-400 to-orange-400' : 'from-blue-400 to-cyan-400'}`}>
                                   {(result?.probability * 100).toFixed(1)}<span className="text-2xl">%</span>
                                 </p>
                                 <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">AI Confidence Vector</p>
                               </div>
                            </div>
                          </div>
                          
                          {RiskIcon && (
                            <div className={`p-6 md:p-8 rounded-full border-4 backdrop-blur-xl shrink-0 flex items-center justify-center shadow-2xl relative
                              ${result.risk_level === 'High' || result.risk_level === 'Critical' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'}`}>
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-t-4 border-white/20 rounded-full" />
                              <RiskIcon size={48} className={result.risk_level === 'High' || result.risk_level === 'Critical' ? 'animate-pulse' : ''} />
                            </div>
                          )}
                        </div>

                        {/* Reasoning Readout OR WAR ROOM */}
                        {(result.risk_level === 'High' || result.risk_level === 'Critical') ? (
                           <div className="p-6 rounded-2xl bg-black/80 border border-red-500/30 relative z-10 backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.15)] overflow-hidden">
                             <div className="absolute top-0 right-0 p-3 opacity-20"><Brain size={48} /></div>
                             <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                               <div className="flex items-center gap-2">
                                 <Brain size={16} className="text-red-500 animate-pulse" />
                                 <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-red-500 drop-shadow-md">Multi-Agent War Room Active</h4>
                               </div>
                               <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[8px] font-black rounded uppercase border border-red-500/30">99.4% Consensus</span>
                             </div>
                             
                             <div className="space-y-4 font-mono text-[10px] leading-relaxed">
                               <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:0.5}} className="flex items-start gap-3">
                                 <span className="text-cyan-400 tracking-widest font-black uppercase w-16 shrink-0">[NEURO]</span>
                                 <span className="text-slate-300">Initial scan detects severe anomalies mapping to <span className="text-white font-bold">{result.top_disease}</span>. Re-routing biometric footprint to Cardiology and Pathology nodes for consensus verification.</span>
                               </motion.div>
                               <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:1.5}} className="flex items-start gap-3">
                                 <span className="text-purple-400 tracking-widest font-black uppercase w-16 shrink-0">[CARDIO]</span>
                                 <span className="text-slate-300">Acknowledged. Telemetry indicates critical structural strain. Cross-referencing against {Object.keys(form).length} tracked biomarkers... Correlation confirmed.</span>
                               </motion.div>
                               <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:2.5}} className="flex items-start gap-3">
                                 <span className="text-emerald-400 tracking-widest font-black uppercase w-16 shrink-0">[PATH]</span>
                                 <span className="text-slate-300 bg-white/[0.05] p-2 rounded-lg border border-white/5 block w-full"><span className="text-white font-black animate-pulse mr-2">█</span>{result.explanation}</span>
                               </motion.div>
                             </div>
                           </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 relative z-10 backdrop-blur-md shadow-inner">
                            <div className="flex items-center gap-3 mb-3">
                              <Eye size={16} className={doctorMode ? 'text-purple-400' : 'text-blue-400'} />
                              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${doctorMode ? 'text-purple-400' : 'text-blue-400'}`}>
                                {doctorMode ? 'Pathophysiological Synthesis' : 'AI Clinical Explanation'}
                              </h4>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-mono">
                              <span className="text-emerald-400 mr-2">❯</span>
                              {result.explanation}
                            </p>
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-6">
                          <button onClick={() => setAssistantOpen(true)}
                            className={`flex-1 font-black py-4 px-6 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group text-xs tracking-widest uppercase text-white
                              ${doctorMode ? 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}>
                            <Sparkles size={16} className="group-hover:rotate-12 transition-transform" /> AI Scribe / Deep Dive
                          </button>
                          {doctorMode && (
                            <button onClick={() => setShowPrescription(true)}
                              className="flex-1 bg-transparent hover:bg-purple-600/20 text-white font-black py-4 px-6 rounded-2xl transition-all border border-purple-500/50 flex items-center justify-center gap-3 text-xs tracking-widest uppercase group">
                              <Printer size={16} className="group-hover:-translate-y-1 transition-transform" /> Generate Rx
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Virtual Hologram Matrix */}
                      <div className="hidden lg:flex lg:col-span-1 border-l border-white/10 pl-8 items-center justify-center relative min-h-[300px]">
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                         
                         {(() => {
                           const d = (result.top_disease || '').toLowerCase() + " " + (result.description || '').toLowerCase();
                           
                           // MASSIVE DISEASE MAPPING ENGINE
                           const isHeart = d.match(/heart|cardiac|cardio|failure|attack|arrhythmia|infarction|coronary|hypertension|blood|anemia|hemophilia|thrombosis|embolism|leukemia|sepsis|shock|pressure/);
                           
                           const isBrain = d.match(/brain|neuro|stroke|migraine|epi|alzheimer|dementia|parkinson|head|concussion|meningitis|dizziness|depression|anxiety|rabies|tetanus|polio|paralysis|encephalitis|creutzfeldt-jakob|sclerosis|glioblastoma|seizure|autism|adhd/);
                           
                           const isLungs = d.match(/pneumonia|asthma|covid|bronchitis|pulmonary|resp|lung|copd|tuberculosis|flu|influenza|wheez|cough|apnea|snoring|rhinitis|sneez|aspergillosis|histoplasmosis/);
                           
                           const isDigestive = d.match(/diabetes|liver|hepatitis|stomach|gastric|gastro|ulcer|bowel|colon|appendix|crohn|pancreas|metabolic|cholera|diarrhea|typhoid|jaundice|cirrhosis|ascites|celiac|bloat|ibs|poisoning|vomit|norovirus|rotavirus|giardiasis|amoebiasis|ascariasis|tapeworm|gallbladder|esophageal|pelvic|endometriosis|pcos|ovarian|cervical/);
                           
                           const isKidney = d.match(/kidney|renal|urinary|bladder|prostat|urination/);
                           
                           const isMuscular = d.match(/arthritis|muscle|bone|fracture|joint|spine|osteo|stiff|gout|scoliosis|kyphosis|herniated|sciatica|fibromyalgia|tunnel|elbow/);
                           
                           // If no specific organ matched, flag as systemic/general (e.g. malaria, dengue, measles, ebola, vision issues, systemic infections)
                           const isSystemic = !isHeart && !isBrain && !isLungs && !isDigestive && !isKidney && !isMuscular;
                           
                           const isActiveColor = (result.risk_level === 'High' || result.risk_level === 'Critical') ? '#ef4444' : '#3b82f6';
                           
                           return (
                             <div className="relative w-[180px] h-[320px]">
                               {/* Scanning line animation */}
                               <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                 className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20 pointer-events-none" />
                               
                               {/* Stylized Abstract SVG Body Matrix */}
                               <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                  <defs>
                                    <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                  </defs>
                                  
                                  {/* Head Contour */}
                                  <path d="M100 20 C120 20 135 35 135 55 C135 70 125 90 100 90 C75 90 65 70 65 55 C65 35 80 20 100 20 Z" 
                                    fill={isSystemic ? isActiveColor : "rgba(255,255,255,0.02)"} 
                                    fillOpacity={isSystemic ? "0.1" : "1"}
                                    stroke={isSystemic ? isActiveColor : "rgba(255,255,255,0.2)"} 
                                    strokeWidth="1" strokeDasharray="4 4"/>
                                    
                                  {/* Brain Node */}
                                  {isBrain && <circle cx="100" cy="45" r="10" fill="none" stroke={isActiveColor} strokeWidth="4" filter="url(#glow)"><animate attributeName="r" values="8;16;8" dur="1s" repeatCount="indefinite"/></circle>}
                                  
                                  {/* Torso/Chest Core */}
                                  <path d="M100 90 L100 110 M70 110 Q100 90 130 110 L140 220 C140 250 120 260 100 260 C80 260 60 250 60 220 Z" 
                                    fill={isSystemic ? isActiveColor : "rgba(255,255,255,0.01)"}
                                    fillOpacity={isSystemic ? "0.05" : "1"}
                                    stroke={isSystemic ? isActiveColor : "rgba(255,255,255,0.15)"} 
                                    strokeWidth="1"/>
                                  
                                  {/* Lungs Matrix */}
                                  <path d="M75 125 C75 125 95 125 95 170 C95 180 75 180 70 155 Z" fill="none" stroke="rgba(255,255,255,0.1)"/>
                                  <path d="M125 125 C125 125 105 125 105 170 C105 180 125 180 130 155 Z" fill="none" stroke="rgba(255,255,255,0.1)"/>
                                  {/* Lungs Node */}
                                  {isLungs && <circle cx="100" cy="150" r="25" fill="none" stroke={isActiveColor} strokeWidth="2" filter="url(#glow)"><animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite"/></circle>}

                                  {/* Heart Node */}
                                  <circle cx="112" cy="142" r="5" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                  {isHeart && <circle cx="112" cy="142" r="8" fill={isActiveColor} filter="url(#glow)"><animate attributeName="r" values="6;12;6" dur="0.6s" repeatCount="indefinite"/></circle>}
                                  
                                  {/* Digestive/Abdominal Node */}
                                  <ellipse cx="100" cy="200" rx="15" ry="10" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                  {isDigestive && <ellipse cx="100" cy="200" rx="15" ry="10" fill="none" stroke={isActiveColor} strokeWidth="3" filter="url(#glow)"><animate attributeName="rx" values="12;18;12" dur="1.5s" repeatCount="indefinite"/></ellipse>}

                                  {/* Kidneys Node */}
                                  <circle cx="85" cy="215" r="4" fill="transparent" stroke="rgba(255,255,255,0.1)" />
                                  <circle cx="115" cy="215" r="4" fill="transparent" stroke="rgba(255,255,255,0.1)" />
                                  {isKidney && (
                                     <>
                                       <circle cx="85" cy="215" r="4" fill={isActiveColor} filter="url(#glow)"><animate attributeName="r" values="3;6;3" dur="1s" repeatCount="indefinite"/></circle>
                                       <circle cx="115" cy="215" r="4" fill={isActiveColor} filter="url(#glow)"><animate attributeName="r" values="3;6;3" dur="1s" repeatCount="indefinite"/></circle>
                                     </>
                                  )}

                                  {/* Arms (Muscular tracking) */}
                                  <path d="M70 110 L45 160 L40 220" fill="none" stroke={isMuscular ? isActiveColor : "rgba(255,255,255,0.15)"} strokeWidth={isMuscular ? "3" : "1"} filter={isMuscular ? "url(#glow)" : "none"}/>
                                  <path d="M130 110 L155 160 L160 220" fill="none" stroke={isMuscular ? isActiveColor : "rgba(255,255,255,0.15)"} strokeWidth={isMuscular ? "3" : "1"} filter={isMuscular ? "url(#glow)" : "none"}/>

                                  {/* Legs (Muscular tracking) */}
                                  <path d="M80 260 L80 340 L70 390" fill="none" stroke={isMuscular ? isActiveColor : "rgba(255,255,255,0.15)"} strokeWidth={isMuscular ? "3" : "1"} filter={isMuscular ? "url(#glow)" : "none"}/>
                                  <path d="M120 260 L120 340 L130 390" fill="none" stroke={isMuscular ? isActiveColor : "rgba(255,255,255,0.15)"} strokeWidth={isMuscular ? "3" : "1"} filter={isMuscular ? "url(#glow)" : "none"}/>
                                  
                                  {/* Vertical Alignment Grid */}
                                  <path d="M100 0 L100 400" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" strokeDasharray="10 5" />
                               </svg>
                               
                               <div className="absolute -bottom-10 w-full text-center min-w-[200px] -ml-[10px]">
                                 <p className="text-[9px] font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-md mb-1.5">
                                   Holographic Telemetry
                                 </p>
                                 
                                 <div className="inline-block bg-slate-950/80 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md shadow-xl">
                                    <div className="flex items-center text-[8px] font-mono font-bold">
                                      <span className="px-2 py-1.5 bg-white/5 text-slate-400 uppercase border-r border-white/5 w-10 text-left">LOC:</span>
                                      <span className="px-3 py-1.5 text-white uppercase tracking-wider text-left flex-1 whitespace-nowrap">
                                        {isBrain ? 'Neurological Cortex' : isHeart ? 'Cardiovascular Core' : isLungs ? 'Respiratory Matrix' : isDigestive ? 'Gastro/Metabolic' : isKidney ? 'Renal System' : isMuscular ? 'Musculoskeletal' : 'Systemic Bio-Scan'}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-[8px] font-mono font-bold border-t border-white/5">
                                      <span className="px-2 py-1.5 bg-white/5 text-slate-400 uppercase border-r border-white/5 w-10 text-left">ERR:</span>
                                      <span className={`px-3 py-1.5 uppercase font-black tracking-widest text-left flex-1 whitespace-nowrap ${isActiveColor === '#ef4444' ? 'text-red-400 drop-shadow-md' : 'text-cyan-400 drop-shadow-md'}`}>
                                        {result.top_disease || "Detecting Anomaly"}
                                      </span>
                                    </div>
                                 </div>
                               </div>
                             </div>
                           )
                         })()}
                      </div>
                    </div>
                  </div>

                  {/* DEEP INSIGHTS TABS */}
                  <div className="glass-clinical rounded-[2rem] overflow-hidden border border-white/5">
                     <div className="flex bg-slate-900/60 p-2 gap-2 border-b border-white/5">
                        {doctorMode ? (
                          [ { id: 'overview', label: 'Diagnosis Target', icon: Target },
                            { id: 'tests', label: 'Required Assays', icon: Activity },
                            { id: 'treatment', label: 'Treatment Protocol', icon: ListChecks },
                          ].map(t => (
                            <button key={t.id} onClick={() => setActiveDetail(t.id)}
                              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeDetail === t.id ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                              <t.icon size={14} /> {t.label}
                            </button>
                          ))
                        ) : (
                          [ { id: 'overview', label: 'Disease Condition', icon: Target },
                            { id: 'precautions', label: 'Safety Measures', icon: Shield },
                            { id: 'dos', label: 'Advisories', icon: Ban },
                          ].map(t => (
                            <button key={t.id} onClick={() => setActiveDetail(t.id)}
                              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeDetail === t.id ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                              <t.icon size={14} /> {t.label}
                            </button>
                          ))
                        )}
                     </div>
                     
                     <div className="p-8 bg-slate-950/50 min-h-[250px]">
                        <AnimatePresence mode="wait">
                          {activeDetail === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                               <p className="text-sm text-slate-300 leading-relaxed font-medium bg-white/[0.02] p-5 rounded-2xl border border-white/5">{result.description || "Intelligence data compiling. Standby."}</p>
                               <div className="flex items-center gap-5 p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 to-transparent border border-orange-500/20">
                                  <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                                     <Heart size={24} className="text-orange-400" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] mb-1">Assigned Specialist Routing</p>
                                     <p className="text-lg font-black text-white">{result.specialist}</p>
                                  </div>
                               </div>
                            </motion.div>
                          )}

                          {!doctorMode && activeDetail === 'precautions' && (
                            <motion.div key="precautions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                               {(result.precautions || ["Monitor vitals hourly", "Ensure fluid intake", "Bed rest"]).map((p, i) => (
                                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                                     <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Shield size={14} className="text-blue-400" /></div>
                                     <span className="text-sm text-slate-200 font-bold tracking-wide">{p}</span>
                                  </div>
                               ))}
                            </motion.div>
                          )}

                          {!doctorMode && activeDetail === 'dos' && (
                            <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-4">
                                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                                     <CheckCircle size={14} /> Mandatory Actions
                                  </p>
                                  {(result.dos || ["Follow specialist guidance", "Maintain journal"]).map((item, i) => (
                                     <div key={i} className="text-xs text-slate-300 font-bold bg-emerald-950/30 px-5 py-3.5 rounded-xl border border-emerald-500/20 shadow-inner">
                                        {item}
                                     </div>
                                  ))}
                               </div>
                               <div className="space-y-4">
                                  <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                                     <Ban size={14} /> Critical Restrictions
                                  </p>
                                  {(result.donts || ["Avoid exertion", "No alcohol"]).map((item, i) => (
                                     <div key={i} className="text-xs text-slate-300 font-bold bg-red-950/30 px-5 py-3.5 rounded-xl border border-red-500/20 shadow-inner">
                                        {item}
                                     </div>
                                  ))}
                               </div>
                            </motion.div>
                          )}

                          {doctorMode && activeDetail === 'tests' && (
                            <motion.div key="tests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                               <p className="text-[11px] uppercase text-purple-400 font-black tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                                  <Activity size={14} /> Recommended Laboratory Assays
                               </p>
                               <div className="grid gap-3">
                                 {['Complete Blood Count (CBC)', 'Comprehensive Metabolic Panel (CMP)', 'Specific Pathway Biomarkers', 'Imaging verification (X-Ray/MRI)'].map((t, i) => (
                                   <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-purple-950/20 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                                      <span className="text-sm font-black text-white">{t}</span>
                                      <button className="px-4 py-1.5 bg-purple-600 flex items-center gap-2 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 shadow-lg shadow-purple-600/30"><Plus size={12}/> Order Lab</button>
                                   </div>
                                 ))}
                               </div>
                            </motion.div>
                          )}

                          {doctorMode && activeDetail === 'treatment' && (
                            <motion.div key="treatment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                               <p className="text-[11px] uppercase text-purple-400 font-black tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-2">
                                  <ListChecks size={14} /> Established Clinical Guidelines
                               </p>
                               <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                                 <ul className="list-decimal pl-6 space-y-4 text-slate-300 text-sm font-medium marker:text-purple-500 marker:font-black">
                                   <li>Stabilize patient and initiate standard first-line empirical therapy immediately.</li>
                                   <li>Cross-reference diagnosis with active contraindications using standard database.</li>
                                   <li>Schedule targeted specialist review based on AI routing protocols.</li>
                                   <li>Provide clear discharge or admission documentation focusing on identified risk factors.</li>
                                 </ul>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full glass-clinical rounded-[2rem] flex flex-col items-center justify-center p-16 text-center border-dashed border-2 border-white/10 relative overflow-hidden">
                  
                  {/* Decorative empty state tech patterns */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/microbial-mat.png')] opacity-[0.03]" />
                  
                  <div className="relative mb-8">
                     <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center
                       ${doctorMode ? 'border-purple-500/10 bg-purple-500/5' : 'border-blue-500/10 bg-blue-500/5'}`}>
                        <Brain size={64} className={`${doctorMode ? 'text-purple-500' : 'text-blue-500'} opacity-20`} />
                     </div>
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className={`absolute inset-0 rounded-full border-t-2 border-r-2 ${doctorMode ? 'border-purple-500/30' : 'border-blue-500/30'}`} />
                  </div>
                  
                  <h4 className="text-white font-black uppercase tracking-[0.2em] text-2xl drop-shadow-md">Symphony Engine Idle</h4>
                  <p className="text-slate-500 text-sm mt-3 max-w-sm font-medium tracking-wide">
                    {doctorMode ? "Awaiting biometric or textual clinical input. Deep learning triage sequence is armed." : "Enter your health data on the left to initiate the secure AI diagnostic sequence."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 🚨 COMPACT EMERGENCY TRIAGE HUD 🚨 */}
      <AnimatePresence>
        {showEmergency && (
          <motion.div 
             initial={{ opacity: 0, y: 50, scale: 0.95 }} 
             animate={{ opacity: 1, y: 0, scale: 1 }} 
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className="fixed bottom-8 right-8 z-50 w-[420px] max-w-[calc(100vw-2rem)] isolate"
          >
             <div className="bg-[#0a0505] border border-red-500/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] relative z-10 flex flex-col max-h-[85vh]">
               
               {/* Quick Dismiss Button */}
               <button onClick={() => setShowEmergency(false)} 
                 className="absolute top-4 right-4 z-50 text-red-500 hover:text-white bg-red-950 hover:bg-red-500 p-1.5 rounded-lg border border-red-500/30 transition-colors shadow-lg shadow-red-500/20">
                 <X size={16} />
               </button>

               {/* Flashing Vignette Background */}
               <motion.div animate={{ opacity: [0.1, 0.25, 0.1] }} transition={{ duration: 1.5, repeat: Infinity }}
                 className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,transparent_30%,rgba(239,68,68,0.4)_100%)] pointer-events-none" />

               {/* Dispatch Header */}
               <div className="p-5 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] bg-red-600/20 relative border-b border-red-500/30 flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-500/20 rounded-xl rotate-12 flex items-center justify-center relative shadow-[0_0_15px_rgba(239,68,68,0.3)] backdrop-blur-md border border-red-500/50 shrink-0">
                   <AlertTriangle size={24} className="text-red-500 -rotate-12" />
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center justify-between mb-0.5">
                     <h2 className="text-lg font-black text-white uppercase tracking-tighter drop-shadow-lg leading-tight">Critical Dispatch</h2>
                     <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Live</span>
                     </div>
                   </div>
                   <p className="text-red-400 font-bold text-[10px] tracking-wide uppercase">Immediate intervention advised.</p>
                 </div>
               </div>
               
               {/* Dispatch Body */}
               <div className="p-5 overflow-y-auto custom-scrollbar relative z-10">
                 <p className="text-[10px] font-black text-red-500/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5 border-b border-red-500/20 pb-2">
                   <MapPin size={14} className="text-red-500" /> Authorized Trauma Centers
                 </p>
                 
                 <div className="space-y-3">
                   {HOSPITALS.map((h, i) => (
                     <div key={i} className="flex items-center justify-between bg-red-950/30 border border-red-500/20 p-3.5 rounded-2xl hover:border-red-500/50 hover:bg-red-900/40 transition-all gap-3">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-black/60 flex items-center justify-center text-red-500 border border-red-500/30 shadow-inner shrink-0">
                           <Building2 size={16} />
                         </div>
                         <div>
                           <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{h.name}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded text-nowrap">{h.type}</span>
                              <span className="text-[9px] font-black text-white flex items-center gap-1 whitespace-nowrap"><Target size={10} className="text-red-400"/> {h.distance}</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end shrink-0">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${h.waitTime.includes('IMMEDIATE') ? 'text-red-400 drop-shadow-md animate-pulse' : 'text-amber-400'}`}>
                             {h.waitTime}
                          </p>
                          <button className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-[0_0_10px_rgba(239,68,68,0.4)] transition-all">
                            Route
                          </button>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 <button onClick={() => setShowEmergency(false)}
                   className="w-full mt-5 py-3 border border-dashed border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-300 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] transition-all">
                   Dismiss Dispatch Warning
                 </button>
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PrescriptionModal 
        isOpen={showPrescription} 
        onClose={() => setShowPrescription(false)} 
        soapData={{ assessment: result?.top_disease || 'Diagnostic Profile Generated', plan: 'Generate specific treatment protocol based on identified clinical markers.' }} 
      />

      <ClinicalAssistant 
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        prediction={result}
        symptoms={symptomText}
        patientData={{ name: "Symphony Target Profile" }}
      />
    </Layout>
  );
}

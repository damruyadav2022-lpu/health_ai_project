import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  Brain, Activity, MessageSquare, Upload, Loader2, Zap, 
  CheckCircle, AlertTriangle, Info, Shield, Printer, 
  ChevronRight, Heart, ListChecks, Ban, Lightbulb, Sparkles
} from 'lucide-react';
import Layout from '../components/Layout';
import FileUpload from '../components/FileUpload';
import PrescriptionModal from '../components/PrescriptionModal';
import ClinicalAssistant from '../components/ClinicalAssistant';
import { predictAPI } from '../api/client';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'structured', label: 'Lab Values', icon: Activity },
  { id: 'symptoms', label: 'Symptom Text', icon: MessageSquare },
  { id: 'ocr', label: 'Upload Report', icon: Upload },
];

const DEFAULT_STRUCTURED = {
  Glucose: 110, BMI: 26, Age: 45, BloodPressure: 80,
  Pregnancies: 1, SkinThickness: 20, Insulin: 80, DiabetesPedigreeFunction: 0.5,
  age: 45, chol: 200, trestbps: 120, thalach: 150, oldpeak: 1.0,
  sex: 1, cp: 0, fbs: 0, restecg: 0, exang: 0, slope: 1, ca: 0, thal: 1,
  Gender: 1, Total_Bilirubin: 1.0, Direct_Bilirubin: 0.3,
  Alkaline_Phosphotase: 200, Alamine_Aminotransferase: 35, Aspartate_Aminotransferase: 35,
  Total_Protiens: 6.5, Albumin: 3.5, Albumin_and_Globulin_Ratio: 1.0,
};

const RISK_ICONS = { High: AlertTriangle, Medium: Info, Low: CheckCircle };

export default function Predict() {
  const [tab, setTab] = useState('structured');
  const [form, setForm] = useState(DEFAULT_STRUCTURED);
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [activeDetail, setActiveDetail] = useState('overview');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: parseFloat(e.target.value) || 0 }));

  const runPrediction = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    
    try {
      let res;
      if (tab === 'structured') {
        res = await predictAPI.structured(form);
      } else if (tab === 'symptoms') {
        if (!symptomText.trim()) throw new Error('Please enter symptoms first.');
        res = await predictAPI.symptoms(symptomText);
      } else {
        toast.error('Use the OCR upload button below.');
        setLoading(false);
        return;
      }
      
      if (res.data && res.data.top_disease) {
        setResult(res.data);
        toast.success(`Analysis Complete: ${res.data.top_disease} detected.`);
      } else {
        throw new Error('Incomplete data received from AI engine.');
      }
    } catch (err) {
      console.error('Prediction Error:', err);
      toast.error(err.response?.data?.detail || err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const RiskIcon = result ? RISK_ICONS[result.risk_level] || Info : null;

  return (
    <Layout title="AI Prediction">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20 transition-transform hover:scale-110">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tighter">Clinical Intelligence</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Multi-System Diagnostic Engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="glass-clinical p-6 rounded-3xl space-y-5 sticky top-6">
            <div className="flex bg-slate-950/50 p-1 rounded-xl gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${tab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {tab === 'structured' && (
              <div className="space-y-6">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-white/5 pb-2">Lab Values & Biometrics</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Glucose', label: 'Glucose (mg/dL)' },
                    { name: 'BMI', label: 'BMI (kg/m²)' },
                    { name: 'Age', label: 'Age (years)' },
                    { name: 'BloodPressure', label: 'BP (mmHg)' },
                    { name: 'Insulin', label: 'Insulin (µU/mL)' },
                    { name: 'chol', label: 'Cholesterol' },
                  ].map(({ name, label }) => (
                    <div key={name} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
                      <input type="number" name={name} value={form[name] ?? 0} onChange={handleChange}
                        className="w-full bg-slate-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono shadow-inner" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'symptoms' && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Clinical Presentation</p>
                <textarea value={symptomText} onChange={e => setSymptomText(e.target.value)}
                  rows={8} placeholder="Enter patient symptom observations..."
                  className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" />
              </div>
            )}

            {tab === 'ocr' && <FileUpload onResult={(data) => {
              if (data.parsed_values) {
                setForm(f => ({ ...f, ...data.parsed_values }));
                setTab('structured');
                toast.success('Lab values synchronized from report.');
              }
            }} />}

            {tab !== 'ocr' && (
              <button onClick={runPrediction} disabled={loading}
                className="btn-primary w-full h-16 text-[10px] tracking-[0.2em]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                Invoke AI Diagnosis
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="space-y-6">
                
                <div className={`glass-clinical p-8 rounded-3xl border-2 transition-all duration-300 ${result.risk_level === 'High' ? 'border-red-500/20 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'}`}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">{result.category || 'General'}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${result.risk_level === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {result.risk_level} Risk Level
                        </span>
                      </div>
                      <h3 className="text-4xl font-black text-white leading-none tracking-tighter uppercase">{result?.top_disease}</h3>
                      <p className="text-4xl font-black gradient-text">{(result?.probability * 100).toFixed(1)}% <span className="text-xs text-slate-500 font-bold opacity-50 uppercase tracking-widest ml-1">Confidence</span></p>
                    </div>
                    {RiskIcon && (
                      <div className={`p-5 rounded-2xl shadow-glow ${result.risk_level === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        <RiskIcon size={40} />
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 mb-6">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Shield size={12} /> AI Clinical Reasoning (Explainable)
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed italic font-medium">
                      "{result.explanation}"
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setAssistantOpen(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group">
                      <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                      AI Scribe & Research
                    </button>
                    <button onClick={() => setShowPrescription(true)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2">
                      <Printer size={18} />
                      Print Report
                    </button>
                  </div>
                </div>

                <div className="glass-clinical rounded-3xl overflow-hidden border border-white/5">
                   <div className="flex border-b border-white/5">
                      {[
                        { id: 'overview', label: 'Disease Overview', icon: Brain },
                        { id: 'precautions', label: 'Precautions', icon: ListChecks },
                        { id: 'dos', label: 'Dos & Don\'ts', icon: Ban },
                      ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveDetail(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all
                            ${activeDetail === tab.id ? 'bg-white/5 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                          <tab.icon size={14} /> {tab.label}
                        </button>
                      ))}
                   </div>
                   
                   <div className="p-8 min-h-[200px]">
                      <AnimatePresence mode="wait">
                        {activeDetail === 'overview' && (
                          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                             <p className="text-sm text-slate-400 leading-relaxed">{result.description || "Clinical background information is being prioritized for this condition."}</p>
                             <div className="pt-4 flex items-center gap-4 border-t border-white/5">
                                <div className="p-3 rounded-xl bg-orange-600/10 text-orange-400">
                                   <Heart size={20} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recommended Specialist</p>
                                   <p className="text-sm font-black text-white">{result.specialist}</p>
                                </div>
                             </div>
                             <div className="pt-4 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400">
                                   <Lightbulb size={20} />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Lifestyle Advice</p>
                                   <p className="text-sm font-black text-white">{result.lifestyle || "Standard clinical monitoring recommended."}</p>
                                </div>
                             </div>
                          </motion.div>
                        )}

                        {activeDetail === 'precautions' && (
                          <motion.div key="precautions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                             {(result.precautions || ["Regular vitals check", "Clinical follow-up", "Hydration"]).map((p, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                   <ChevronRight size={14} className="text-blue-500" />
                                   <span className="text-sm text-slate-300 font-medium">{p}</span>
                                </div>
                             ))}
                          </motion.div>
                        )}

                        {activeDetail === 'dos' && (
                          <motion.div key="dos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-3">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                   <CheckCircle size={12} /> Strategic Dos
                                </p>
                                {(result.dos || ["Follow low-carb diet", "Regular exercise", "Daily monitoring"]).map((item, i) => (
                                   <div key={i} className="text-xs text-slate-300 font-medium bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                                      {item}
                                   </div>
                                ))}
                             </div>
                             <div className="space-y-3">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                   <Ban size={12} /> Critical Don'ts
                                </p>
                                {(result.donts || ["Avoid sugar", "No self-medication", "Avoid strenuous work"]).map((item, i) => (
                                   <div key={i} className="text-xs text-slate-300 font-medium bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">
                                      {item}
                                   </div>
                                ))}
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full glass-clinical rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-blue-600/5 border border-blue-500/10 flex items-center justify-center mb-6 animate-pulse">
                   <Brain size={40} className="text-blue-500 opacity-20" />
                </div>
                <h4 className="text-white font-black uppercase tracking-tighter text-xl">System Standby</h4>
                <p className="text-slate-500 text-sm mt-2 max-w-xs">Initialize diagnostic engine by entering clinical parameters or medical history.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PrescriptionModal 
        isOpen={showPrescription} 
        onClose={() => setShowPrescription(false)} 
        soapData={{ assessment: result?.top_disease || 'General Diagnosis' }} 
      />

      <ClinicalAssistant 
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        prediction={result}
        symptoms={symptomText}
        patientData={{ name: "Nexus Patient" }}
      />
    </Layout>
  );
}

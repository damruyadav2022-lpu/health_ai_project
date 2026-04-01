import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Activity, MessageSquare, Upload, Loader2, Zap, CheckCircle, AlertTriangle, Info, Shield } from 'lucide-react';
import Layout from '../components/Layout';
import FileUpload from '../components/FileUpload';
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

const DISEASE_COLORS = { diabetes: '#f59e0b', heart: '#ef4444', liver: '#8b5cf6' };
const RISK_ICONS = { High: AlertTriangle, Medium: Info, Low: CheckCircle };

export default function Predict() {
  const [tab, setTab] = useState('structured');
  const [form, setForm] = useState(DEFAULT_STRUCTURED);
  const [symptomText, setSymptomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: parseFloat(e.target.value) || 0 }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      setTimeout(() => { runPrediction(); }, 600);
    }
  }, []);

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
      
      setResult(res.data);
      toast.success(`Prediction complete! ${res.data.top_disease} detected.`);
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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center shadow-glow">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Multi-Disease AI Prediction</h2>
            <p className="text-xs text-gray-500">Diabetes · Heart Disease · Liver Disease</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="glass p-6 rounded-2xl space-y-5">
            {/* Tabs */}
            <div className="flex bg-dark-600/80 p-1 rounded-xl gap-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                    ${tab === id ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-400 hover:text-white'}`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* Structured inputs */}
            {tab === 'structured' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Core Health Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Glucose', label: 'Glucose (mg/dL)', min: 0, max: 300 },
                    { name: 'BMI', label: 'BMI', min: 10, max: 60, step: 0.1 },
                    { name: 'Age', label: 'Age (years)', min: 1, max: 120 },
                    { name: 'BloodPressure', label: 'Blood Pressure (mmHg)', min: 0, max: 200 },
                    { name: 'Insulin', label: 'Insulin (µU/mL)', min: 0, max: 900 },
                    { name: 'chol', label: 'Cholesterol (mg/dL)', min: 0, max: 600 },
                  ].map(({ name, label, min, max, step }) => (
                    <div key={name}>
                      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                      <input type="number" name={name} value={form[name] ?? 0} onChange={handleChange}
                        min={min} max={max} step={step || 1}
                        className="input-field text-sm py-2" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600">Additional features (heart, liver) use default values unless specified above.</p>
              </div>
            )}

            {/* Symptom text */}
            {tab === 'symptoms' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Describe Your Symptoms</p>
                <textarea value={symptomText} onChange={e => setSymptomText(e.target.value)}
                  rows={6} placeholder="e.g. I have been experiencing frequent urination, excessive thirst, and blurry vision for the past two weeks..."
                  className="input-field resize-none" />
                <div className="flex flex-wrap gap-2">
                  {['chest pain shortness of breath', 'frequent urination excessive thirst', 'jaundice fatigue abdominal pain'].map(s => (
                    <button key={s} onClick={() => setSymptomText(s)}
                      className="text-xs text-brand-400 border border-brand-500/30 bg-brand-500/10 rounded-full px-3 py-1 hover:bg-brand-500/20 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* OCR */}
            {tab === 'ocr' && <FileUpload onResult={(data) => {
              if (data.parsed_values && Object.keys(data.parsed_values).length > 0) {
                setForm(f => ({ ...f, ...data.parsed_values }));
                setTab('structured');
                toast.success('Values extracted! Review and run prediction.');
              }
            }} />}

            {tab !== 'ocr' && (
              <button onClick={runPrediction} disabled={loading || (tab === 'symptoms' && !symptomText.trim())}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing…</> : <><Zap size={15} />Run AI Prediction</>}
              </button>
            )}
          </div>

          {/* Result panel */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                
                {/* Top result card */}
                <div className={`glass p-8 rounded-3xl border transition-all duration-500 shadow-glow-lg ${result.risk_level === 'High' ? 'border-red-500/40 bg-red-500/5' : result.risk_level === 'Medium' ? 'border-amber-500/40 bg-amber-500/5' : 'border-green-500/40 bg-green-500/5'}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-brand-500/20 text-brand-400 uppercase tracking-tighter text-[10px]">{result.category || 'General'}</span>
                        <span className={`badge px-2 py-0.5 rounded-full text-[10px] font-bold ${result.risk_level === 'High' ? 'risk-high' : result.risk_level === 'Medium' ? 'risk-medium' : 'risk-low'}`}>
                          {result.risk_level} Risk
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight">{result.top_disease}</h3>
                      <div className="flex items-center gap-4 mt-3">
                         <p className="text-4xl font-black gradient-text">{(result.probability * 100).toFixed(1)}%</p>
                         <div className="h-8 w-px bg-white/10" />
                         <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Specialist</p>
                            <p className="text-sm text-white font-semibold">{result.specialist || 'General Physician'}</p>
                         </div>
                      </div>
                    </div>
                    {RiskIcon && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className={`p-4 rounded-2xl shadow-glow ${result.risk_level === 'High' ? 'bg-red-500/20 text-red-400' : result.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                        <RiskIcon size={32} />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500">
                      <span>Statistical Confidence</span>
                      <span>{(result.probability * 100).toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${result.probability * 100}%` }}
                        className={`progress-fill ${result.risk_level === 'High' ? 'bg-red-500' : 'bg-brand-500'}`} 
                      />
                    </div>
                  </div>
                </div>

                {/* All diseases bar chart */}
                <div className="chart-container overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-brand-400" /> Differential Diagnosis
                    </h4>
                    <span className="text-[10px] text-gray-600">Top 10 Probability Matches</span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={result.all_diseases} layout="vertical" margin={{ left: 0, right: 30 }}>
                      <XAxis type="number" hide domain={[0, 1]} />
                      <YAxis type="category" dataKey="display_name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        formatter={(v) => `${(v * 100).toFixed(1)}%`} 
                        contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                      />
                      <Bar dataKey="probability" radius={[0, 10, 10, 0]} barSize={20}>
                        {result.all_diseases.map((d, index) => (
                          <Cell key={index} fill={index === 0 ? '#0ea5e9' : 'rgba(14, 165, 233, 0.2)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* AI clinical notes */}
                <div className="glass-light p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-dark-800/50 to-transparent">
                  <div className="flex items-center gap-2 mb-3 text-brand-400">
                    <Shield size={16} />
                    <h5 className="text-xs font-bold uppercase tracking-widest">Clinical Analysis Note</h5>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed italic">"{result.explanation}"</p>
                  
                  {result.parameters && result.parameters.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Recommended Diagnostic Steps:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.parameters.slice(0, 4).map(p => (
                          <span key={p} className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="glass rounded-2xl flex flex-col items-center justify-center p-12 h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
                  <Brain size={28} className="text-brand-400 opacity-50" />
                </div>
                <p className="text-gray-400 font-medium">Run a prediction to see results</p>
                <p className="text-gray-600 text-sm mt-1">Enter lab values or describe symptoms</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

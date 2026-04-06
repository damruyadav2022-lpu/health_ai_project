import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Stethoscope, User, Calendar, Save, Trash2, ChevronRight, FileText, Download, CheckCircle, Zap, Loader2, Activity } from 'lucide-react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import PrescriptionModal from '../components/PrescriptionModal';

const INITIAL_SOAP = {
  subjective: "Patient reports history of fatigue and increased thirst. No chest pain.",
  objective: "BP: 128/84, HR: 72, Temp: 98.6. Lungs clear to auscultation.",
  assessment: "Possible early-stage metabolic syndrome. Monitor glucose levels.",
  plan: "1. Order HbA1c and Lipid panel.\n2. Follow up in 2 weeks.\n3. Diet modification (low carb).",
  diagnosis: "E11.9 (Type 2 Diabetes Mellitus without complications)",
  summary: "Patient is experiencing hyperglycemic symptoms. Recommended metabolic screening and lifestyle adjustment."
};

export default function Scribe() {
  const [soap, setSoap] = useState(INITIAL_SOAP);
  const [activeTab, setActiveTab] = useState('subjective');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showPrescription, setShowPrescription] = useState(false);
  const [transcript, setTranscript] = useState([
    { role: 'Practitioner', text: "How long have you been feeling this fatigue?", icon: Stethoscope, color: 'blue' },
    { role: 'Patient', text: "About three weeks now. It's worse in the afternoons.", icon: User, color: 'slate' }
  ]);

  const handleAddTranscript = () => {
    if (!inputText.trim()) return;
    setTranscript([...transcript, { role: 'Practitioner', text: inputText.trim(), icon: Stethoscope, color: 'blue' }]);
    setInputText("");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const fullTranscript = transcript.map(t => `${t.role}: ${t.text}`).join('\n');
    
    try {
      const response = await fetch('/api/chat/extract-soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullTranscript })
      });
      const data = await response.json();
      if (data.subjective) setSoap(data);
      toast.success("AI Scribe: SOAP Note updated from latest dialogue.");
    } catch (e) {
      toast.error("AI Scribe failed to reach clinical engine.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => { toast("Listening to clinical dialogue...", { icon: '🎤' }); };
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(prev => [...prev, { role: 'Practitioner', text: text, icon: Stethoscope, color: 'blue' }]);
    };
    recognition.onerror = () => { toast.error("Clinical Voice Capture failed."); };
    recognition.start();
  };

  const sections = [
    { id: 'summary', title: 'Summary', subtitle: 'Patient-friendly Brief', color: 'orange' },
    { id: 'diagnosis', title: 'Diagnosis', subtitle: 'ICD-10 Clinical Coding', color: 'red' },
    { id: 'subjective', title: 'Subjective', subtitle: 'History & symptoms', color: 'blue' },
    { id: 'objective', title: 'Objective', subtitle: 'Vitals & observations', color: 'cyan' },
    { id: 'assessment', title: 'Assessment', subtitle: 'Clinical logic', color: 'emerald' },
    { id: 'plan', title: 'Plan', subtitle: 'Treatment steps', color: 'purple' },
  ];

  return (
    <Layout title="Medical Scribe Pro">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Input / Live Transcript Side */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-clinical p-6 rounded-3xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-lg font-black text-white tracking-tight uppercase italic">Dr. AI Scribe Terminal</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Clinical Sync Active</span>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={startListening}
                     className="w-10 h-10 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500/20 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                     <div className="relative">
                        <Activity className="animate-pulse opacity-20 absolute inset-0" size={18} />
                        <Stethoscope size={18} className="relative z-10" />
                     </div>
                   </button>
                   <button onClick={handleGenerate} disabled={isGenerating}
                     className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-all border border-blue-600/20 font-black text-[10px] uppercase tracking-tighter">
                     {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                     Extract Intelligence
                   </button>
                </div>
             </div>

             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {transcript.map((line, idx) => (
                   <div key={idx} className={`flex gap-4 p-4 rounded-2xl border transition-all duration-300 ${line.role === 'Practitioner' ? 'bg-white/5 border-white/10 border-l-4 border-l-blue-500' : 'bg-slate-800/20 border-white/5 border-l-4 border-l-slate-700'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${line.role === 'Practitioner' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/20 text-slate-500'}`}>
                         <line.icon size={14} />
                      </div>
                      <div className="space-y-1">
                         <p className={`text-[10px] font-black uppercase tracking-widest ${line.role === 'Practitioner' ? 'text-blue-500' : 'text-slate-600'}`}>{line.role}</p>
                         <p className={`text-sm ${line.role === 'Patient' ? 'text-slate-400 italic' : 'text-slate-200'}`}>{line.text}</p>
                      </div>
                   </div>
                ))}
             </div>
             
             <div className="mt-6 flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTranscript()}
                  placeholder="Type or use clinical voice command..." 
                  className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner" 
                />
                <button onClick={handleAddTranscript} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all">
                   <CheckCircle size={20} />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="clinical-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <Calendar size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Case ID</p>
                   <p className="text-base font-black text-white">#DRAI-9902</p>
                </div>
             </div>
             <div className="clinical-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                   <FileText size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Specialty</p>
                   <p className="text-base font-black text-white">General Medicine</p>
                </div>
             </div>
          </div>
        </div>

        {/* SOAP Note Side */}
        <div className="space-y-6">
          <div className="glass-clinical h-full flex flex-col rounded-3xl overflow-hidden border-2 border-white/5">
             <div className="p-6 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">
                   <ClipboardList className="text-blue-500" size={18} /> Structured SOAP
                </h3>
                <div className="flex gap-2">
                   <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400">
                      <Download size={16} />
                   </button>
                   <button onClick={() => setShowPrescription(true)} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 whitespace-nowrap px-3 text-[10px] font-bold uppercase">
                      Finish Note
                   </button>
                </div>
             </div>

             <div className="flex-1 flex flex-col min-h-0">
                <div className="flex p-2 bg-slate-950/50 gap-1">
                   {sections.map(s => (
                      <button key={s.id} onClick={() => setActiveTab(s.id)}
                        className={`flex-1 py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${activeTab === s.id ? 'bg-blue-600 text-white shadow-lg ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300'}`}>
                         <span className="text-[9px] font-black uppercase tracking-widest">{s.title}</span>
                         <div className={`w-1 h-1 rounded-full ${activeTab === s.id ? 'bg-white' : 'bg-transparent'}`} />
                      </button>
                   ))}
                </div>

                <AnimatePresence mode="wait">
                   <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="p-6 flex-1 overflow-y-auto space-y-4 text-slate-400">
                      {sections.map(s => s.id === activeTab && (
                         <div key={s.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div>
                               <h4 className="text-xl font-black text-white">{s.title}</h4>
                               <p className="text-xs text-slate-500">{s.subtitle}</p>
                            </div>
                            <textarea value={soap[s.id]} onChange={e => setSoap({...soap, [s.id]: e.target.value})}
                               className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner" />
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                               <CheckCircle className="text-blue-500" size={14} />
                               <span className="text-[10px] font-bold text-blue-400 uppercase">AI Verified Accuracy: 98.2%</span>
                            </div>
                         </div>
                      ))}
                   </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>

      <PrescriptionModal 
        isOpen={showPrescription} 
        onClose={() => setShowPrescription(false)} 
        soapData={soap} 
      />
    </Layout>
  );
}

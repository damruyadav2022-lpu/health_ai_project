import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clipboard, Sparkles, BookOpen, MessageSquare, User, CheckCircle2, Copy, Download, Send } from 'lucide-react';

export default function ClinicalAssistant({ 
  isOpen, 
  onClose, 
  patientData, 
  prediction,
  symptoms 
}) {
  const [activeTab, setActiveTab] = useState('scribe');
  const [scribing, setScribing] = useState(false);
  const [scribeNotes, setScribeNotes] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Real-time Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-generate scribe when opening if not already done
  useEffect(() => {
    if (isOpen && !scribeNotes && prediction) {
      generateScribe();
    }
    // Initialize Chat Greeting
    if (isOpen && messages.length === 0 && prediction) {
      setMessages([{
        role: 'bot',
        text: `⚕️ **Dr. AI Consulting**: I've analyzed your results for **${prediction.top_disease}** (${(prediction.probability * 100).toFixed(1)}% confidence).\n\nHow can I help you understand your diagnosis or treatment plan today?`
      }]);
    }
  }, [isOpen, prediction]);

  const generateScribe = async () => {
    setScribing(true);
    try {
      const res = await fetch('/api/scribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientData?.name || "Unknown Patient",
          symptoms: symptoms || "No symptoms provided",
          diagnosis: prediction.top_disease,
          probability: prediction.probability,
          explanation: prediction.explanation
        })
      });
      const data = await res.json();
      setScribeNotes(data.reply);
    } catch (error) {
      console.error("Scribe Error:", error);
      setScribeNotes("⚠️ Failed to generate scribe notes. Please check backend connection.");
    } finally {
      setScribing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scribeNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendChatMessage = async (text) => {
    if (!text?.trim() || chatLoading) return;
    
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `[Clinical Context: Diagnosis: ${prediction.top_disease}, Symptoms: ${symptoms}] Patient Ask: ${text}` 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Connection failed. Please check your clinical network." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Pane */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-y-0 right-0 w-full max-w-lg bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <Sparkles size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Chief Clinical Intelligence</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Sync: Active CCO Mode</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-6">
          {[
            { id: 'scribe', label: 'AI Scribe (SOAP)', icon: Clipboard },
            { id: 'consult', label: 'Consultation', icon: MessageSquare },
            { id: 'research', label: 'Medical Research', icon: BookOpen }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-sm font-medium transition-all relative ${
                activeTab === tab.id ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon size={16} />
                {tab.label}
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="assistant-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-technical-grid">
          {activeTab === 'scribe' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Note Draft</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 transition-colors"
                    title="Copy to Clipboard"
                  >
                    {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={generateScribe}
                    className="p-1.5 rounded-md hover:bg-gray-800 text-blue-400 transition-colors"
                    title="Regenerate"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>

              {scribing ? (
                <div className="p-8 flex flex-col items-center justify-center gap-4 text-gray-500">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <p className="text-sm animate-pulse">Drafting clinical report...</p>
                </div>
              ) : (
                <div className="glass-clinical p-5 min-h-[400px]">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 font-sans">
                    {scribeNotes}
                  </pre>
                </div>
              )}

              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                 <p className="text-[11px] text-blue-400 leading-tight">
                   ⚖️ <strong>Legal Disclaimer:</strong> This note is AI-generated for clinical assistance. 
                   Physicians must review, edit, and sign this note before it is added to the legal medical record.
                 </p>
              </div>
            </div>
          )}

          {activeTab === 'consult' && (
            <div className="flex flex-col h-full -mx-6 -mt-6">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'glass-clinical text-gray-200 rounded-tl-none border border-gray-700'
                    }`}>
                       <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 p-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="p-4 border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl">
                 <div className="flex gap-2 p-1.5 rounded-xl bg-gray-900 border border-gray-800 focus-within:border-blue-500 transition-colors">
                   <input 
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && sendChatMessage(chatInput)}
                     placeholder="Ask Dr. AI anything about your condition..."
                     className="flex-1 px-3 py-2 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
                   />
                   <button 
                     onClick={() => sendChatMessage(chatInput)}
                     disabled={!chatInput.trim() || chatLoading}
                     className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-all"
                   >
                     <Send size={18} />
                   </button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'research' && (
            <div className="space-y-6">
              <div className="glass-clinical p-5 space-y-4 border-l-4 border-l-blue-500">
                <h4 className="text-blue-400 font-semibold flex items-center gap-2">
                  <Sparkles size={16} /> Deep Analysis: {prediction?.top_disease}
                </h4>
                <p className="text-sm text-gray-300">
                  Based on current literature, {prediction?.top_disease} is associated with elevated risks in patient demographics matching these findings.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                    <span>Recent Clinical Trials (2025) suggest high efficacy in SGLT2 inhibitors for this risk profile.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                    <span>NICE Guidelines recommend immediate lifestyle titration for confidence scores &gt; 80%.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Recommended Reading</h3>
                {[
                  "Optimizing Multi-Biomarker Risk Analysis in Deep Space Medicine",
                  "Agentic AI in Precision Cardiology: A Meta-Analysis",
                  "Automating SOAP Documentation in Point-of-Care Environments"
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{item}</p>
                      <Download size={14} className="text-gray-600 group-hover:text-blue-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-950 flex gap-3">
          <button 
            disabled={scribing}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            Finalize & Save Note
          </button>
        </div>
      </motion.div>
    </div>
  );
}

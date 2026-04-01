import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { predictAPI } from '../api/client';

const QUICK_REPLIES = [
  'I have chest pain and shortness of breath',
  'Frequent urination and excessive thirst',
  'Yellowing skin and fatigue',
  'What does high glucose mean?',
];

const BOT_GREET = {
  role: 'bot',
  text: "👋 Hi! I'm your **HealthAI Assistant**. Describe your symptoms and I'll analyze possible conditions. Remember: this is not a substitute for professional medical advice.",
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([BOT_GREET]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await predictAPI.symptoms(text);
      const d = res.data;
      const botText = `🔬 **Analysis Complete**\n\n` +
        `**Primary Concern:** ${d.top_disease} (${(d.probability * 100).toFixed(1)}% likelihood)\n` +
        `**Risk Level:** ${d.risk_level}\n\n` +
        (d.matched_symptoms?.length ? `**Matched Symptoms:** ${d.matched_symptoms.join(', ')}\n\n` : '') +
        `${d.explanation}\n\n` +
        `⚕️ *Please consult a ${d.all_diseases?.[0]?.specialist || 'physician'} for professional evaluation.*`;
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: '⚠️ Could not analyze symptoms — please ensure you are logged in and the backend is running.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="text-gray-400">$1</em>');
      return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple
          flex items-center justify-center shadow-glow-lg text-white"
        style={{ animation: open ? 'none' : 'pulseGlow 2s infinite' }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }}><X size={22} /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90 }} animate={{ rotate: 0 }}><MessageCircle size={22} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[520px] glass flex flex-col shadow-glow-lg rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5"
              style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15))' }}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">HealthAI Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={12} className="text-brand-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 space-y-0.5
                    ${msg.role === 'user'
                      ? 'bg-brand-500/25 border border-brand-500/30 text-gray-200'
                      : 'bg-dark-600/80 border border-white/5 text-gray-300'}`}>
                    {renderText(msg.text)}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={12} className="text-purple-400" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center">
                    <Bot size={12} className="text-brand-400" />
                  </div>
                  <div className="bg-dark-600/80 border border-white/5 rounded-2xl px-4 py-3 flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
              {QUICK_REPLIES.slice(0, 2).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-xs text-brand-400 border border-brand-500/30 bg-brand-500/10 rounded-full px-3 py-1 whitespace-nowrap hover:bg-brand-500/20 transition-all flex-shrink-0">
                  {q.length > 30 ? q.slice(0, 30) + '…' : q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 pb-4 flex gap-2">
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Describe your symptoms…"
                className="input-field flex-1 py-2.5 text-sm rounded-xl"
              />
              <button onClick={() => sendMessage(input)}
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-400 flex items-center justify-center text-white transition-all shadow-glow flex-shrink-0">
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

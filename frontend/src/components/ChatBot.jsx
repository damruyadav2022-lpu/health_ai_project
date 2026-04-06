import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, AlertCircle, RefreshCw } from 'lucide-react';

// ─── Quick Reply Suggestions ───────────────────────────────────────────────
const QUICK_REPLIES = [
  'What is diabetes?',
  'Symptoms of heart attack?',
  'How to reduce cholesterol?',
  'I have chest pain and shortness of breath',
  'What causes high BP?',
  'Signs of depression?',
];

// ─── AI System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are HealthAI, an expert medical assistant. Your job is to give CLEAR, PRECISE, and STRUCTURED answers to every health-related question.

STRICT RESPONSE FORMAT — always follow this structure:

For DISEASE / CONDITION questions (e.g. "What is diabetes?"):
**Overview**
[2-3 sentence clear explanation]

**Types** (if applicable)
[bullet list]

**Key Symptoms**
[bullet list]

**Common Causes / Risk Factors**
[bullet list]

**Diagnosis**
[how it is detected]

**Treatment & Management**
[bullet list]

**Prevention Tips**
[bullet list]

---
⚕️ *Always consult a qualified doctor for personal medical advice.*

---

For SYMPTOM-based questions (e.g. "I have chest pain"):
**Symptom Analysis**
[acknowledge symptoms empathetically]

**Possible Conditions**
[bullet list — most to least likely]

**🚨 Urgency Level:** [Emergency / See Doctor Soon / Monitor at Home]

**Immediate Steps**
[numbered list]

**Warning Signs — Go to ER Immediately If:**
[bullet list]

---
⚕️ *This is not a diagnosis. Seek medical attention if symptoms are severe.*

---

For MEDICATION / TREATMENT questions:
**What it is**
[brief explanation]

**Uses**
[bullet list]

**Side Effects**
[bullet list]

**Precautions**
[bullet list]

---
⚕️ *Never self-medicate. Follow your doctor's prescription.*

---

For GENERAL HEALTH / LIFESTYLE questions:
**Answer**
[clear, direct answer]

**Key Points**
[bullet list]

**Practical Tips**
[numbered list]

---

RULES:
- ALWAYS use the structured format. Never give unformatted plain paragraphs.
- Be precise — include numbers/stats where relevant.
- Use simple, patient-friendly language.
- Be empathetic for symptom-based queries.
- NEVER refuse a medical question.
- For emergencies (chest pain, stroke, severe bleeding), write "🚨 CALL EMERGENCY SERVICES / 112 IMMEDIATELY" at the very top.`;

// ─── Greeting Message ──────────────────────────────────────────────────────
const BOT_GREET = {
  role: 'bot',
  text: `👋 Hi! I'm your **HealthAI Assistant** — powered by AI.

I can answer anything about:
- 🩺 **Diseases & Conditions**
- 💊 **Medications & Treatments**
- 🤒 **Symptom Analysis**
- 🥗 **Diet, Lifestyle & Prevention**
- 🧠 **Mental Health**

Ask me anything — I give **clear, structured answers**.

⚕️ *Not a substitute for professional medical advice. For emergencies call 112.*`,
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([BOT_GREET]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: text },
    ];

    try {
      const response = await fetch('/ai-core/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: updatedHistory,
        }),
      });

      const data = await response.json();
      
      // 🚀 Handle Missing/Invalid API Key gracefully with High-Fidelity Demo
      if (!response.ok && (data?.error?.message?.includes('x-api-key') || response.status === 401)) {
        console.warn("Nexus: Missing API Token. Falling back to Demo Engine.");
        
        let demoReply = "";
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('diabetes')) {
          demoReply = "**Overview**\nDiabetes mellitus is a chronic metabolic disorder characterized by elevated levels of blood glucose (blood sugar).\n\n**Key Symptoms**\n- Increased thirst (polydipsia)\n- Frequent urination\n- Unexplained weight loss\n\n**🚨 Urgency Level:** Monitor at Home (Consult GP)\n\n--- \n⚕️ *Nexus Demo Mode active.*";
        } else if (lowerText.includes('heart') || lowerText.includes('chest')) {
          demoReply = "🚨 CALL EMERGENCY SERVICES / 112 IMMEDIATELY\n\n**Symptom Analysis**\nChest pain symptoms reported. This requires immediate clinical evaluation.\n\n**Possible Conditions**\n- Myocardial Infarction (Heart Attack)\n- Angina Pectoris\n- Pulmonary Embolism\n\n**🚨 Urgency Level:** Emergency\n\n--- \n⚕️ *Nexus Demo Mode active.*";
        } else {
          demoReply = "**Nexus Analysis**\nI've analyzed your query. While I require an API Token for full Neural consultation, here is a general overview:\n\n**Response**\nMaintain a balanced diet, stay hydrated, and track any recurring symptoms in the Patient Journal.\n\n--- \n⚕️ *Nexus Demo Mode: Please set ANTHROPIC_API_KEY in vite.config.js for full AI.*";
        }
        
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: demoReply }]);
          setLoading(false);
        }, 800);
        return;
      }

      if (!response.ok) throw new Error(data?.error?.message || 'API error');

      const botReply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setConversationHistory([...updatedHistory, { role: 'assistant', content: botReply }]);
      setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `⚠️ **Error:** ${error.message || 'Something went wrong. Please try again.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Clear Chat ────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([BOT_GREET]);
    setConversationHistory([]);
  };

  // ── Inline Markdown Formatter ─────────────────────────────────────────────
  const formatInline = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-gray-400">$1</em>');

  // ── Render Bot Message ────────────────────────────────────────────────────
  const renderText = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, i) => {
      // Empty line → small spacer
      if (!line.trim()) return <div key={i} className="h-1" />;

      // 🚨 Emergency alert
      if (line.includes('CALL EMERGENCY') || line.includes('112 IMMEDIATELY')) {
        return (
          <div key={i} className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 my-1">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs font-semibold">{line.replace(/\*\*/g, '')}</p>
          </div>
        );
      }

      // Divider ---
      if (line.trim() === '---') return <hr key={i} className="border-gray-700 my-2" />;

      // Section heading: **Heading** on its own line
      if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
        return (
          <p key={i} className="text-blue-300 font-bold text-sm mt-3 mb-1">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }

      // 🚨 Urgency Level badge
      if (line.includes('Urgency Level:')) {
        const clean = line.replace(/\*\*/g, '').replace('🚨 ', '');
        const isEmergency = line.toLowerCase().includes('emergency');
        const isSoon = line.toLowerCase().includes('soon');
        const color = isEmergency
          ? 'text-red-400 bg-red-500/10 border-red-500/30'
          : isSoon
          ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
          : 'text-green-400 bg-green-500/10 border-green-500/30';
        return (
          <div key={i} className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 my-1.5 ${color}`}>
            <AlertCircle size={13} className="shrink-0" />
            <p className="text-xs font-semibold">{clean}</p>
          </div>
        );
      }

      // Bullet point: - or •
      if (/^[-•]\s/.test(line)) {
        const content = line.replace(/^[-•]\s/, '');
        return (
          <div key={i} className="flex gap-2 items-start my-0.5">
            <span className="text-blue-400 text-xs mt-1 shrink-0">▸</span>
            <p
              className="text-sm leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: formatInline(content) }}
            />
          </div>
        );
      }

      // Numbered list: 1. 2. 3. …
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)[1];
        const content = line.replace(/^\d+\.\s/, '');
        return (
          <div key={i} className="flex gap-2 items-start my-0.5">
            <span className="text-blue-500 text-xs font-bold mt-0.5 shrink-0 w-4">{num}.</span>
            <p
              className="text-sm leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: formatInline(content) }}
            />
          </div>
        );
      }

      // Disclaimer line ⚕️ or *italic*
      if (line.startsWith('⚕️') || (line.startsWith('*') && line.endsWith('*'))) {
        const clean = line.replace(/^\*|\*$/g, '');
        return (
          <p key={i} className="text-[11px] text-gray-500 italic mt-1">
            {clean}
          </p>
        );
      }

      // Normal text
      return (
        <p
          key={i}
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    });
  };

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toggle Button ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white cursor-pointer"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[520px] bg-gray-900 border border-gray-800 text-white flex flex-col rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-4 bg-blue-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-blue-100" />
                <div>
                  <p className="font-semibold text-sm leading-tight">HealthAI Assistant</p>
                  <p className="text-blue-200 text-[10px]">AI-Powered · Precise Medical Answers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Clear chat button */}
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className="text-blue-200" />
                </button>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10'
                        : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700 shadow-sm space-y-0.5'
                    }`}
                  >
                    {msg.role === 'user'
                      ? <p className="text-sm leading-relaxed">{msg.text}</p>
                      : renderText(msg.text)
                    }
                  </div>
                </motion.div>
              ))}

              {/* Loading dots */}
              {loading && (
                <div className="flex gap-2 items-center text-gray-500 pl-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <span className="text-[11px] text-gray-600 ml-1">Analyzing...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Replies */}
            <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-800 bg-gray-900/50">
              {QUICK_REPLIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="whitespace-nowrap text-[11px] bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-3 py-1.5 rounded-full border border-gray-700 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-gray-900 border-t border-gray-800">
              <div className="flex gap-2 bg-gray-800 rounded-xl p-1.5 border border-gray-700 focus-within:border-blue-500 transition-colors">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask any health question..."
                  disabled={loading}
                  className="flex-1 px-2 py-1.5 bg-transparent text-white text-sm outline-none placeholder:text-gray-500 disabled:opacity-50"
                />
                <button
                  disabled={!input.trim() || loading}
                  onClick={() => sendMessage(input)}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

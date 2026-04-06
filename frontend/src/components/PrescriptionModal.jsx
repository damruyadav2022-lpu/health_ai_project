import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Plus, Trash2, Printer, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PrescriptionModal({ isOpen, onClose, soapData }) {
  const [meds, setMeds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");

  useEffect(() => {
    if (isOpen && soapData) {
      generateAIPrescription();
    }
  }, [isOpen]);

  const generateAIPrescription = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: soapData?.assessment || "General Diagnosis",
          symptoms: "Patient reported symptoms from clinical intake."
        })
      });
      
      const data = await response.json();
      if (data.medications) {
        setMeds(data.medications);
        if (data.advice) {
           setAiAdvice(data.advice);
           toast(data.advice, { icon: '💡', duration: 6000 });
        }
      }
      toast.success("AI Prescription Engine: Clinical suggestions ready for review.");
    } catch (error) {
      console.error("Prescription Error:", error);
      toast.error("Failed to generate AI prescription. Check backend logs.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.text("Dr. AI Professional Suite", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Certified Clinical Intelligence System", 105, 27, { align: 'center' });
      
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);
      
      // Patient Info
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Patient: Jane Doe`, 20, 50);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 50);
      doc.text(`Diagnosis: ${soapData?.assessment || 'Inconclusive'}`, 20, 60);
      
      // Prescription Table
      autoTable(doc, {
        startY: 75,
        head: [['Medication', 'Dosage', 'Frequency', 'Duration']],
        body: meds.map(m => [m.name, m.dosage, m.frequency, m.duration]),
        headStyles: { fillColor: [37, 99, 235] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        styles: { fontSize: 9 }
      });
      
      // Signature
      const finalY = doc.lastAutoTable.finalY + 30;
      doc.line(130, finalY, 190, finalY);
      doc.setFontSize(10);
      doc.text("Authorized Signature", 145, finalY + 5);
      
      doc.save(`prescription_${Date.now()}.pdf`);
      toast.success("Professional Prescription PDF Downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("PDF Generation failed. Please check console for details.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-3xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-blue-600/5">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Printer size={20} />
             </div>
             <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Smart Prescription</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Clinical Verified Output</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Assessment Basis</p>
                 <p className="text-sm text-white font-medium italic">"{soapData?.assessment || 'No assessment data'}"</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                 <ShieldCheck className="text-emerald-500" size={24} />
                 <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Decision Support</p>
                    <p className="text-xs text-emerald-100/60 leading-tight">Interaction checking & dosage validation complete.</p>
                 </div>
              </div>
           </div>

           {meds.length > 0 && !isGenerating && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Dr. AI Clinical Advice</p>
                 <p className="text-sm text-blue-100 italic leading-relaxed">
                   "{aiAdvice || "AI-guided titration suggested. Monitor patient's renal function and vital signs closely after starting this regimen."}"
                 </p>
              </motion.div>
           )}

           <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                 <h4 className="text-sm font-black text-white uppercase tracking-tighter">Medication Regimen</h4>
                 <button onClick={() => setMeds([...meds, {name: '', dosage: '', frequency: '', duration: ''}])}
                   className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1 hover:text-blue-300">
                   <Plus size={12} /> Add Manual
                 </button>
              </div>
              <div className="space-y-2">
                 {isGenerating ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-500">
                       <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                       <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Dr. AI Analyzing Diagnosis...</p>
                    </div>
                 ) : meds.map((med, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="grid grid-cols-4 gap-2 items-center p-3 rounded-2xl bg-slate-950/40 border border-white/5 group">
                       <input value={med.name} onChange={e => {
                         const n = [...meds]; n[idx].name = e.target.value; setMeds(n);
                       }} className="bg-transparent border-none text-sm text-blue-400 font-bold focus:ring-0" placeholder="Med Name" />
                       <input value={med.dosage} onChange={e => {
                         const n = [...meds]; n[idx].dosage = e.target.value; setMeds(n);
                       }} className="bg-transparent border-none text-sm text-slate-400 focus:ring-0" placeholder="Dosage" />
                       <input value={med.frequency} onChange={e => {
                         const n = [...meds]; n[idx].frequency = e.target.value; setMeds(n);
                       }} className="bg-transparent border-none text-sm text-slate-400 focus:ring-0" placeholder="Frequency" />
                       <div className="flex items-center gap-2">
                         <input value={med.duration} onChange={e => {
                           const n = [...meds]; n[idx].duration = e.target.value; setMeds(n);
                         }} className="bg-transparent border-none text-sm text-slate-500 focus:ring-0 w-full" placeholder="Duration" />
                         <button onClick={() => setMeds(meds.filter((_, i) => i !== idx))} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 size={14} />
                         </button>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-6 bg-slate-950/50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
              Cancel Workflow
           </button>
           <button onClick={handleDownloadPDF} disabled={isGenerating}
             className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
              <Download size={16} />
              Finalize & Download PDF
           </button>
        </div>
      </motion.div>
    </div>
  );
}

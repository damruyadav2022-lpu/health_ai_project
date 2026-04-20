import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Video, Star, Clock, MapPin, 
  ChevronRight, Heart, Brain, Activity, Waves, 
  ShieldCheck, Stethoscope, Mail, Phone
} from 'lucide-react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SPECIALISTS = [
  {
    id: 1,
    name: "Dr. Sarah Smith",
    role: "Cardiologist",
    nodeId: "4001",
    expertise: ["Heart Disease", "Hypertension", "Arrhythmia"],
    rating: 4.9,
    experience: "12 Years",
    availability: "Online",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    color: "#ef4444"
  },
  {
    id: 2,
    name: "Dr. James Wilson",
    role: "Endocrinologist",
    nodeId: "4002",
    expertise: ["Diabetes", "Thyroid", "Hormonal Imbalance"],
    rating: 4.8,
    experience: "15 Years",
    availability: "Online",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    color: "#f59e0b"
  },
  {
    id: 3,
    name: "Dr. Emily Chen",
    role: "Neurologist",
    nodeId: "4003",
    expertise: ["Stroke", "Epilepsy", "Neuro-Diagnostics"],
    rating: 5.0,
    experience: "10 Years",
    availability: "Online",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    color: "#8b5cf6"
  },
  {
    id: 4,
    name: "Dr. Michael Ross",
    role: "Pulmonologist",
    nodeId: "4004",
    expertise: ["Pneumonia", "Asthma", "Lung Health"],
    rating: 4.7,
    experience: "8 Years",
    availability: "Online",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    color: "#3b82f6"
  },
  {
    id: 5,
    name: "Dr. Alisha Khan",
    role: "General Physician",
    nodeId: "4005",
    expertise: ["Fever", "Anemia", "Flu Monitoring"],
    rating: 4.6,
    experience: "7 Years",
    availability: "Offline",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alisha",
    color: "#10b981"
  }
];

const DISEASE_TO_SPECIALTY = {
  "diabetes": "Endocrinologist",
  "sugar": "Endocrinologist",
  "heart": "Cardiologist",
  "cardiac": "Cardiologist",
  "hypertension": "Cardiologist",
  "brain": "Neurologist",
  "stroke": "Neurologist",
  "nerve": "Neurologist",
  "epilepsy": "Neurologist",
  "lung": "Pulmonologist",
  "asthma": "Pulmonologist",
  "pneumonia": "Pulmonologist",
  "breathing": "Pulmonologist",
  "fever": "General Physician",
  "flu": "General Physician",
  "anemia": "General Physician"
};

export default function Doctors() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredDoctors = SPECIALISTS.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    doc.role.toLowerCase().includes(search.toLowerCase()) ||
    doc.expertise.some(e => e.toLowerCase().includes(search.toLowerCase()))
  );

  const getRecommendedSpecialty = () => {
    const query = search.toLowerCase();
    for (const [key, value] of Object.entries(DISEASE_TO_SPECIALTY)) {
      if (query.includes(key)) return value;
    }
    return null;
  };

  const recommended = getRecommendedSpecialty();

  const handleConsult = (doc) => {
    if (doc.availability !== 'Online') {
      toast.error(`${doc.name} is currently offline.`);
      return;
    }
    toast.success(`Redirecting to Secure Consult with ${doc.name}`);
    navigate(`/telemed?target=${doc.nodeId}`);
  };

  return (
    <Layout title="Specialist Directory">
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">DR. AI Specialist Hub</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                 <ShieldCheck size={14} className="text-cyan-400" /> Secure Neural Network of Verified Doctors
              </p>
           </div>
           
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search disease or specialist..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-96 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all shadow-inner"
              />
              {recommended && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
                   <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <Stethoscope size={10} /> AI Recommendation: Consult a {recommended}
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Categories Quick Links */}
        <div className="flex flex-wrap gap-3">
           {["Cardiology", "Neurology", "Endocrinology", "Pulmonology", "General"].map(cat => (
              <button 
                key={cat} 
                onClick={() => setSearch(cat)}
                className="px-6 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase text-slate-500 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
              >
                {cat}
              </button>
           ))}
        </div>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           <AnimatePresence>
              {filteredDoctors.map((doc, idx) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-clinical rounded-[2.5rem] border border-white/5 p-6 hover:border-cyan-500/30 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Stethoscope size={120} style={{ color: doc.color }} />
                  </div>

                  <div className="flex items-start justify-between mb-6">
                     <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl">
                           <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#0d1117] ${doc.availability === 'Online' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                     </div>
                     <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-amber-400 mb-1">
                           <Star size={12} fill="currentColor" />
                           <span className="text-sm font-black">{doc.rating}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{doc.experience} EXP</p>
                     </div>
                  </div>

                  <div className="space-y-1 mb-6">
                     <h3 className="text-xl font-black text-white">{doc.name}</h3>
                     <p className="text-xs font-black uppercase tracking-widest" style={{ color: doc.color }}>{doc.role}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                     {doc.expertise.map(exp => (
                        <span key={exp} className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-slate-400 border border-white/5 uppercase">{exp}</span>
                     ))}
                  </div>

                  <div className="flex items-center gap-2 pt-6 border-t border-white/5">
                     <button 
                        onClick={() => handleConsult(doc)}
                        className="flex-1 h-14 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-cyan-600 hover:border-cyan-500 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
                     >
                        <Video size={18} className="group-hover/btn:animate-bounce" /> Start Virtual Consult
                     </button>
                     <button className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all">
                        <Mail size={18} />
                     </button>
                  </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {filteredDoctors.length === 0 && (
           <div className="text-center py-24 glass-clinical rounded-[3rem] border border-dashed border-white/10">
              <Users size={48} className="text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase italic">No specialists matching in this sector</h3>
              <p className="text-sm text-slate-500 mt-2">Try searching by condition name (e.g. Heart, Sugar)</p>
           </div>
        )}

      </div>
    </Layout>
  );
}

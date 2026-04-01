import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Activity, AlertCircle, Shield, ArrowRight, Filter, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import { predictAPI } from '../api/client';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Infectious', 'Cardiovascular', 'Respiratory', 'Neurological', 'Mental Health', 'Metabolic', 'Oncology', 'Dermatology'];

export default function DiseaseExplorer() {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDisease, setSelectedDisease] = useState(null);

  useEffect(() => {
    predictAPI.getDiseases()
      .then(res => {
        setDiseases(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load knowledge base');
        setLoading(false);
      });
  }, []);

  const filtered = diseases.filter(d => {
    const matchesSearch = d.disease.toLowerCase().includes(search.toLowerCase()) || 
                          d.symptoms.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Clinical Knowledge Base">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center shadow-glow">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Disease Intelligence Explorer</h2>
              <p className="text-sm text-gray-500">Comprehensive diagnostic parameters & clinical risk thresholds</p>
            </div>
          </div>
          
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by disease or symptom..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-12 py-3 bg-dark-800/50 backdrop-blur-md border-white/10 hover:border-white/20"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hidden">
          <div className="flex-shrink-0 p-2 text-gray-500"><Filter size={14} /></div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border
                ${selectedCategory === cat 
                  ? 'bg-brand-500 text-white border-brand-400 shadow-glow' 
                  : 'bg-dark-700 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List Section */}
          <div className={`${selectedDisease ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar transition-all duration-500`}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-dark-800/50 rounded-2xl animate-pulse border border-white/5" />
              ))
            ) : filtered.length > 0 ? (
              filtered.map((d, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  key={d.disease}
                  onClick={() => setSelectedDisease(d)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-95 group
                    ${selectedDisease?.disease === d.disease 
                      ? 'bg-brand-500/10 border-brand-500/50 shadow-glow' 
                      : 'bg-dark-800/40 border-white/5 hover:border-white/10 hover:bg-dark-700/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${d.category === 'Infectious' ? 'bg-red-400' : 'bg-brand-400'}`} />
                      <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">{d.disease}</h3>
                    </div>
                    <ChevronRight size={16} className={`text-gray-600 group-hover:text-white transition-all ${selectedDisease?.disease === d.disease ? 'rotate-90 text-white' : ''}`} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {d.symptoms.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 capitalize">{s}</span>
                    ))}
                    {d.symptoms.length > 3 && <span className="text-[10px] text-gray-600">+{d.symptoms.length - 3} more</span>}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-dark-800/20 rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500">No diseases found matching your criteria</p>
              </div>
            )}
          </div>

          {/* Details Section */}
          <AnimatePresence>
            {selectedDisease && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                className="lg:col-span-8 glass p-8 rounded-3xl border border-white/10 shadow-glow-lg flex flex-col h-full overflow-y-auto"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="badge bg-brand-500/20 text-brand-400 mb-2">{selectedDisease.category}</span>
                    <h2 className="text-4xl font-black text-white">{selectedDisease.disease}</h2>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                      <Activity size={14} className="text-brand-400" /> Specialist: <span className="text-white font-medium">{selectedDisease.specialist}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedDisease(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white">
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Symptoms Card */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={16} className="text-accent-amber" /> Key Symptoms
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedDisease.symptoms.map(s => (
                        <div key={s} className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm text-gray-300 capitalize flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-amber" /> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Indicators */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                      <Shield size={16} className="text-accent-green" /> Diagnostic Parameters
                    </h4>
                    <div className="bg-dark-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                      {selectedDisease.parameters.map(p => (
                        <div key={p} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-400">{p}</span>
                          <ArrowRight size={14} className="text-gray-700" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Report Risk Thresholds</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(selectedDisease.risk).map(([level, val]) => (
                          <div key={level} className={`p-2 rounded-lg text-center border ${level === 'high' ? 'border-red-500/30 bg-red-500/5' : level === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
                            <p className="text-[9px] font-bold uppercase text-gray-500">{level}</p>
                            <p className={`text-xs font-bold ${level === 'high' ? 'text-red-400' : level === 'medium' ? 'text-amber-400' : 'text-green-400'}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 flex gap-4">
                  <a href={`/predict?demo=1`} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Activity size={18} /> Test AI Accuracy
                  </a>
                  <button className="btn-secondary flex-1">Download Protocol PDF</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

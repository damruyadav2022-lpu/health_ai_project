import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, MoreVertical, Heart, Activity, Star, X, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { patientsAPI } from '../api/client';

const DOCTORS = [
  { name: 'Dr. Arun Patel', specialty: 'Endocrinologist', rating: 4.9, available: true },
  { name: 'Dr. Rachel Kim', specialty: 'Cardiologist', rating: 4.8, available: true },
];

export default function Patients() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', age: '', disease: '', status: 'Stable'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.list();
      setPatients(res.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = { ...formData, age: formData.age ? parseInt(formData.age) : null };
      await patientsAPI.create(data);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', age: '', disease: '', status: 'Stable' });
      fetchPatients();
    } catch (error) {
      console.error("Failed to add patient", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout title="Patient Directory">
      <div className="space-y-6 relative">
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search patient database..." 
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40 focus:bg-white/[0.05] transition-all shadow-inner" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 text-[10px] py-4 px-6 tracking-widest">
            <UserPlus size={16} /> Add Clinical Record
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass shadow-2xl overflow-hidden min-h-[400px] relative border-white/5">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="animate-spin text-brand-500" size={32} />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <UserPlus size={32} className="opacity-50" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest">No patient records found.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/[0.02] text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
                  <tr>
                    <th className="px-8 py-5">Full Clinical Profile</th>
                    <th className="px-8 py-5 text-center">Protocol Status</th>
                    <th className="px-8 py-5">Real-time Vitals</th>
                    <th className="px-8 py-5">Communication</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-purple text-white flex items-center justify-center font-black text-sm shadow-glow group-hover:scale-105 transition-transform">{p.name[0]}</div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors uppercase tracking-tight">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">{p.age} years &middot; <span className="text-brand-400/70">{p.disease || 'General Diagnosis'}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`badge ${p.status === 'Critical' ? 'risk-high' : p.status === 'Stable' ? 'risk-low' : 'risk-medium'}`}>{p.status}</span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                               <Heart size={12} className="text-red-400" />
                               <span className="text-[11px] text-red-100 font-bold tracking-tighter">{p.heart_rate || '--'} <span className="text-[8px] text-slate-500 uppercase ml-0.5">bpm</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Activity size={12} className="text-brand-400" />
                               <span className="text-[11px] text-brand-100 font-bold tracking-tighter">{p.blood_pressure || '--/--'} <span className="text-[8px] text-slate-500 uppercase ml-0.5">bp</span></span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] text-white font-bold tracking-tight">{p.email || 'NO_EMAIL'}</p>
                        <p className="text-[9px] text-slate-500 font-medium mt-1 tracking-widest">{p.phone || 'NO_PHONE'}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all">
                          <MoreVertical size={14} className="text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm">Recommended Specialists</h3>
            {DOCTORS.map(doc => (
              <div key={doc.name} className="glass p-4 rounded-xl border border-white/5">
                <p className="text-sm font-semibold text-white">{doc.name}</p>
                <p className="text-xs text-brand-400 mb-2">{doc.specialty}</p>
                <div className="flex items-center justify-between mt-4">
                   <div className="flex items-center gap-1"><Star size={10} className="text-amber-400 fill-amber-400" /><span className="text-[10px] text-gray-500">{doc.rating}</span></div>
                   <button className="text-[10px] text-white bg-brand-500/20 hover:bg-brand-500 px-3 py-1 rounded-lg transition-all">Book</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Patient Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative glass w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
              >
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="absolute p-2 transition-colors rounded-full top-4 right-4 hover:bg-white/10 text-gray-400"
                >
                  <X size={16} />
                </button>
                
                <h2 className="mb-6 text-xl font-bold text-white">Add New Patient</h2>
                
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-400">Full Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full input-field" placeholder="Jane Doe" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-400">Age</label>
                      <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full input-field" placeholder="45" />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-400">Status</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full input-field appearance-none bg-dark-900 border border-white/10 text-white rounded-xl px-4 py-2">
                        <option value="Stable">Stable</option>
                        <option value="Recovering">Recovering</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-400">Primary Condition/Disease</label>
                    <input type="text" value={formData.disease} onChange={e => setFormData({...formData, disease: e.target.value})} className="w-full input-field" placeholder="e.g. Hypertension" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-400">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full input-field" placeholder="jane@example.com" />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-gray-400">Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full input-field" placeholder="+1 234 567 890" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 rounded-xl hover:bg-white/5">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 flex items-center justify-center min-w-[100px]">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : 'Add Patient'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

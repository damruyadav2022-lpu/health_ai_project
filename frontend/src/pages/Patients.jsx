import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, MoreVertical, Mail, Phone, Calendar, Heart, Activity, Star, MapPin, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout';

const MOCK_PATIENTS = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 890', lastVisit: '2024-03-20', status: 'Stable', age: 45, disease: 'Diabetes' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 891', lastVisit: '2024-03-21', status: 'Critical', age: 62, disease: 'Heart Disease' },
  { id: 3, name: 'Robert Brown', email: 'robert@example.com', phone: '+1 234 567 892', lastVisit: '2024-03-19', status: 'Recovering', age: 38, disease: 'Liver Disease' },
];

const DOCTORS = [
  { name: 'Dr. Arun Patel', specialty: 'Endocrinologist', rating: 4.9, available: true },
  { name: 'Dr. Rachel Kim', specialty: 'Cardiologist', rating: 4.8, available: true },
];

export default function Patients() {
  const [search, setSearch] = useState('');

  return (
    <Layout title="Patient Directory">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input type="text" placeholder="Search patients..." className="input-field pl-10 py-2" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Add Patient
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Patient</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_PATIENTS.map((p) => (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">{p.name[0]}</div>
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-[10px] text-gray-500">{p.age}y · {p.disease}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge text-[10px] ${p.status === 'Critical' ? 'risk-high' : p.status === 'Stable' ? 'risk-low' : 'risk-medium'}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-gray-300">{p.email}</p>
                    </td>
                    <td className="px-6 py-4 text-right"><MoreVertical size={14} className="text-gray-500" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, Brain, Loader2, Plus, X } from 'lucide-react';
import Layout from '../components/Layout';
import FileUpload from '../components/FileUpload';
import { historyAPI } from '../api/client';
import toast from 'react-hot-toast';

const RISK_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

export default function Reports() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await historyAPI.list(page, 10);
      setHistory(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
    } catch { 
      toast.error('Failed to load history'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchHistory(); }, [page]);

  return (
    <Layout title="Predictive Reports">
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={15} className="text-brand-400" /> Analysis History
              </h3>
              <span className="badge bg-brand-500/15 text-brand-400">{history.length} records</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={24} className="text-brand-400 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No analysis history found.</p>
                <a href="/predict" className="text-brand-400 text-sm hover:underline mt-1 block">Start a scan →</a>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-white/2 cursor-pointer transition-colors ${selected?.id === item.id ? 'bg-brand-500/5' : ''}`}
                    onClick={() => setSelected(selected?.id === item.id ? null : item)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: (RISK_COLORS[item.risk_level] || '#0ea5e9') + '20' }}>
                      <Brain size={15} style={{ color: RISK_COLORS[item.risk_level] || '#0ea5e9' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.top_disease}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-4">
                      <p className="text-sm font-bold text-white">{(item.probability * 100).toFixed(1)}%</p>
                      <span className={`badge text-[10px] ${item.risk_level === 'High' ? 'risk-high' : item.risk_level === 'Medium' ? 'risk-medium' : 'risk-low'}`}>
                        {item.risk_level}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><Eye size={16} /></button>
                      <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"><Download size={16} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5 bg-white/2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 text-xs disabled:opacity-30">Prev</button>
                <span className="text-xs text-gray-500 mx-2">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary py-1 text-xs disabled:opacity-30">Next</button>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-white font-bold text-sm mb-4">Detailed Insights</h3>
            {selected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-dark-600/50">
                   <p className="text-[10px] text-gray-500 uppercase font-bold">Deep Learning Conclusion</p>
                   <p className="text-xs text-gray-300 mt-2 leading-relaxed">The model predicts <strong>{selected.top_disease}</strong> with {(selected.probability * 100).toFixed(1)}% confidence.</p>
                </div>
                <button className="btn-primary w-full py-2.5 text-xs">View Full Summary</button>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-12 italic border border-dashed border-white/10 rounded-xl">Select a record</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { predictAPI } from '../api/client';

export default function FileUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Analyzing...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { 
      setFile(accepted[0]); 
      setResult(null); 
      setError(''); 
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, 
    accept: { 
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }, 
    maxFiles: 1,
  });

  const getFileIcon = () => {
    if (!file) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <div className="px-2 py-1 rounded-lg bg-red-500/20 text-red-500 font-bold text-[10px]">PDF</div>;
    if (ext === 'doc' || ext === 'docx') return <div className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-500 font-bold text-[10px]">DOC</div>;
    return <FileImage size={20} className="text-brand-400 flex-shrink-0" />;
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); 
    setError('');
    
    // Dynamic loading messages for better UX
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') setLoadingText('Converting PDF pages...');
    else setLoadingText('Running AI Vision...');

    try {
      const form = new FormData();
      form.append('file', file);
      
      // Simulate steps for better UX feel
      if (ext === 'pdf') {
        setTimeout(() => setLoadingText('Extracting text from images...'), 2000);
      }

      const res = await predictAPI.ocr(form);
      setResult(res.data);
      onResult?.(res.data);
    } catch (e) {
      const detail = e.response?.data?.detail || '';
      if (detail.includes('Tesseract')) {
        setError('Tesseract OCR engine is not installed on the server. Image-to-text conversion failed.');
      } else if (detail.includes('poppler')) {
        setError('Poppler is missing on the server. PDF conversion failed.');
      } else {
        setError(detail || 'Report processing failed. Please try a different file format.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-500
          ${isDragActive
            ? 'border-brand-500 bg-brand-500/10 shadow-glow scale-[1.02]'
            : 'border-white/5 bg-white/[0.02] hover:border-brand-500/40 hover:bg-white/[0.04] shadow-inner'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500
            ${isDragActive ? 'bg-brand-500/20 shadow-glow' : 'bg-white/5 shadow-inner'}`}>
            <Upload size={28} className={isDragActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-white uppercase tracking-tighter">
              {isDragActive ? 'Release to Scan' : 'Upload Clinical Report'}
            </p>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Image, PDF, DOCX (Max 15MB)</p>
          </div>
        </div>
      </div>

      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-3 glass-light rounded-xl border border-white/5">
            {getFileIcon()}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate font-medium">{file.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); setError(''); }} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed font-medium">{error}</p>
        </motion.div>
      )}

      <button onClick={handleUpload} disabled={!file || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{loadingText}</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>Process Report</span>
          </>
        )}
      </button>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="glass-light p-5 rounded-2xl space-y-4 border border-brand-500/20 bg-brand-500/5">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} />
              <p className="text-xs font-bold uppercase tracking-wider">{result.message}</p>
            </div>
            
            {Object.keys(result.parsed_values || {}).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.parsed_values).map(([k, v]) => (
                  <div key={k} className="bg-dark-800/80 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{k}</p>
                    <p className="text-sm font-black text-white">{v}</p>
                  </div>
                ))}
              </div>
            )}
            
            {result.extracted_text && (
              <details className="group">
                <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-300 font-bold uppercase tracking-widest list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">▶</span> View Raw Extracted Text
                </summary>
                <div className="mt-3 bg-dark-900/50 rounded-xl p-4 max-h-48 overflow-auto border border-white/5 scrollbar-thin">
                  <pre className="text-[11px] text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {result.extracted_text}
                  </pre>
                </div>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, X, CheckCircle, Loader2 } from 'lucide-react';
import { predictAPI } from '../api/client';

export default function FileUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) { setFile(accepted[0]); setResult(null); setError(''); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await predictAPI.ocr(form);
      setResult(res.data);
      onResult?.(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'OCR processing failed. Ensure Tesseract is installed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-brand-500 bg-brand-500/10 shadow-glow'
            : 'border-white/15 bg-dark-600/30 hover:border-brand-500/50 hover:bg-brand-500/5'}`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all
            ${isDragActive ? 'bg-brand-500/20' : 'bg-dark-500'}`}>
            <Upload size={24} className={isDragActive ? 'text-brand-400' : 'text-gray-500'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">
              {isDragActive ? 'Drop your medical report here' : 'Upload Medical Report'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG up to 10MB</p>
          </div>
        </div>
      </div>

      {/* File preview */}
      <AnimatePresence>
        {file && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 glass-light rounded-xl">
            <FileImage size={20} className="text-brand-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="text-gray-500 hover:text-red-400 transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}

      <button onClick={handleUpload} disabled={!file || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing...</> : <><Upload size={16} />Extract & Analyze</>}
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-light p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <p className="text-sm font-semibold text-white">{result.message}</p>
            </div>
            {Object.keys(result.parsed_values || {}).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.parsed_values).map(([k, v]) => (
                  <div key={k} className="bg-dark-700/50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">{k}</p>
                    <p className="text-sm font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
            )}
            {result.extracted_text && (
              <details>
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">View extracted text</summary>
                <pre className="text-xs text-gray-400 mt-2 whitespace-pre-wrap bg-dark-800/50 rounded-lg p-2 max-h-32 overflow-auto font-mono">
                  {result.extracted_text}
                </pre>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

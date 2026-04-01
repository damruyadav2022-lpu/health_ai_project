import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Patients from './pages/Patients';
import DiseaseExplorer from './pages/DiseaseExplorer';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#111827', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '13px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
          }}
        />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/explorer" element={<DiseaseExplorer />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

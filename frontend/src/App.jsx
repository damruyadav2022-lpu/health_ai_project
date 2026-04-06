import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages for "Run it Fast" performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Predict = lazy(() => import('./pages/Predict'));
const Scribe = lazy(() => import('./pages/Scribe'));
const Reports = lazy(() => import('./pages/Reports'));
const Patients = lazy(() => import('./pages/Patients'));
const DiseaseExplorer = lazy(() => import('./pages/DiseaseExplorer'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Optimized Loading Spinner
const NexusLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
  </div>
);

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
        <Suspense fallback={<NexusLoader />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/scribe" element={<Scribe />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/explorer" element={<DiseaseExplorer />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

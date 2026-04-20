import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatBot from './ChatBot';
import { LayoutDashboard, Activity, Users, Brain, BookOpen, ClipboardList, BarChart2, Video, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
  { path: '/doctors', label: 'Specialist Hub', icon: Stethoscope },
  { path: '/predict', label: 'AI Predict', icon: Brain },
  { path: '/scribe', label: 'Medical Scribe', icon: ClipboardList },
  { path: '/telemed', label: 'Virtual Telemed', icon: Video },
  { path: '/analytics', label: 'Clinical Analytics', icon: BarChart2 },
  { path: '/patients', label: 'Patient Records', icon: Users },
  { path: '/explorer', label: 'Disease Intelligence', icon: BookOpen },
];

export default function Layout({ children, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, ROLES } = useAuth();

  const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: ['/dashboard', '/doctors', '/predict', '/scribe', '/telemed', '/analytics', '/patients', '/explorer'],
    [ROLES.DOCTOR]: ['/dashboard', '/doctors', '/predict', '/scribe', '/telemed', '/patients', '/analytics'],
    [ROLES.PATIENT]: ['/dashboard', '/doctors', '/telemed', '/explorer']
  };

  const filteredNav = navItems.filter(item => {
    if (!user) return false;
    const allowedPaths = ROLE_PERMISSIONS[user.role] || [];
    return allowedPaths.includes(item.path);
  });


  return (
    <div className="flex h-screen overflow-hidden mesh-gradient-nexus font-inter bg-dark-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} navItems={filteredNav}>
        <div className="flex items-center gap-3 mb-10 px-2 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-purple flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
            <Activity className="text-white" size={28} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Dr.AI</h1>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Intelligence</span>
              </div>
            </motion.div>
          )}
        </div>
      </Sidebar>
      
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden bg-technical-grid">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
      
      <ChatBot />
    </div>
  );
}

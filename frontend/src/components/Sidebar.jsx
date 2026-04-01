import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, FileText, BarChart3, Users,
  Brain, Settings, LogOut, ChevronLeft, ChevronRight,
  Stethoscope, Bell, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict', icon: Brain, label: 'AI Predict' },
  { to: '/patients', icon: Users, label: 'Patients' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/explorer', icon: BookOpen, label: 'Explorer' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { window.location.reload(); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen z-30 flex flex-col overflow-hidden flex-shrink-0 relative"
      style={{ 
        background: 'linear-gradient(180deg, #0d1117 0%, #070b11 100%)', 
        borderRight: '1px solid rgba(255,255,255,0.06)',
        willChange: 'width'
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center flex-shrink-0 shadow-glow">
          <Stethoscope size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-sm font-bold text-white leading-none">HealthAI</p>
              <p className="text-xs text-gray-500">Enterprise Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : 'px-4'}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span 
                  key="label"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm truncate"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-white/5 space-y-1">
        {!collapsed && (
          <div className="px-4 py-3 rounded-xl bg-dark-600/50 mb-2">
            <p className="text-xs font-semibold text-white truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            <span className="badge bg-brand-500/20 text-brand-400 mt-1 capitalize font-bold text-[9px]">{user?.role || 'practitioner'}</span>
          </div>
        )}
        <button onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <LogOut size={17} />
          {!collapsed && <span>Reset</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-20 -right-3 w-6 h-6 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-brand-500/50 transition-all z-50 shadow-xl"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}

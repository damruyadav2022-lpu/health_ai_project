import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Activity, Users, Settings, LogOut, Brain, Search, BookOpen, 
  ChevronLeft, ChevronRight, Stethoscope, ClipboardList, TrendingUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ collapsed, setCollapsed, navItems = [], children }) {
  const { user, switchRole, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="relative flex flex-col h-screen bg-dark-900/40 backdrop-blur-3xl border-r border-white/5 z-50 transition-colors"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {children}
          
          <nav className="space-y-1.5 mt-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                    ${isActive 
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-glow' 
                      : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border border-transparent'}`}
                >
                  {isActive && (
                    <motion.div layoutId="activeNavPoint" className="absolute -left-1 w-2 h-8 bg-brand-500 rounded-r-lg shadow-glow" />
                  )}
                  <Icon size={20} className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : 'group-hover:scale-110'}`} />
                  {!collapsed && (
                    <span className="text-sm font-bold tracking-tight">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
        {/* Project Role Switcher (Matching Screenshot) */}
        {!collapsed && (
          <div className="flex items-center justify-between gap-1 p-1.5 bg-white/[0.03] rounded-2xl border border-white/5 shadow-inner">
             {[
               {id: 'admin', display: 'A'},
               {id: 'doctor', display: 'D'},
               {id: 'patient', display: 'P'}
             ].map(r => (
                <button key={r.id} onClick={() => switchRole(r.id)}
                  className={`flex-1 h-10 flex items-center justify-center text-[11px] font-black uppercase rounded-xl transition-all duration-300
                  ${user?.role === r.id 
                    ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] scale-105' 
                    : 'text-slate-600 hover:text-slate-400'}`}>
                  {r.display}
                </button>
             ))}
          </div>
        )}

        <div className={`p-4 rounded-3xl bg-white/[0.03] border border-white/5 relative group transition-all duration-300 hover:bg-white/[0.05] ${collapsed ? 'p-2 mt-4' : ''}`}>
           <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-inner group-hover:scale-105 transition-transform">
                {user?.full_name?.charAt(0)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-black text-white truncate uppercase tracking-tight mb-0.5">{user?.full_name}</p>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${user?.role === 'admin' ? 'bg-indigo-500' : user?.role === 'doctor' ? 'bg-brand-500' : 'bg-emerald-500'}`} />
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{user?.role}</p>
                   </div>
                </div>
              )}
              {!collapsed && (
                <button onClick={() => window.location.reload()} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                  <LogOut size={16} />
                </button>
              )}
           </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-24 -right-3 w-6 h-6 rounded-full bg-[#161b22] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-all z-50 shadow-xl"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}

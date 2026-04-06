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

      <div className="p-4 border-t border-white/5 space-y-4">
        {/* Role Switcher for Demo */}
        {!collapsed && (
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5">
             {['admin', 'doctor', 'patient'].map(r => (
                <button key={r} onClick={() => switchRole(r)}
                  className={`py-1 text-[8px] font-black uppercase rounded-lg transition-all
                  ${user?.role === r ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                  {r[0]}
                </button>
             ))}
          </div>
        )}

        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0">
            {user?.full_name?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter">{user?.full_name}</p>
               <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-red-500' : user?.role === 'doctor' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user?.role}</p>
               </div>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => window.location.reload()} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          )}
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

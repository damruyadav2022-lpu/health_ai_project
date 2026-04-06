import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title = 'Dashboard' }) {
  const { user } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.05] bg-dark-900/50 backdrop-blur-xl sticky top-0 z-40">
      <div>
        <motion.h1 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-white tracking-tight"
        >
          {title}
        </motion.h1>
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden lg:block group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text" placeholder="Global Search..."
            className="bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white
              placeholder-slate-600 focus:outline-none focus:border-brand-500/40 focus:bg-white/[0.05] transition-all w-64 shadow-inner" />
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/10 transition-all hover:scale-105 active:scale-95">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] border-2 border-dark-900" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{user?.username}</p>
              <p className="text-[8px] font-bold text-brand-400 uppercase tracking-widest mt-1">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-black text-sm shadow-glow group-hover:scale-105 transition-transform">
              {(user?.username?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { Bell, Search, User, Shield, Activity, X, Trash2, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';

export default function Navbar({ title = 'Dashboard' }) {
  const { user, switchRole, ROLES } = useAuth();
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.05] bg-dark-900/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-black text-white uppercase tracking-tighter"
          >
            {title}
          </motion.h1>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Real-Time Operating Mode Switcher */}
        <div className="hidden xl:flex items-center gap-3 bg-black/40 border border-white/5 p-1 rounded-2xl shadow-inner relative overflow-hidden">
           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-3 pr-2 border-r border-white/5">Operating Mode</p>
           <div className="flex gap-1 relative z-10">
              {[
                { r: ROLES.ADMIN, label: 'Admin', icon: Shield },
                { r: ROLES.DOCTOR, label: 'Doctor', icon: Activity },
                { r: ROLES.PATIENT, label: 'Patient', icon: User }
              ].map((m) => (
                <button
                   key={m.r}
                   onClick={() => switchRole(m.r)}
                   className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-500
                     ${user?.role === m.r 
                       ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' 
                       : 'text-slate-500 hover:text-slate-300'}`}
                >
                   <m.icon size={11} className={user?.role === m.r ? 'animate-pulse' : ''} />
                   {m.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden lg:block group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" placeholder="Global Neural Search..."
            className="bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40 w-64 shadow-inner" />
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-white/5 relative">
          {/* Notifications Button */}
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className={`relative w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all hover:scale-105 active:scale-95
              ${showNotif ? 'bg-brand-500/10 border-brand-500/40 text-brand-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border-2 border-dark-900" 
              />
            )}
          </button>

          {/* Holographic Notification Dropdown */}
          <AnimatePresence>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 right-0 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                     <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Clinical Neural Feed</p>
                     <button onClick={clearAll} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-3 space-y-2">
                     {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                           <CheckSquare size={32} className="text-slate-800 mx-auto mb-2" />
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Feed fully synchronized</p>
                        </div>
                     ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative group
                              ${n.read ? 'bg-black/20 border-transparent opacity-60' : 'bg-white/[0.03] border-white/5 hover:border-brand-500/30'}`}
                          >
                             {!n.read && <div className="absolute top-4 left-2 w-1 h-3 bg-brand-500 rounded-full" />}
                             <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-[11px] font-black uppercase tracking-tight ${n.type === 'critical' ? 'text-red-400' : 'text-white'}`}>{n.title}</h4>
                                <span className="text-[8px] font-bold text-slate-500">{n.time}</span>
                             </div>
                             <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{n.message}</p>
                          </div>
                        ))
                     )}
                  </div>
                  <div className="p-4 bg-white/[0.02] text-center">
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">DR. AI Real-Time Monitoring ACTIVE</p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{user?.full_name}</p>
              <p className="text-[8px] font-bold text-brand-400 uppercase tracking-widest mt-1">{user?.role?.toUpperCase()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-black text-sm shadow-glow group-hover:rotate-12 transition-transform">
              {(user?.full_name?.[0] || 'U').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

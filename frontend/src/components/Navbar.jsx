import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title = 'Dashboard' }) {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5"
      style={{ background: 'rgba(7,11,17,0.8)', backdropFilter: 'blur(12px)' }}>
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" placeholder="Search..."
            className="bg-dark-600 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-gray-300
              placeholder-gray-600 focus:outline-none focus:border-brand-500/60 w-48" />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-dark-600 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm shadow-glow">
          {(user?.username?.[0] || 'U').toUpperCase()}
        </div>
      </div>
    </header>
  );
}

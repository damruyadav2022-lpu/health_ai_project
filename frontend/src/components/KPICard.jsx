import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RISK_STYLES = {
  High:   { bg: 'from-red-500/20 to-red-500/5',   glow: 'hover:shadow-glow-red', border: 'border-red-500/20' },
  Medium: { bg: 'from-amber-500/20 to-amber-500/5', glow: '',                     border: 'border-amber-500/20' },
  Low:    { bg: 'from-green-500/20 to-green-500/5', glow: '',                     border: 'border-green-500/20' },
  Default:{ bg: 'from-brand-500/20 to-brand-500/5', glow: 'hover:shadow-glow',    border: 'border-brand-500/20' },
};

export default function KPICard({ title, value, subtitle, icon: Icon, trend, riskLevel, color, delay = 0 }) {
  const style = RISK_STYLES[riskLevel] || RISK_STYLES.Default;
  const iconColor = color || '#0ea5e9';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={`kpi-card bg-gradient-to-br ${style.bg} border ${style.border} ${style.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-white leading-none mb-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}20`, boxShadow: `0 0 16px ${iconColor}30` }}
        >
          {Icon && <Icon size={20} style={{ color: iconColor }} />}
        </div>
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-500'}`}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{trend > 0 ? '+' : ''}{trend}% vs last week</span>
        </div>
      )}

      {riskLevel && (
        <div className={`inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded-full text-xs font-semibold
          ${riskLevel === 'High' ? 'risk-high' : riskLevel === 'Medium' ? 'risk-medium' : 'risk-low'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {riskLevel} Risk
        </div>
      )}
    </motion.div>
  );
}

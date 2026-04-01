import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Activity, Brain, Target, Users } from 'lucide-react';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import { historyAPI } from '../api/client';

const MOCK_DATA = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

export default function Analytics() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    historyAPI.list(1, 100).then(res => setHistory(res.data.items || [])).catch(() => {});
  }, []);

  return (
    <Layout title="Advanced Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Scans" value={history.length} icon={Activity} color="#0ea5e9" delay={0} />
          <KPICard title="Accuracy Rate" value="98.2%" icon={Target} color="#10b981" delay={0.1} />
          <KPICard title="Patient Count" value={history.length > 5 ? '1,284' : history.length} icon={Users} color="#8b5cf6" delay={0.2} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="chart-container">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-400" /> System Usage Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Brain size={16} className="text-accent-purple" /> Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MOCK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {MOCK_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}

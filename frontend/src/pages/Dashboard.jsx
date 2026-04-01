import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Activity, Brain, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import KPICard from '../components/KPICard';
import Layout from '../components/Layout';
import { historyAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const generateTrend = () => Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  riskScore: +(Math.random() * 40 + 30).toFixed(1),
  glucose: +(Math.random() * 60 + 90).toFixed(0),
  heartRate: +(Math.random() * 30 + 65).toFixed(0),
}));

const DISEASE_COLORS = { Diabetes: '#f59e0b', 'Heart Disease': '#ef4444', 'Liver Disease': '#8b5cf6' };

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [trendData] = useState(generateTrend());
  const { user } = useAuth();

  useEffect(() => {
    historyAPI.list(1, 10).then(res => setHistory(res.data.items || [])).catch(() => {});
  }, []);

  const latestPred = history[0];
  const avgProb = history.length ? (history.reduce((a, b) => a + (b.probability || 0), 0) / history.length * 100).toFixed(1) : 0;
  const highRiskCount = history.filter(h => h.risk_level === 'High').length;

  const diseaseCounts = {};
  history.forEach(h => {
    if (h.top_disease) diseaseCounts[h.top_disease] = (diseaseCounts[h.top_disease] || 0) + 1;
  });
  const diseaseBarData = Object.entries(diseaseCounts).map(([name, count]) => ({ name, count }));

  const radialData = [
    { name: 'Risk', value: latestPred ? latestPred.probability * 100 : 30, fill: '#ef4444' },
    { name: 'Health', value: 75, fill: '#10b981' },
  ];

  return (
    <Layout title="Health Overview">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Welcome back, {user?.username} 👋</h2>
            <p className="text-sm text-gray-500 mt-0.5">You have {highRiskCount} high-risk alerts to review.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              toast.success('Analyzing demo case...');
              setTimeout(() => { window.location.href = '/predict?demo=1'; }, 400);
            }} className="btn-secondary flex items-center gap-2">
              <Zap size={15} /> Quick Demo
            </button>
            <a href="/predict" className="btn-primary flex items-center gap-2">
              <Brain size={15} /> Open Predictions
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard title="Current Risk" value={latestPred ? `${(latestPred.probability * 100).toFixed(1)}%` : 'N/A'} icon={AlertCircle} riskLevel={latestPred?.risk_level} color="#ef4444" delay={0} />
          <KPICard title="Predominant Condition" value={latestPred?.top_disease || 'None'} icon={Brain} color="#8b5cf6" delay={0.05} />
          <KPICard title="Average Risk Index" value={`${avgProb}%`} icon={TrendingUp} color="#0ea5e9" delay={0.1} />
          <KPICard title="Alerts" value={highRiskCount} icon={Activity} riskLevel={highRiskCount > 0 ? 'High' : 'Low'} color="#f59e0b" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="chart-container xl:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-brand-400" /> Biometric Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px', fontSize: 12 }} />
                <Line type="monotone" dataKey="riskScore" stroke="#ef4444" strokeWidth={2} dot={false} name="Risk Score" />
                <Line type="monotone" dataKey="glucose" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Glucose" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-white mb-4 w-full flex items-center gap-2">
              <Activity size={15} className="text-brand-400" /> Risk Gauge
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" data={radialData}>
                <RadialBar minAngle={15} dataKey="value" cornerRadius={10} />
                <Tooltip contentStyle={{ background: '#111827', border: 'none', borderRadius: '12px' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-2xl font-bold text-white mt-2">{latestPred ? (latestPred.probability * 100).toFixed(0) : 0}%</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

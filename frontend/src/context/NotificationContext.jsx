import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Neural Scan Complete', message: 'AI Diagnostic Matrix updated for Node-402.', time: '2m ago', type: 'info', read: false },
  { id: 2, title: 'Critical Protocol Alert', message: 'Patient Jane Doe vitals exceeding stability thresholds.', time: '5m ago', type: 'critical', read: false },
  { id: 3, title: 'Virtual Link Active', message: 'Dr. Sarah has joined the specialist network.', time: '12m ago', type: 'success', read: true }
];

const RANDOM_MESSAGES = [
  { title: 'Clinical Insight', message: 'Predictive algorithm detected low cardiovascular risk in Sector-A.', type: 'info' },
  { title: 'Node Update', message: 'Symphony Node-88 has successfully synchronized with the cloud.', type: 'success' },
  { title: 'Vector Alert', message: 'Biothreat Vector mapping found anomalies in regional data.', type: 'critical' },
  { title: 'Report Ready', message: 'Your AI Medical Scribe session has been finalized.', type: 'info' }
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);

  useEffect(() => {
    // Simulate real-time neural events every 30-45 seconds
    const interval = setInterval(() => {
      const msg = RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
      const newNotif = {
        id: Date.now(),
        ...msg,
        time: 'Just now',
        read: false
      };
      
      setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Keep last 10
      setUnreadCount(prev => prev + 1);
      
      // Real-time Toast Pulse
      toast(msg.title + ": " + msg.message, {
        icon: msg.type === 'critical' ? '🚨' : '🔔',
        style: {
          background: '#0d1117',
          color: '#fff',
          border: msg.type === 'critical' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

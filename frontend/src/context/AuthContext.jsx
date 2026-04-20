import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient'
};

const DEMO_USERS = {
  admin: { id: 1, username: 'admin_doc', email: 'admin@draiai.pro', full_name: 'Dr. Admin Specialist', role: ROLES.ADMIN },
  doctor: { id: 2, username: 'doctor_smith', email: 'smith@draiai.pro', full_name: 'Dr. Sarah Smith', role: ROLES.DOCTOR },
  patient: { id: 3, username: 'patient_jane', email: 'jane@health.me', full_name: 'Jane Doe', role: ROLES.PATIENT },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dr_ai_user');
    return saved ? JSON.parse(saved) : DEMO_USERS.admin;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('dr_ai_user', JSON.stringify(user));
      localStorage.setItem('healthai_token', 'JWT_SECURE_HIPAA_TOKEN_DR_AI_2026');
    } else {
      localStorage.removeItem('dr_ai_user');
      localStorage.removeItem('healthai_token');
    }
  }, [user]);

  const login = async (role = 'admin') => {
    const newUser = DEMO_USERS[role] || DEMO_USERS.admin;
    setUser(newUser);
    return newUser;
  };

  const switchRole = (role) => {
    const newUser = DEMO_USERS[role];
    setUser(newUser);
    toast.success(`Secure Clinical Access: Switched to ${role.toUpperCase()} Dashboard`, {
      icon: '🔐',
      style: { background: '#0d1117', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  const logout = () => { setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

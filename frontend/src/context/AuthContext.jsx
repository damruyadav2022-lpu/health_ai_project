import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 1,
  username: 'demouser',
  email: 'demo@healthai.local',
  full_name: 'Demo Practitioner',
  role: 'admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEMO_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Session is now permanent and demo-focused
    setLoading(false);
  }, []);

  const login = async () => {
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const register = async () => {
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const logout = () => {
    // No-op for demo mode, or could just clear memory
    console.log("Logout triggered in Demo Mode");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

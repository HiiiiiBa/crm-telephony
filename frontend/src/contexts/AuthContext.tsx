import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string; workspaceName?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('crm_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restauration de session au montage initial si un token est présent
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('crm_token');
      if (storedToken) {
        try {
          const profile = await AuthService.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session expirée ou token invalide. Déconnexion.');
          localStorage.removeItem('crm_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await AuthService.login(email, password);
    localStorage.setItem('crm_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (regData: { firstName: string; lastName: string; email: string; password: string; workspaceName?: string }) => {
    const data = await AuthService.register(regData);
    localStorage.setItem('crm_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
};

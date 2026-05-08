import { createContext, useContext, useState, type ReactNode, type FC } from 'react';

export interface User {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  avatar: string | null;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasPermission: (path: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  const isAuthenticated = !!token;

  const hasPermission = (path: string, action: string) => {
    if (!user) return false;

    const roleCode = typeof user.role === 'object' && user.role !== null 
      ? user.role.code?.toUpperCase() 
      : typeof user.role === 'string' 
        ? user.role.toUpperCase() 
        : '';

    const isAdmin = roleCode === 'ADMIN' || roleCode === 'SUPERADMIN';
    if (isAdmin) return true; // Admin có toàn quyền

    const isCollaborator = roleCode === 'COLLABORATOR';
    
    // Quyền được cấp cụ thể
    const extraPermissions = (user.permissions && Array.isArray(user.permissions)) ? user.permissions : [];
    
    // Kiểm tra quyền cụ thể: path:action hoặc path (mặc định là view)
    const exactMatch = extraPermissions.includes(`${path}:${action}`);
    const legacyMatch = action === 'view' && extraPermissions.includes(path);
    
    if (exactMatch || legacyMatch) return true;

    // Nếu không có quyền cụ thể, kiểm tra fallback theo Role (Role mặc định có full quyền trên các menu được phép)
    let defaultPaths = ['/admin', '/admin/orders'];
    if (isCollaborator) {
      defaultPaths = ['/admin', '/admin/customers', '/admin/orders', '/admin/revenue', '/admin/sales', '/admin/social/assistant'];
    }

    return defaultPaths.includes(path);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

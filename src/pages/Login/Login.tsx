import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Đã chuyển mặc định thành true
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu đã đăng nhập (còn token), tự động chuyển đến màn hình tương ứng
    if (isAuthenticated) {
      const roleCode = typeof user?.role === 'object' && user?.role !== null 
        ? user.role.code?.toUpperCase() 
        : typeof user?.role === 'string' 
          ? user.role.toUpperCase() 
          : '';
      const isStaff = ['STAFF', 'EMPLOYEE', 'NHAN_VIEN', 'NHANVIEN'].includes(roleCode);
      if (isStaff) {
        navigate('/admin/tasks/schedule', { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
      return;
    }

    // Tự động điền tài khoản & mật khẩu nếu đã chọn "Nhớ tài khoản" từ trước
    const savedUsername = localStorage.getItem('remembered_username');
    const savedPassword = localStorage.getItem('remembered_password');
    if (savedUsername) {
      setUsername(savedUsername);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const payload = response.data?.data;
      const token = payload?.accessToken;
      
      if (!token) throw new Error('Cấu trúc dữ liệu trả về không lệ (thiếu accessToken).');
      
      // Logic Nhớ tài khoản & mật khẩu
      if (rememberMe) {
        localStorage.setItem('remembered_username', username);
        localStorage.setItem('remembered_password', password);
      } else {
        localStorage.removeItem('remembered_username');
        localStorage.removeItem('remembered_password');
      }

      // Login to context and route
      login(token, payload);

      const roleCode = typeof payload?.role === 'object' && payload?.role !== null
        ? payload.role.code?.toUpperCase()
        : typeof payload?.role === 'string'
          ? payload.role.toUpperCase()
          : '';

      const isStaff = ['STAFF', 'EMPLOYEE', 'NHAN_VIEN', 'NHANVIEN'].includes(roleCode);
      if (isStaff) {
        navigate('/admin/tasks/schedule');
      } else {
        navigate('/admin');
      }

    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Gà Giống Sâm Oanh</h1>
          <p>Hệ thống Quản lý Trang trại</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Nhập tài khoản"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            <div className="remember-me" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 400 }}>
                Ghi nhớ tài khoản trên thiết bị này
              </label>
            </div>
          </div>

          <button 
            type="submit" 
              className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loader"></div>
            ) : (
              <>
                <LogIn size={20} />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

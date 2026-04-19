import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Save, Lock, Landmark, User, ShieldCheck, Mail } from 'lucide-react';
import './Settings.css';

interface UserSettingsData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  bankAccountName: string;
  bankName: string;
  bankCode: string;
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'security' | 'banking'>('security');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState<UserSettingsData>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    bankAccountName: '',
    bankName: '',
    bankCode: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/users/${user?.id}`);
      const userData = response.data?.data || response.data;
      
      setFormData({
        fullName: userData.fullName || '',
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bankAccountName: userData.bankAccountName || '',
        bankName: userData.bankName || '',
        bankCode: userData.bankCode || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('error', 'Không thể tải thông tin người dùng.');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'security') {
      if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
        showMessage('error', 'Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {};
      
      if (activeTab === 'security') {
        payload.email = formData.email;
        if (passwordData.newPassword) {
          payload.password = passwordData.newPassword;
        }
      } else if (activeTab === 'banking') {
        payload.bankName = formData.bankName;
        payload.bankAccountName = formData.bankAccountName;
        payload.bankCode = formData.bankCode;
      }

      await api.put(`/users/${user?.id}`, payload);
      showMessage('success', 'Cập nhật thông tin thành công!');
      
      if (activeTab === 'security') {
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        await fetchUserData(); // Refresh data just in case
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      showMessage('error', error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="settings-loading">
        <div className="loader-large"></div>
        <p>Đang tải cấu hình...</p>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Cài Đặt Hệ Thống</h2>
          <p>Quản lý tài khoản cá nhân và cấu hình bảo mật</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Sidebar */}
        <div className="settings-sidebar">
          <div className="user-profile-summary">
            <div className="avatar-lg">
              {formData.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h3>{formData.fullName || formData.username}</h3>
            </div>
          </div>
          
          <nav className="settings-nav">
            <button 
              className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <ShieldCheck size={18} />
              Tài khoản & Mật khẩu
            </button>
            <button 
              className={`nav-btn ${activeTab === 'banking' ? 'active' : ''}`}
              onClick={() => setActiveTab('banking')}
            >
              <Landmark size={18} />
              Thông tin Ngân hàng
            </button>
          </nav>
        </div>

        {/* Right Content */}
        <div className="settings-content-area">
          <div className="settings-card">
            <div className="card-header">
              <h3>
                {activeTab === 'security' ? 'Tài khoản & Mật Khẩu' : 'Cập nhật Ngân Hàng'}
              </h3>
            </div>

            {message.text && (
              <div className={`alert-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="settings-form">
              {activeTab === 'security' && (
                <div className="form-section">
                  <div className="form-group">
                    <label>Tài khoản sử dụng</label>
                    <div className="input-with-icon readonly">
                      <User size={18} />
                      <input type="text" value={formData.username} disabled />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input 
                        type="email" 
                        name="email"
                        placeholder="Nhập email..."
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Mật khẩu mới</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input 
                        type="password" 
                        name="newPassword"
                        placeholder="Nhập mật khẩu mới (bỏ trống nếu không đổi)"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Xác nhận mật khẩu</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input 
                        type="password" 
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu mới"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'banking' && (
                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tên Ngân hàng</label>
                      <input 
                        type="text" 
                        name="bankName"
                        placeholder="VD: Vietcombank, Techcombank..."
                        value={formData.bankName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Số Tài khoản</label>
                      <input 
                        type="text" 
                        name="bankCode"
                        placeholder="VD: 10123456789"
                        value={formData.bankCode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Chủ Tài khoản</label>
                    <input 
                      type="text" 
                      name="bankAccountName"
                      placeholder="VD: NGUYEN VAN A"
                      value={formData.bankAccountName}
                      onChange={handleInputChange}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <small className="help-text">Tên chủ thẻ nên viết hoa không dấu để khớp thông tin chuyển khoản.</small>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? <div className="loader-small" /> : <Save size={18} />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

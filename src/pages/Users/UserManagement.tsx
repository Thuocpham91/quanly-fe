import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Search, User as UserIcon, MapPin } from 'lucide-react';
import api from '../../api/axios';
import './UserManagement.css';

interface RoleData {
  id: string;
  name: string;
  code: string;
}

interface UserData {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string | null;
  roleId: string;
  role?: RoleData;
  status: string;
  lat: number | null;
  lng: number | null;
  percentage?: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
    lat: '' as string | number,
    lng: '' as string | number,
    percentage: '' as string | number
  });

  // Fetch users and roles
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    
    // Tải Users
    try {
      const usersResponse = await api.get('/users');
      console.log('Users API Response:', usersResponse.data);
      
      const responseData = usersResponse.data;
      if (responseData && Array.isArray(responseData.data)) {
        setUsers(responseData.data);
      } else if (Array.isArray(responseData)) {
        setUsers(responseData);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách User:', err);
      setError('Không thể tải danh sách người dùng.');
    }

    // Tải Roles (Độc lập, lỗi không ảnh hưởng đến hiển thị User)
    try {
      const rolesResponse = await api.get('/roles');
      const roleData = rolesResponse.data;
      if (roleData && Array.isArray(roleData.data)) {
        setRoles(roleData.data);
      } else if (Array.isArray(roleData)) {
          setRoles(roleData);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách Role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      lat: '',
      lng: '',
      percentage: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Password stays empty unless changing
      roleId: user.roleId || '',
      lat: user.lat ?? '',
      lng: user.lng ?? '',
      percentage: user.percentage ?? ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username || (!editingUser && !formData.password)) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingUser) {
        // Update user
        const payload: any = {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email || undefined,
          phone: formData.phone,
          roleId: formData.roleId,
          lat: formData.lat !== '' ? Number(formData.lat) : null,
          lng: formData.lng !== '' ? Number(formData.lng) : null,
          percentage: formData.percentage !== '' ? Number(formData.percentage) : null
        };
        if (formData.password) payload.password = formData.password;

        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        // Create user
        const payload = {
            ...formData,
            email: formData.email || undefined,
            lat: formData.lat !== '' ? Number(formData.lat) : null,
            lng: formData.lng !== '' ? Number(formData.lng) : null,
            percentage: formData.percentage !== '' ? Number(formData.percentage) : null,
            status: 'ACTIVE'
        };
        await api.post('/users', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Lỗi khi lưu user:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;

    try {
      await api.delete(`/users/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Có lỗi xảy ra khi xóa người dùng.');
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error("Lỗi lấy vị trí:", error);
          alert("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.");
        }
      );
    }
  };

  const handleOpenMap = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) {
      alert('Người dùng này chưa có dữ liệu vị trí.');
      return;
    }
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    if (isMobile) {
      // Trên điện thoại, chuyển hướng trực tiếp thường kích hoạt App tốt hơn
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="user-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý User</h2>
          <p>Hệ thống quản lý Nhân viên & Khách hàng hợp nhất</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm User Mới</span>
        </button>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Hành động</th>
                  <th>Người dùng</th>
                  <th>Liên hệ</th>
                  <th>Vai trò</th>
                  <th>% Doanh thu</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ 
                                padding: '0.4rem', 
                                borderRadius: '6px', 
                                backgroundColor: user.lat && user.lng ? '#eff6ff' : '#f3f4f6',
                                color: user.lat && user.lng ? '#2563eb' : '#94a3b8'
                            }}
                            title="Chỉ đường"
                            onClick={() => handleOpenMap(user.lat, user.lng)}
                          >
                            <MapPin size={16} />
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(user)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            title="Xóa"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserIcon size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.fullName || user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>{user.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.phone || '-'}</div>
                      </td>
                      <td>
                        <span className="role-badge">
                          {user.role?.name || user.roleId || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#059669' }}>
                          {user.percentage != null ? `${user.percentage}%` : '0%'}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 500, 
                          color: user.status === 'ACTIVE' ? '#059669' : '#d97706' 
                        }}>
                          {user.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Cập Nhật Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
                
                <div className="form-group-modal">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ tên đầy đủ..."
                  />
                </div>

                <div className="form-row">
                    <div className="form-group-modal">
                        <label>Username *</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Tên đăng nhập"
                            required
                        />
                    </div>
                    <div className="form-group-modal">
                        <label>Vai trò *</label>
                        <select name="roleId" value={formData.roleId} onChange={handleInputChange} required>
                            <option value="">Chọn vai trò</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="form-group-modal">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@mail.com"
                  />
                </div>

                <div className="form-group-modal">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0123..."
                  />
                </div>

                <div className="form-group-modal">
                  <label>{editingUser ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu *'}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required={!editingUser}
                  />
                </div>

                <div className="form-group-modal">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ marginBottom: 0 }}>Vị trí (Latitude & Longitude)</label>
                        <button 
                            type="button" 
                            onClick={handleGetLocation}
                            style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Search size={12} />
                            Lấy vị trí hiện tại
                        </button>
                    </div>
                    <div className="form-row">
                        <div>
                            <input
                                type="number"
                                name="lat"
                                value={formData.lat}
                                onChange={handleInputChange}
                                placeholder="Latitude (VD: 21.0285)"
                                step="any"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                name="lng"
                                value={formData.lng}
                                onChange={handleInputChange}
                                placeholder="Longitude (VD: 105.8542)"
                                step="any"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group-modal">
                  <label>Tỷ lệ Doanh thu / Hoa hồng (%)</label>
                  <input
                    type="number"
                    name="percentage"
                    value={formData.percentage}
                    onChange={handleInputChange}
                    placeholder="VD: 15"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Hệ số để nhân với doanh thu đơn hàng</small>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader-small" /> : 'Lưu Dữ Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

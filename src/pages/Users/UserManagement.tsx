import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Search, User as UserIcon, MapPin, List, Map as MapIcon, Filter, Key } from 'lucide-react';
import api from '../../api/axios';
import { allNavItems } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import './UserManagement.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  permissions?: string[];
}

const UserManagement: React.FC = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [error, setError] = useState('');

  // Password change modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
    lat: '' as string | number,
    lng: '' as string | number,
    percentage: '' as string | number,
    permissions: [] as string[]
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
      percentage: '',
      permissions: []
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
      percentage: user.percentage ?? '',
      permissions: user.permissions || []
    });
    setError('');
    setIsModalOpen(true);
  };

  const openChangePasswordModal = (user: UserData) => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp!');
      return;
    }

    try {
      setIsSavingPassword(true);
      await api.put(`/users/${passwordUser?.id}`, {
        password: newPassword
      });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu user:', err);
      setPasswordError(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsSavingPassword(false);
    }
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
          percentage: formData.percentage !== '' ? Number(formData.percentage) : null,
          permissions: formData.permissions
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
            status: 'ACTIVE',
            permissions: formData.permissions
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
  
  // Filtering logic
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const fullNameLower = (user.fullName || '').toLowerCase();
    const usernameLower = (user.username || '').toLowerCase();
    const phone = user.phone || '';

    const matchesSearch = fullNameLower.includes(searchLower) || 
                          usernameLower.includes(searchLower) ||
                          phone.includes(searchTerm);
    
    const matchesRole = !selectedRole || user.roleId === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="view-mode-toggle">
            <button 
              className={viewMode === 'table' ? 'active' : ''} 
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng"
            >
              <List size={18} />
            </button>
            <button 
              className={viewMode === 'map' ? 'active' : ''} 
              onClick={() => setViewMode('map')}
              title="Xem trên bản đồ"
            >
              <MapIcon size={18} />
            </button>
          </div>
          {hasPermission('/admin/users', 'add') && (
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              <span>Thêm User Mới</span>
            </button>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, username, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <X size={16} className="clear-search" onClick={() => setSearchTerm('')} />}
        </div>
        
        <div className="filter-group">
          <div className="filter-item">
            <Filter size={16} />
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">Tất cả Vai trò</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-item">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">Tất cả Trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm khóa</option>
            </select>
          </div>
        </div>
        
        <div className="filter-stats">
            Tìm thấy: <strong>{filteredUsers.length}</strong> / {users.length} user
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : viewMode === 'table' ? (
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
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
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
                          {hasPermission('/admin/users', 'edit') && (
                            <>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem', borderRadius: '6px' }}
                                title="Chỉnh sửa"
                                onClick={() => openEditModal(user)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ 
                                  padding: '0.4rem', 
                                  borderRadius: '6px',
                                  backgroundColor: '#fff7ed',
                                  color: '#ea580c',
                                  borderColor: '#fed7aa'
                                }}
                                title="Đổi mật khẩu"
                                onClick={() => openChangePasswordModal(user)}
                              >
                                <Key size={16} />
                              </button>
                            </>
                          )}
                          {hasPermission('/admin/users', 'delete') && (
                            <button 
                              className="btn-danger" 
                              style={{ padding: '0.4rem', borderRadius: '6px' }}
                              title="Xóa"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {user.phone ? (
                            <a href={`tel:${user.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                              {user.phone}
                            </a>
                          ) : '-'}
                        </div>
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
                    <td colSpan={6} className="empty-state">
                      Không tìm thấy người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="map-view-wrapper">
             <MapContainer 
               center={[21.0285, 105.8542]} 
               zoom={6} 
               style={{ height: '600px', width: '100%', borderRadius: '12px' }}
             >
               <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               />
               {filteredUsers.filter(u => u.lat && u.lng).map(user => (
                 <Marker key={user.id} position={[user.lat!, user.lng!]}>
                   <Popup>
                     <div style={{ minWidth: '150px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{user.fullName || user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>@{user.username} - {user.role?.name}</div>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                           <MapPin size={12} />
                           <span>{user.lat?.toFixed(4)}, {user.lng?.toFixed(4)}</span>
                        </div>
                        {user.phone && (
                          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                            📞 {user.phone}
                          </div>
                        )}
                        <button 
                          className="btn-primary" 
                          style={{ width: '100%', padding: '0.4rem', marginTop: '10px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenMap(user.lat, user.lng)}
                        >
                          Chỉ đường (Maps)
                        </button>
                     </div>
                   </Popup>
                 </Marker>
               ))}
             </MapContainer>
             <div className="map-legend">
                Hiển thị <strong>{filteredUsers.filter(u => u.lat && u.lng).length}</strong> vị trí người dùng trên bản đồ
             </div>
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

                <div className="form-group-modal" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'block' }}>Quyền truy cập và thao tác Menu</label>
                  <div className="permissions-table-container">
                    <table className="permissions-table">
                      <thead>
                        <tr>
                          <th>Menu</th>
                          <th>Xem (View)</th>
                          <th>Thêm (Add)</th>
                          <th>Sửa (Edit)</th>
                          <th>Xóa (Delete)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allNavItems.map(item => {
                          const availableActions = item.availableActions || ['view'];
                          const hasAction = (action: string) => formData.permissions.includes(`${item.path}:${action}`) || (action === 'view' && formData.permissions.includes(item.path));
                          
                          const handleActionToggle = (action: string, checked: boolean) => {
                            setFormData(prev => {
                              let newPerms = [...prev.permissions];
                              const exactPerm = `${item.path}:${action}`;
                              
                              if (checked) {
                                if (!newPerms.includes(exactPerm)) newPerms.push(exactPerm);
                                // Tự động check View nếu check Add/Edit/Delete
                                if (action !== 'view') {
                                  const viewPerm = `${item.path}:view`;
                                  if (!newPerms.includes(viewPerm) && !newPerms.includes(item.path)) {
                                    newPerms.push(viewPerm);
                                  }
                                }
                                // Dọn dẹp legacy path nếu add explicit view
                                if (action === 'view') {
                                    newPerms = newPerms.filter(p => p !== item.path);
                                }
                              } else {
                                newPerms = newPerms.filter(p => p !== exactPerm);
                                if (action === 'view') {
                                  // Nếu uncheck View, uncheck luôn các quyền con
                                  newPerms = newPerms.filter(p => p !== item.path && !p.startsWith(`${item.path}:`));
                                }
                              }
                              return { ...prev, permissions: newPerms };
                            });
                          };

                          return (
                            <tr key={item.path}>
                              <td>
                                <div className="permission-menu-label">
                                  <item.icon size={16} />
                                  <span>{item.label}</span>
                                </div>
                              </td>
                              <td>
                                {availableActions.includes('view') && (
                                  <input 
                                    type="checkbox" 
                                    checked={hasAction('view')}
                                    onChange={(e) => handleActionToggle('view', e.target.checked)}
                                  />
                                )}
                              </td>
                              <td>
                                {availableActions.includes('add') && (
                                  <input 
                                    type="checkbox" 
                                    checked={hasAction('add')}
                                    onChange={(e) => handleActionToggle('add', e.target.checked)}
                                    disabled={!hasAction('view')}
                                  />
                                )}
                              </td>
                              <td>
                                {availableActions.includes('edit') && (
                                  <input 
                                    type="checkbox" 
                                    checked={hasAction('edit')}
                                    onChange={(e) => handleActionToggle('edit', e.target.checked)}
                                    disabled={!hasAction('view')}
                                  />
                                )}
                              </td>
                              <td>
                                {availableActions.includes('delete') && (
                                  <input 
                                    type="checkbox" 
                                    checked={hasAction('delete')}
                                    onChange={(e) => handleActionToggle('delete', e.target.checked)}
                                    disabled={!hasAction('view')}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <small style={{ color: '#64748b', marginTop: '8px', display: 'block' }}>Nếu không chọn quyền nào, hệ thống sẽ sử dụng quyền mặc định theo Vai trò (Thường là Full quyền trên các menu được phép).</small>
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

      {/* Modal Đổi mật khẩu */}
      {isPasswordModalOpen && passwordUser && (
        <div className="modal-overlay" onClick={() => !isSavingPassword && setIsPasswordModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi Mật Khẩu</h3>
              <button className="close-btn" onClick={() => setIsPasswordModalOpen(false)} disabled={isSavingPassword}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Tài khoản:</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{passwordUser.fullName || passwordUser.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>@{passwordUser.username}</div>
                </div>

                {passwordError && <div style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: '1rem' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: '#059669', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 500 }}>{passwordSuccess}</div>}
                
                <div className="form-group-modal">
                  <label>Mật khẩu mới *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                    required
                    disabled={isSavingPassword}
                    autoFocus
                  />
                </div>

                <div className="form-group-modal">
                  <label>Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                    disabled={isSavingPassword}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)} disabled={isSavingPassword}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingPassword}>
                  {isSavingPassword ? <div className="loader-small" /> : 'Cập Nhật Mật Khẩu'}
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

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  UserSquare2, 
  Box, 
  CheckSquare, 
  LogOut,
  Menu,
  X,
  ShoppingBag,
  ListTodo,
  Truck,
  Settings,
  DollarSign,
  Target,
  BarChart2,
  CreditCard,
  TrendingUp,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { allNavItems } from '../../utils/navigation';
import PWAInstallPrompt from '../../components/PWAInstallPrompt/PWAInstallPrompt';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Logic phân quyền Menu ──
  const roleCode = typeof user?.role === 'object' && user?.role !== null 
    ? user.role.code?.toUpperCase() 
    : typeof user?.role === 'string' 
      ? user.role.toUpperCase() 
      : '';

  const isAdmin = roleCode === 'ADMIN' || roleCode === 'SUPERADMIN';
  const isCollaborator = roleCode === 'COLLABORATOR';
  const isStaff = ['STAFF', 'EMPLOYEE', 'MANAGER', 'NHAN_VIEN', 'NHANVIEN'].includes(roleCode);

  let visibleNavItems = [];

  if (isAdmin) {
    // Admin mặc định thấy tất cả
    visibleNavItems = [...allNavItems];
  } else {
    // Lấy các path mặc định dựa trên Role
    let defaultPaths = ['/admin', '/admin/orders']; // User thường
    if (isCollaborator) {
      defaultPaths = ['/admin', '/admin/customers', '/admin/orders', '/admin/revenue', '/admin/sales', '/admin/social/assistant'];
    } else if (isStaff) {
      defaultPaths = ['/admin', '/admin/tasks/schedule', '/admin/works', '/admin/orders', '/admin/orders/schedule', '/admin/objects', '/admin/customers'];
    }

    // Kết hợp với các quyền được cấp riêng (nếu có). Chỉ lấy phần path (trước dấu :)
    const extraPermissions = (user?.permissions && Array.isArray(user.permissions)) 
      ? user.permissions.map(p => p.split(':')[0]) 
      : [];
    const allAllowedPaths = [...new Set([...defaultPaths, ...extraPermissions])];

    visibleNavItems = allNavItems.filter(item => allAllowedPaths.includes(item.path));
  }

  // Override label cho khách hàng
  visibleNavItems = visibleNavItems.map(item => {
    if (item.path === '/admin/orders' && ['USER', 'CUSTOMER'].includes((user?.role as any)?.code?.toUpperCase() || '')) {
      return { ...item, label: 'Lịch sử Đơn hàng' };
    }
    return item;
  });


  return (
    <div className="layout-container">
      {/* Mobile Backdrop overlay */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-text">Gà Giống Sâm Oanh</div>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-menu">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)} // mobile auto close
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          
          <div className="page-title desktop-only">Gà Giống Sâm Oanh</div>
          
          <div className="user-profile" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.fullName || user?.username || 'Admin'}</span>
            </div>

            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <button onClick={() => { setIsProfileMenuOpen(false); navigate('/settings'); }}>
                  <Settings size={16} />
                  <span>Cài đặt</span>
                </button>
                <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>
                <button onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="content-area">
          <Outlet />
        </section>
      </main>

      {/* PWA Add to Home Screen Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default MainLayout;

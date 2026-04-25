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
  BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

  const allNavItems = [
    { path: '/admin', label: 'Trang chủ', icon: Home },
    { path: '/admin/users', label: 'Quản lý User', icon: Users },
    { path: '/admin/customers', label: 'Quản lý Khách hàng', icon: UserSquare2 },
    { path: '/admin/objects', label: 'Quản Object', icon: Box },
    { path: '/admin/works', label: 'Quản lý Công việc', icon: CheckSquare },
    { path: '/admin/tasks/schedule', label: 'Lịch trình công việc', icon: ListTodo },
    { path: '/admin/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag },
    { path: '/admin/orders/schedule', label: 'Lịch trình giao hàng', icon: Truck },
    { path: '/admin/revenue', label: 'Quản lý Doanh thu', icon: DollarSign },
    { path: '/admin/milestones', label: 'Cài đặt Mốc Thưởng', icon: Target },
    { path: '/admin/chicken-prices', label: 'Giá Gà Hôm Nay', icon: BarChart2 },
  ];


  // Backend trả về role là một Object chứa { code: 'USER', name: 'User' }
  const roleCode = typeof user?.role === 'object' && user?.role !== null 
    ? user.role.code?.toUpperCase() 
    : typeof user?.role === 'string' 
      ? user.role.toUpperCase() 
      : '';

  const isCustomer = ['USER', 'CUSTOMER'].includes(roleCode || '');
  const isCollaborator = roleCode === 'COLLABORATOR';

  let visibleNavItems = allNavItems;
  if (isCustomer) {
    visibleNavItems = allNavItems.filter(item => ['/admin', '/admin/orders'].includes(item.path)).map(item => 
      item.path === '/admin/orders' ? { ...item, label: 'Lịch sử Đơn hàng' } : item
    );
  } else if (isCollaborator) {
    visibleNavItems = allNavItems.filter(item => ['/admin', '/admin/customers', '/admin/orders', '/admin/revenue'].includes(item.path));
  }


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
    </div>
  );
};

export default MainLayout;

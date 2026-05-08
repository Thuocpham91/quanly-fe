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
  let visibleNavItems = allNavItems;

  // Nếu user có permissions cụ thể, ưu tiên sử dụng permissions đó
  if (user?.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    visibleNavItems = allNavItems.filter(item => user.permissions.includes(item.path));
  } else {
    // Fallback: Logic phân quyền dựa trên Role (như cũ)
    const roleCode = typeof user?.role === 'object' && user?.role !== null 
      ? user.role.code?.toUpperCase() 
      : typeof user?.role === 'string' 
        ? user.role.toUpperCase() 
        : '';

    const isCustomer = ['USER', 'CUSTOMER'].includes(roleCode || '');
    const isCollaborator = roleCode === 'COLLABORATOR';

    if (isCustomer) {
      visibleNavItems = allNavItems.filter(item => ['/admin', '/admin/orders'].includes(item.path));
    } else if (isCollaborator) {
      visibleNavItems = allNavItems.filter(item => ['/admin', '/admin/customers', '/admin/orders', '/admin/revenue', '/admin/sales', '/admin/social/assistant'].includes(item.path));
    }
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
    </div>
  );
};

export default MainLayout;

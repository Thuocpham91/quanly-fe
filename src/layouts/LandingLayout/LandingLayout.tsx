import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, MessageCircle, Mail, Phone, MapPin, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LandingLayout.css';
import ChatConsultant from '../../components/ChatConsultant/ChatConsultant';
import PWAInstallPrompt from '../../components/PWAInstallPrompt/PWAInstallPrompt';

const LandingLayout: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check if app is not running in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setShowInstallBtn(!isStandalone);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, user, navigate]);

  const handleTriggerInstall = () => {
    window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
  };

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Sản phẩm', path: '/#products' },
    { label: 'Giới thiệu', path: '/#about' },
    { label: 'Liên hệ', path: '/#contact' },
  ];

  return (
    <div className="landing-layout">
      {/* Navbar */}
      <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-container">
          <Link to="/" className="landing-logo">
            <span className="logo-icon">🐔</span>
            <span className="logo-text">Gà Giống Sâm Oanh</span>
          </Link>

          {/* Desktop Nav */}
          <div className="landing-nav-desktop">
            {navLinks.map((link) => (
              <a key={link.label} href={link.path} className="nav-link">
                {link.label}
              </a>
            ))}
            {showInstallBtn && (
              <button className="install-app-btn" onClick={handleTriggerInstall}>
                <Download size={16} /> Cài đặt App
              </button>
            )}
            <button className="login-btn" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>

          {/* Mobile Actions (Install & Menu Toggle) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {showInstallBtn && (
              <button className="mobile-header-install-btn" onClick={handleTriggerInstall} aria-label="Cài đặt ứng dụng">
                <Download size={22} />
              </button>
            )}
            
            <button 
              className="mobile-toggle" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className={`landing-nav-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.path} 
              className="mobile-nav-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {showInstallBtn && (
            <button 
              className="mobile-install-btn" 
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleTriggerInstall();
              }}
            >
              <Download size={18} style={{ marginRight: '6px' }} />
              Cài đặt Ứng dụng
            </button>
          )}
          <button 
            className="mobile-login-btn" 
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate('/login');
            }}
          >
            Đăng nhập
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="landing-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-info">
              <Link to="/" className="landing-logo footer-logo">
                <span className="logo-icon">🐔</span>
                <span className="logo-text">Gà Giống Sâm Oanh</span>
              </Link>
              <p className="footer-desc">
                Chuyên cung cấp các loại gà giống chất lượng cao, thuần chủng, 
                đảm bảo sức khỏe và tốc độ tăng trưởng tốt nhất cho trang trại của bạn.
              </p>
              <div className="social-links">
                <a href="#"><MessageCircle size={20} /></a>
                <a href="#"><Mail size={20} /></a>
                <a href="#"><Phone size={20} /></a>
              </div>
            </div>

            <div className="footer-links">
              <h4>Liên kết nhanh</h4>
              <ul>
                <li><Link to="/">Trang chủ</Link></li>
                <li><a href="#products">Sản phẩm</a></li>
                <li><a href="#about">Giới thiệu</a></li>
                <li><a href="#contact">Liên hệ</a></li>
              </ul>
            </div>

            <div className="footer-contact" id="contact">
              <h4>Thông tin liên hệ</h4>
              <div className="contact-item">
                <MapPin size={18} />
                <span>Tam Dương, Vĩnh Phúc, Phú Thọ</span>
              </div>
              <div className="contact-item">
                <Phone size={18} />
                <a href="tel:0974095244" style={{ color: 'inherit', textDecoration: 'none' }}>0974095244</a>
                <span> - </span>
                <a href="tel:0979833621" style={{ color: 'inherit', textDecoration: 'none' }}>0979833621</a>
              </div>
              <div className="contact-item">
                <Mail size={18} />
                <span>phamvuthuoc91@gmail.com</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Gà Giống Sâm Oanh. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Consultant */}
      <ChatConsultant />

      {/* PWA Add to Home Screen Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default LandingLayout;

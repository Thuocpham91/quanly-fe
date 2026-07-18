import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare, Smartphone } from 'lucide-react';
import './PWAInstallPrompt.css';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [platform, setPlatform] = useState<{ isIOS: boolean; isAndroid: boolean; isSafari: boolean }>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
  });

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Detect platform
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    setPlatform({ isIOS, isAndroid, isSafari });

    // 3. Check dismiss cooldown (e.g., hide prompt for 3 days if dismissed)
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    const cooldownDays = 3;
    if (dismissedTime) {
      const diffTime = Math.abs(new Date().getTime() - parseInt(dismissedTime, 10));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= cooldownDays) {
        return;
      }
    }

    // 4. Capture beforeinstallprompt for Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. For iOS, we automatically show the prompt after a slight delay
    // because iOS Safari doesn't fire beforeinstallprompt.
    if (isIOS) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // delay to let page load first
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (platform.isIOS) {
      // Show iOS step-by-step modal guide
      setShowPrompt(false);
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      // Trigger the browser's PWA install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Fallback for cases where deferredPrompt is not captured yet or browser lacks API
      setShowPrompt(false);
      setShowIOSGuide(true); // fall back to manual instructions
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().getTime().toString());
  };

  const handleCloseGuide = () => {
    setShowIOSGuide(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().getTime().toString());
  };

  if (!showPrompt && !showIOSGuide) {
    return null;
  }

  return (
    <>
      {/* Dynamic Install Banner (Slide-up toast) */}
      {showPrompt && (
        <div className="pwa-install-banner animate-slide-up">
          <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Đóng">
            <X size={18} />
          </button>
          
          <div className="pwa-banner-content">
            <div className="pwa-app-icon">
              <span className="pwa-icon-emoji">🐔</span>
            </div>
            <div className="pwa-text-content">
              <h4 className="pwa-title">Cài đặt Gà Giống Sâm Oanh</h4>
              <p className="pwa-subtitle">Thêm ứng dụng vào màn hình chính để truy cập cực nhanh, mượt mà và nhận thông tin mới nhất.</p>
            </div>
          </div>

          <div className="pwa-actions">
            <button className="pwa-btn-dismiss" onClick={handleDismiss}>
              Để sau
            </button>
            <button className="pwa-btn-install" onClick={handleInstallClick}>
              <Download size={16} style={{ marginRight: '6px' }} />
              Cài đặt
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari step-by-step instruction Modal */}
      {showIOSGuide && (
        <div className="pwa-modal-overlay fade-in" onClick={handleCloseGuide}>
          <div className="pwa-modal-card slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div className="pwa-modal-title-wrapper">
                <Smartphone size={24} className="pwa-phone-icon" />
                <h3>Thêm vào Màn hình chính</h3>
              </div>
              <button className="pwa-modal-close" onClick={handleCloseGuide} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="pwa-modal-body">
              <p className="pwa-guide-intro">
                Thực hiện các bước sau trên trình duyệt Safari của iPhone/iPad để cài đặt ứng dụng:
              </p>

              <div className="pwa-step-list">
                <div className="pwa-step-item">
                  <div className="pwa-step-number">1</div>
                  <div className="pwa-step-desc">
                    Nhấp vào nút <strong>Chia sẻ (Share)</strong> trên thanh công cụ của Safari ở phía dưới (hoặc phía trên cùng trên iPad).
                    <div className="pwa-step-helper-icon">
                      <Share size={20} className="safari-share-icon" />
                      <span>Biểu tượng hộp vuông có mũi tên chỉ lên</span>
                    </div>
                  </div>
                </div>

                <div className="pwa-step-item">
                  <div className="pwa-step-number">2</div>
                  <div className="pwa-step-desc">
                    Cuộn xuống danh sách tùy chọn và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
                    <div className="pwa-step-helper-icon">
                      <PlusSquare size={20} className="safari-add-icon" />
                      <span>Biểu tượng dấu cộng (+)</span>
                    </div>
                  </div>
                </div>

                <div className="pwa-step-item">
                  <div className="pwa-step-number">3</div>
                  <div className="pwa-step-desc">
                    Nhấp vào nút <strong>Thêm (Add)</strong> ở góc bên phải màn hình để hoàn tất cài đặt ứng dụng.
                  </div>
                </div>
              </div>
            </div>

            <div className="pwa-modal-footer">
              <button className="pwa-modal-btn-confirm" onClick={handleCloseGuide}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;

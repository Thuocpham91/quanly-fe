import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  User as UserIcon, 
  Clock, 
  Package,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Navigation,
  Search,
  Phone,
  QrCode,
  Copy,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './OrderSchedule.css';

interface Order {
  id: string;
  userId: string;
  user?: { username: string; fullName: string; phone?: string; lat?: number; lng?: number };
  quantity: number;
  type: string;
  status: string;
  orderDate?: string;
  exportDate?: string;
  work?: { title: string };
  unitPrice?: number;
  amount?: number;
  deliveryStaffId?: string;
  deliveryStaff?: { username: string; fullName: string };
}


interface ScheduleData {
  current: {
    date: string;
    orders: Order[];
  };
  next: {
    date: string | null;
    orders: Order[];
  };
  prevDate: string | null;
}

const OrderSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [qrConfigs, setQrConfigs] = useState<any[]>([]);
  const [currentQrIndex, setCurrentQrIndex] = useState<number>(0);
  const [qrModalOrder, setQrModalOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQrConfigs = async () => {
      try {
        const res = await api.get('/qr-configs');
        if (res.data && Array.isArray(res.data.data)) {
          setQrConfigs(res.data.data);
          const activeIndex = res.data.data.findIndex((c: any) => c.isActive);
          setCurrentQrIndex(activeIndex !== -1 ? activeIndex : 0);
        }
      } catch (err) {
        console.error('Error fetching QR configs:', err);
      }
    };
    fetchQrConfigs();
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/orders/schedule', {
        params: { date: formatDate(selectedDate) }
      });
      if (res.data && res.data.data) {
        setSchedule(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching order schedule:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleDateChange = (days: number) => {
    if (!schedule) return;

    if (days > 0 && schedule.next.date) {
      // Jump to next available date
      setSelectedDate(new Date(schedule.next.date));
    } else if (days < 0 && schedule.prevDate) {
      // Jump to previous available date
      setSelectedDate(new Date(schedule.prevDate));
    } else {
      // Standard +/- 1 day fallback
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      setSelectedDate(newDate);
    }
  };

  const setToday = () => {
    setSelectedDate(new Date());
  };

  const handleCall = async (e: React.MouseEvent, phone: string, userId: string, name: string) => {
    e.stopPropagation();
    if (!phone) return;

    try {
      // Find customer by user ID to get customerId
      const res = await api.get(`/customers/user/${userId}`);
      if (res.data && res.data.data) {
        await api.post('/call-histories', {
          customerId: res.data.data.id,
          note: `Cuộc gọi từ Lịch trình giao hàng: ${name}`
        });
      }
    } catch (error) {
      console.error('Error logging call history:', error);
    } finally {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleCustomerClick = async (userId: string) => {
    try {
      // Find customer by user ID
      const res = await api.get(`/customers/user/${userId}`);
      if (res.data && res.data.data) {
        navigate(`/admin/customers/${res.data.data.id}`);
      } else {
        alert('Không tìm thấy thông tin khách hàng chi tiết cho người dùng này.');
      }
    } catch (err) {
      console.error('Error finding customer:', err);
      alert('Có lỗi xảy ra khi tìm kiếm thông tin khách hàng.');
    }
  };

  const handleUpdateUserLocation = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (!userId) return;

    const confirmed = window.confirm('Bạn có chắc chắn muốn cập nhật vị trí hiện tại cho khách hàng này không?');
    if (!confirmed) return;
    
    if ("geolocation" in navigator) {
      setUpdatingUserId(userId);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.put(`/users/${userId}`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            alert('Cập nhật vị trí khách hàng thành công!');
            fetchSchedule(); // Refresh data to show new MapPin
          } catch (error) {
            console.error('Lỗi khi cập nhật vị trí user:', error);
            alert('Có lỗi xảy ra khi lưu vị trí.');
          } finally {
            setUpdatingUserId(null);
          }
        },
        (error) => {
          console.error("Lỗi lấy vị trí:", error);
          alert("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.");
          setUpdatingUserId(null);
        }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
    }
  };
  
  const handleStatusUpdate = async (e: React.ChangeEvent<HTMLSelectElement> | React.MouseEvent, orderId: string, newStatus: string) => {
    if (e) e.stopPropagation();
    if (!orderId || !newStatus) return;

    try {
      setUpdatingOrderId(orderId);
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchSchedule(); // Refresh data
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DA_DUYET':
        return <span className="status-dot success" title="Đã duyệt"><CheckCircle2 size={12} /></span>;
      case 'DA_HOAN_THANH':
        return <span className="status-dot completed" title="Đã hoàn thành"><CheckCircle2 size={12} /></span>;
      case 'TU_CHOI':
        return <span className="status-dot danger" title="Từ chối"><AlertCircle size={12} /></span>;
      case 'HUY_DON':
        return <span className="status-dot secondary" title="Đã hủy"><AlertCircle size={12} /></span>;
      default:
        return <span className="status-dot warning" title="Chờ duyệt"><Clock size={12} /></span>;
    }
  };

  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="order-schedule-card" onClick={() => navigate(`/admin/orders/${order.id}`)}>
      <div className="card-top">
        <div className="order-id-badge">#{order.id}</div>
        <div className="card-badges">
          <div className="status-selector-container" onClick={(e) => e.stopPropagation()}>
            <select 
              className={`status-select-minimal ${order.status.toLowerCase()}`}
              value={order.status}
              onChange={(e) => handleStatusUpdate(e, order.id, e.target.value)}
              disabled={updatingOrderId === order.id}
            >
              <option value="CHO_DUYET">Chờ duyệt</option>
              <option value="DA_DUYET">Đã duyệt</option>
              <option value="DA_HOAN_THANH">Đã hoàn thành</option>
              <option value="TU_CHOI">Từ chối</option>
              <option value="HUY_DON">Hủy đơn</option>
            </select>
            {updatingOrderId === order.id && <div className="loader-micro" />}
          </div>
          <div className={`type-tag ${(order.type || '').toLowerCase()}`}>
            {order.type === 'MUA_GA' ? 'Mua gà' : 'Đặt gà'}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="card-body-left">
          <div 
            className="user-info" 
            onClick={(e) => {
              e.stopPropagation();
              if (order.userId) handleCustomerClick(order.userId);
            }}
            style={{ cursor: 'pointer', color: '#2563eb' }}
            title="Xem chi tiết khách hàng"
          >
            <UserIcon size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>{order.user?.fullName || order.user?.username || 'Khách hàng'}</span>
          </div>

          {order.user?.phone && (
            <div 
              onClick={(e) => order.userId && handleCall(e, order.user?.phone || '', order.userId, order.user?.fullName || order.user?.username || '')}
              style={{ color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
              title="Gọi khách hàng và lưu lịch sử"
            >
              <Phone size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600 }}>{order.user.phone}</span>
            </div>
          )}

          {order.deliveryStaff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#475569', marginTop: '4px' }}>
              <UserIcon size={14} style={{ flexShrink: 0, color: '#64748b' }} />
              <span>Giao hàng: <strong style={{ color: '#0f172a' }}>{order.deliveryStaff.fullName || order.deliveryStaff.username}</strong></span>
            </div>
          )}
        </div>

        <div className="card-body-right">
            <div className="quantity-info">
              <span className="qty-value">{order.quantity.toLocaleString('vi-VN')}</span>
              <span className="qty-unit">con</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', marginTop: '4px' }}>
                {order.unitPrice !== undefined && order.unitPrice !== null && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      {order.unitPrice.toLocaleString('vi-VN')} đ/c
                    </div>
                )}
                {order.amount !== undefined && order.amount !== null && (
                    <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>
                      {order.amount.toLocaleString('vi-VN')} đ
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="work-link">
          <Package size={14} />
          <span>{order.work?.title || 'Đang chờ xử lý'}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>

            {order.user?.lat && order.user?.lng && (
              <a 
                href={`https://www.google.com/maps?q=${order.user.lat},${order.user.lng}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}
                title="Xem trên bản đồ"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin size={16} />
              </a>
            )}
            
            <button
              onClick={(e) => order.userId && handleUpdateUserLocation(e, order.userId)}
              disabled={updatingUserId === order.userId}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              title="Cập nhật vị trí hiện tại cho khách hàng này"
            >
              {updatingUserId === order.userId ? (
                 <div className="loader-small" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              ) : (
                 <Navigation size={14} />
              )}
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="order-schedule-container">
      <div className="schedule-header">
        <div className="header-top">
          <div className="title-section">
            <h2>Lịch Trình Giao Hàng</h2>
            <p className="subtitle">Theo dõi các đơn hàng theo ngày bán (Giao hàng)</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {qrConfigs.length > 0 && (
              <button 
                className="header-qr-btn" 
                onClick={() => setQrModalOrder({ id: 'he-thong', amount: 0 } as any)}
                title="Xem QR nhận tiền mặc định"
              >
                <QrCode size={16} />
                <span>QR Nhận Tiền</span>
              </button>
            )}
            <button className="today-btn" onClick={setToday}>Hôm nay</button>
          </div>
        </div>

        <div className="date-controls">
          <button className="arrow-btn" onClick={() => handleDateChange(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="display-date">
            <Calendar size={20} />
            <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button className="arrow-btn" onClick={() => handleDateChange(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
           <div className="loader"></div>
           <p>Đang tải lịch trình...</p>
        </div>
      ) : schedule ? (
        <div className="schedule-content">
          {/* TODAY SECTION */}
          <section className="day-section today">
            <div className="section-title">
              <Clock size={20} color="#2563eb" />
              <h3>Đơn hàng của {selectedDate.toDateString() === new Date().toDateString() ? 'Hôm nay' : 'Ngày đã chọn'}</h3>
              <span className="count-badge">{schedule.current.orders.length}</span>
            </div>
            
            {schedule.current.orders.length > 0 ? (
              <div className="order-grid">
                {schedule.current.orders.map(renderOrderCard)}
              </div>
            ) : (
              <div className="empty-day">
                 <ShoppingBag size={48} />
                 <p>Không có đơn hàng nào cần giao trong ngày này.</p>
              </div>
            )}
          </section>

          {/* NEXT AVAILABLE SECTION */}
          {schedule.next.date && (
            <section className="day-section next">
              <div className="section-title">
                <TrendingUp size={20} color="#059669" />
                <h3>Lịch trình giao hàng tiếp theo: {new Date(schedule.next.date).toLocaleDateString('vi-VN')}</h3>
                <span className="count-badge next">{schedule.next.orders.length}</span>
              </div>
              
              <div className="order-grid">
                {schedule.next.orders.map(renderOrderCard)}
              </div>
            </section>
          )}

          {!schedule.next.date && schedule.current.orders.length === 0 && (
             <div className="fully-empty">
                <Calendar size={64} />
                <h3>Chưa có lịch trình giao hàng nào sắp tới</h3>
                <p>Mọi đơn hàng đã được xử lý hoặc chưa có đơn hàng mới.</p>
             </div>
          )}
        </div>
      ) : null}
      {/* QR Payment Modal */}
      {(() => {
        const activeQr = qrConfigs[currentQrIndex];
        return qrModalOrder && (
          <div className="qr-modal-overlay" onClick={() => setQrModalOrder(null)}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="qr-modal-header">
                <h3>{qrModalOrder.id === 'he-thong' ? 'Mã QR Nhận Tiền Mặc Định' : `QR Thanh Toán - Đơn hàng #${qrModalOrder.id}`}</h3>
                <button className="btn-close-qr-modal" onClick={() => setQrModalOrder(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="qr-modal-body">
                {activeQr ? (
                  <>
                    <div className="qr-image-box">
                      <img 
                        src={qrModalOrder.id === 'he-thong'
                          ? `https://img.vietqr.io/image/${activeQr.bankCode}-${activeQr.bankAccount}-${activeQr.template || 'compact'}.png?accountName=${encodeURIComponent(activeQr.accountName)}`
                          : `https://img.vietqr.io/image/${activeQr.bankCode}-${activeQr.bankAccount}-${activeQr.template || 'compact'}.png?amount=${qrModalOrder.amount || 0}&addInfo=${encodeURIComponent('THANH TOAN DON HANG ' + qrModalOrder.id)}&accountName=${encodeURIComponent(activeQr.accountName)}`
                        } 
                        alt="VietQR Payment Code"
                      />
                    </div>
                    {qrConfigs.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 0.5rem', marginTop: '0.25rem' }}>
                        <button 
                          onClick={() => setCurrentQrIndex(prev => (prev - 1 + qrConfigs.length) % qrConfigs.length)}
                          className="btn-qr-nav"
                          title="Tài khoản trước"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                          Tài khoản {currentQrIndex + 1} / {qrConfigs.length}
                        </span>
                        <button 
                          onClick={() => setCurrentQrIndex(prev => (prev + 1) % qrConfigs.length)}
                          className="btn-qr-nav"
                          title="Tài khoản tiếp theo"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                    <div className="qr-info-details">
                      <div className="qr-info-row">
                        <span className="label">Ngân hàng:</span>
                        <span className="value">{activeQr.bankName}</span>
                      </div>
                      <div className="qr-info-row">
                        <span className="label">Chủ TK:</span>
                        <span className="value">{activeQr.accountName}</span>
                      </div>
                      <div className="qr-info-row">
                        <span className="label">Số TK:</span>
                        <span className="value">{activeQr.bankAccount}</span>
                        <button className="btn-qr-copy" onClick={() => { navigator.clipboard.writeText(activeQr.bankAccount); alert('Đã sao chép Số tài khoản!'); }}>
                          <Copy size={13} />
                        </button>
                      </div>
                      {qrModalOrder.id !== 'he-thong' && (
                        <>
                          <div className="qr-info-row">
                            <span className="label">Số tiền:</span>
                            <span className="value amount">{(qrModalOrder.amount || 0).toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="qr-info-row">
                            <span className="label">Nội dung:</span>
                            <span className="value content">THANH TOAN DON HANG {qrModalOrder.id}</span>
                            <button className="btn-qr-copy" onClick={() => { navigator.clipboard.writeText('THANH TOAN DON HANG ' + qrModalOrder.id); alert('Đã sao chép Nội dung!'); }}>
                              <Copy size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="qr-warning-message">
                    <AlertCircle size={48} />
                    <p>Chưa có tài khoản QR mặc định nào được cấu hình trong hệ thống.</p>
                    <button className="btn-link-settings" onClick={() => { setQrModalOrder(null); navigate('/admin/qr-management'); }}>
                      Cấu hình ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderSchedule;

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
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './OrderSchedule.css';

interface Order {
  id: string;
  userId: string;
  user?: { username: string; fullName: string; lat?: number; lng?: number };
  quantity: number;
  type: string;
  status: string;
  orderDate?: string;
  exportDate?: string;
  work?: { title: string };
  amount?: number;
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
  const navigate = useNavigate();

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
          {getStatusBadge(order.status)}
          <div className={`type-tag ${(order.type || '').toLowerCase()}`}>
            {order.type === 'MUA_GA' ? 'Mua gà' : 'Đặt gà'}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div 
          className="user-info" 
          onClick={(e) => {
            e.stopPropagation();
            if (order.userId) handleCustomerClick(order.userId);
          }}
          style={{ cursor: 'pointer', color: '#2563eb' }}
          title="Xem chi tiết khách hàng"
        >
          <UserIcon size={16} />
          <span style={{ fontWeight: 500 }}>{order.user?.fullName || order.user?.username || 'Khách hàng'}</span>
        </div>
        <div className="quantity-info">
          <span className="qty-value">{order.quantity.toLocaleString('vi-VN')}</span>
          <span className="qty-unit">con</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="work-link">
          <Package size={14} />
          <span>{order.work?.title || 'Đang chờ xử lý'}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
            {order.amount && (
                <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.9rem' }}>
                  {order.amount.toLocaleString('vi-VN')} đ
                </div>
            )}

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
            <p className="subtitle">Theo dõi các đơn hàng cần xuất theo ngày</p>
          </div>
          <button className="today-btn" onClick={setToday}>Hôm nay</button>
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
    </div>
  );
};

export default OrderSchedule;

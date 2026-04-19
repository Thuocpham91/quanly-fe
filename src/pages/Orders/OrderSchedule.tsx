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
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './OrderSchedule.css';

interface Order {
  id: string;
  userId: string;
  user?: { username: string; fullName: string };
  quantity: number;
  type: string;
  status: string;
  orderDate?: string;
  exportDate?: string;
  work?: { title: string };
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
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

  const renderOrderCard = (order: Order) => (
    <div key={order.id} className="order-schedule-card" onClick={() => navigate(`/orders/${order.id}`)}>
      <div className="card-top">
        <div className="order-id-badge">#{order.id}</div>
        <div className={`type-tag ${order.type.toLowerCase()}`}>
          {order.type === 'MUA_GA' ? 'Mua gà' : 'Đặt gà'}
        </div>
      </div>
      
      <div className="card-body">
        <div className="user-info">
          <UserIcon size={16} />
          <span>{order.user?.fullName || order.user?.username || 'Khách hàng'}</span>
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
        <ArrowRight size={16} className="arrow-icon" />
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

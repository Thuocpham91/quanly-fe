import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  ShoppingBag, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Package,
  MapPin,
  Navigation,
  DollarSign,
  Coins,
  Phone
} from 'lucide-react';
import api from '../../api/axios';
import './OrderDetail.css';

interface OrderData {
  id: string;
  userId: string;
  user?: { id?: string; username: string; fullName: string; phone?: string; lat?: number; lng?: number };
  quantity: number;
  type: string;
  status: string;
  orderDate?: string;
  exportDate?: string;
  saleDate?: string;
  workId?: string;
  work?: any;
  amount?: number;
  unitPrice?: number;
  gaSo?: number;
  gaTrong?: number;
  gaMai?: number;
  priceGaSo?: number;
  priceGaTrong?: number;
  priceGaMai?: number;
  description?: string;
}

interface WorkBatch {
  id: string;
  title: string;
  exportDate: string;
  quantity: number;
  purchaseQuantity?: number;
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [works, setWorks] = useState<WorkBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleCall = async (phone: string, userId: string, name: string) => {
    if (!phone) return;

    try {
      const res = await api.get(`/customers/user/${userId}`);
      if (res.data && res.data.data) {
        await api.post('/call-histories', {
          customerId: res.data.data.id,
          note: `Cuộc gọi từ chi tiết Đơn hàng #${id}: ${name}`
        });
      }
    } catch (error) {
      console.error('Error logging call history:', error);
    } finally {
      window.location.href = `tel:${phone}`;
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [orderRes, worksRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/works')
      ]);

      if (orderRes.data && orderRes.data.data) {
        setOrder(orderRes.data.data);
      }
      if (worksRes.data && Array.isArray(worksRes.data.data)) {
        setWorks(worksRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Không thể tải thông tin đơn hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSelectWork = async (workId: string) => {
    try {
      setIsUpdating(true);
      await api.put(`/orders/${id}`, { workId });
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error updating order work:', err);
      alert('Có lỗi xảy ra khi cập nhật ngày xuất.');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSaleDate = async (newDate: string) => {
    try {
      setIsUpdating(true);
      await api.put(`/orders/${id}`, { saleDate: newDate ? new Date(newDate).toISOString() : null });
      fetchData();
    } catch (err) {
      console.error('Error updating sale date:', err);
      alert('Có lỗi xảy ra khi cập nhật ngày bán.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DA_DUYET':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Đã duyệt</span>;
      case 'DA_HOAN_THANH':
        return <span className="badge" style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
          <CheckCircle2 size={12} /> Đã hoàn thành
        </span>;
      case 'TU_CHOI':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Từ chối</span>;
      case 'HUY_DON':
        return <span className="badge" style={{ backgroundColor: '#64748b', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
          <AlertCircle size={12} /> Đã hủy
        </span>;
      default:
        return <span className="badge badge-warning"><Clock size={12} /> Chờ duyệt</span>;
    }
  };

  const handleUpdateUserLocation = () => {
    if (!order?.userId) return;
    
    if ("geolocation" in navigator) {
      setIsUpdating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.put(`/users/${order.userId}`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            alert('Cập nhật vị trí khách hàng thành công!');
            fetchData(); // Tải lại thông tin để hiển thị icon
          } catch (error) {
            console.error('Lỗi khi cập nhật vị trí user:', error);
            alert('Có lỗi xảy ra khi lưu vị trí.');
          } finally {
            setIsUpdating(false);
          }
        },
        (error) => {
          console.error("Lỗi lấy vị trí:", error);
          alert("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.");
          setIsUpdating(false);
        }
      );
    } else {
      alert("Trình duyệt của bạn không hỗ trợ định vị.");
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader-large"></div>
        <p>Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#ef4444" />
        <h3>Không tìm thấy đơn hàng</h3>
        <button className="btn-secondary" onClick={() => navigate('/orders')}> Quay lại danh sách </button>
      </div>
    );
  }

  return (
    <div className="order-detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <div className="header-title">
          <h2>Chi Tiết Đơn Hàng #{order.id}</h2>
          <div className="header-badges">
            {getStatusBadge(order.status)}
            <span className="type-tag">{order.type === 'MUA_GA' ? 'Mua gà' : 'Đặt gà'}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Info Card */}
        <div className="info-card">
          <div className="card-header">
            <ShoppingBag size={18} />
            <h3>Thông tin chung</h3>
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="label">Khách hàng:</span>
              <div className="value" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserIcon size={14} />
                  <span style={{ fontWeight: 600 }}>{order.user?.fullName || order.user?.username || 'N/A'}</span>
                </div>
                {(() => {
                  const isPhonePattern = (val?: string) => val ? /^[0-9+\s().-]{9,15}$/.test(val.trim()) : false;
                  const phone = order.user?.phone || (isPhonePattern(order.user?.username) ? order.user?.username : null);
                  if (phone) {
                    return (
                      <div 
                        onClick={() => handleCall(phone, order.userId, order.user?.fullName || order.user?.username || '')}
                        style={{ color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '1.25rem' }}
                        title="Click để gọi và lưu lịch sử"
                      >
                        <Phone size={12} />
                        <span>{phone}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="info-item">
              <span className="label">Số lượng:</span>
              <span className="value highlight">{order.quantity.toLocaleString('vi-VN')}</span>
            </div>
            <div className="info-item">
              <span className="label">Ngày đặt hàng:</span>
              <div className="value">
                <Calendar size={14} />
                <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
              </div>
            </div>
            <div className="info-item">
              <span className="label">Ngày xuất dự kiến:</span>
              <div className="value export-value">
                <Calendar size={14} />
                <span style={{ color: '#059669', fontWeight: 600 }}>
                  {order.exportDate ? new Date(order.exportDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <span className="label">Ngày bán thực tế:</span>
              <div className="value">
                <Calendar size={14} />
                <input 
                   type="date" 
                   className="inline-date-input"
                   defaultValue={order.saleDate ? new Date(order.saleDate).toISOString().split('T')[0] : ''}
                   onBlur={(e) => updateSaleDate(e.target.value)}
                   style={{ 
                     border: '1px solid #e2e8f0', 
                     borderRadius: '4px', 
                     padding: '2px 8px',
                     fontSize: '0.875rem',
                     color: '#2563eb',
                     fontWeight: 600
                   }}
                />
              </div>
            </div>
            
            <div className="info-item" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '0.75rem', paddingBottom: '0.25rem' }}>
                {order.user?.lat && order.user?.lng && (
                  <a 
                    href={`https://www.google.com/maps?q=${order.user.lat},${order.user.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#2563eb', display: 'flex', alignItems: 'center', background: '#eff6ff', padding: '6px', borderRadius: '6px' }}
                    title="Xem trên bản đồ"
                  >
                    <MapPin size={18} />
                  </a>
                )}
                <button
                  onClick={handleUpdateUserLocation}
                  disabled={isUpdating}
                  style={{
                    background: '#ecfdf5',
                    border: 'none',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: 600
                  }}
                  title="Cập nhật vị trí hiện tại cho khách hàng này"
                >
                  {isUpdating ? (
                    <div className="loader-small" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: '#059669 transparent #059669 transparent' }} />
                  ) : (
                    <>
                      <Navigation size={16} />
                      Cập nhật vị trí
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>

        {/* Selected Work Summary */}
        {order.work && (
          <div className="work-summary-card">
              <div className="card-header">
                <Package size={18} />
                <h3>Đợt nuôi liên kết</h3>
              </div>
              <div className="work-info">
                <p><strong>{order.work.title}</strong></p>
                <div className="work-meta">
                   <span>SL trong đợt: {order.work.quantity?.toLocaleString('vi-VN')}</span>
                   <span>Ngày xuất đợt: {new Date(order.work.exportDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <Link to={`/works/${order.work.id}`} className="view-work-link">
                   Chi tiết đợt nuôi <ChevronRight size={14} />
                </Link>
              </div>
          </div>
        )}

        {/* Price and Classification Card */}
        <div className="info-card price-card">
          <div className="card-header">
            <Coins size={18} />
            <h3>Chi tiết giá & Phân loại</h3>
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="label">Đơn giá:</span>
              <span className="value highlight-price">
                {order.unitPrice ? `${order.unitPrice.toLocaleString('vi-VN')} đ` : 'Chưa có'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Tổng tiền:</span>
              <span className="value highlight-total">
                {order.amount ? `${order.amount.toLocaleString('vi-VN')} đ` : 'Tự động tính'}
              </span>
            </div>
            
            {(order.gaSo || order.gaTrong || order.gaMai) ? (
              <div className="info-item full-width" style={{ gridColumn: 'span 2', marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span className="label" style={{ marginBottom: '0.5rem' }}>Phân loại gà:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {(order.gaSo || 0) > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gà xô</div>
                      <div style={{ fontWeight: 600 }}>{order.gaSo} con</div>
                      {(order.priceGaSo || 0) > 0 && <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>{order.priceGaSo?.toLocaleString('vi-VN')}đ</div>}
                    </div>
                  )}
                  {(order.gaTrong || 0) > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gà trống</div>
                      <div style={{ fontWeight: 600 }}>{order.gaTrong} con</div>
                      {(order.priceGaTrong || 0) > 0 && <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>{order.priceGaTrong?.toLocaleString('vi-VN')}đ</div>}
                    </div>
                  )}
                  {(order.gaMai || 0) > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gà mái</div>
                      <div style={{ fontWeight: 600 }}>{order.gaMai} con</div>
                      {(order.priceGaMai || 0) > 0 && <div style={{ fontSize: '0.7rem', color: '#2563eb' }}>{order.priceGaMai?.toLocaleString('vi-VN')}đ</div>}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {order.description && (
              <div className="info-item full-width" style={{ gridColumn: 'span 2' }}>
                <span className="label">Ghi chú:</span>
                <span className="value" style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>{order.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="works-selection-section">
        <div className="section-header">
          <h3>Chọn Ngày Xuất Từ Dữ Liệu Work</h3>
          <p>Chọn một đợt nuôi có ngày xuất phù hợp để cập nhật cho đơn hàng</p>
        </div>

        <div className="works-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên Đợt Nuôi</th>
                <th>Ngày Xuất Gà</th>
                <th>Số Lượng Dự Kiến</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <tr key={work.id} className={order.workId === work.id ? 'active-row' : ''}>
                  <td>
                    <div className="work-title-cell">
                      <span className="work-id-tag">#{work.id}</span>
                      <span className="work-title-text">{work.title}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell highlight-green">
                      <Calendar size={14} />
                      <span>{new Date(work.exportDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {(Number(work.purchaseQuantity) - (order.workId === work.id ? Number(order.quantity) : 0) + Number(order.quantity)) > Number(work.quantity) && (
                      <div style={{ color: '#c2410c', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
                        <AlertCircle size={10} /> Quá tải {(Number(work.purchaseQuantity) - (order.workId === work.id ? Number(order.quantity) : 0) + Number(order.quantity)) - Number(work.quantity)} gà
                      </div>
                    )}
                  </td>
                  <td>{work.quantity?.toLocaleString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    {order.workId === work.id ? (
                      <span className="selected-tag">Đang chọn</span>
                    ) : (
                      <button 
                        className="btn-outline-primary" 
                        onClick={() => handleSelectWork(work.id)}
                        disabled={isUpdating}
                      >
                        Chọn Ngày Này
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {works.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">Không tìm thấy dữ liệu đợt nuôi nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

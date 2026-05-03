import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User as UserIcon, 
  Calendar, 
  ShoppingBag, 
  Clock, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Phone,
  ArrowUpRight,
  ExternalLink,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './SalesManagement.css';

interface UserData {
  id: string;
  username: string;
  fullName?: string;
  phone?: string;
  role?: string | { code: string };
}

interface OrderData {
  id: string;
  userId: string;
  quantity: number;
  amount?: number;
  status: string;
  orderDate: string;
}

interface CustomerInsight {
  userId: string;
  user: UserData;
  customerId?: string;
  lastPurchaseDate: Date | null;
  totalOrders: number;
  totalQuantity: number;
  totalAmount: number;
  daysSinceLastPurchase: number | null;
  lastCalledDate: Date | null;
  daysSinceLastCall: number | null;
}

const SalesManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState<'ALL' | 'DORMANT'>('ALL');
  const [callFilter, setCallFilter] = useState<'ALL' | 'CALLED_10' | 'CALLED_60' | 'NOT_CALLED' | 'NO_CALL_10' | 'NO_CALL_60' | 'NO_CALL_5M'>('ALL');
  const [customerCallStatuses, setCustomerCallStatuses] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInsight | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [trackingUserId, setTrackingUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, ordersRes, customersRes] = await Promise.all([
        api.get('/users'),
        api.get('/orders'),
        api.get('/customers?limit=1000').catch(() => ({ data: { data: [] } }))
      ]);

      if (usersRes.data && Array.isArray(usersRes.data.data)) {
        setUsers(usersRes.data.data);
      }
      if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
        setOrders(ordersRes.data.data);
      }
      if (customersRes.data && Array.isArray(customersRes.data.data)) {
        setCustomers(customersRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch call statuses from API whenever callFilter changes
  useEffect(() => {
    const fetchCallStatus = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/call-histories/customer-status?callFilter=${callFilter}`);
        if (res.data?.data) {
          setCustomerCallStatuses(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching call status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCallStatus();
  }, [callFilter]);

  const handleCall = async (phone: string, customerId?: string, customerName?: string, userId?: string) => {
    if (!phone) return;
    
    let targetCustomerId = customerId;

    try {
      // 1. Try to find customerId if missing
      if (!targetCustomerId && userId) {
        const res = await api.get(`/customers/user/${userId}`).catch(() => null);
        if (res?.data?.data) {
          targetCustomerId = res.data.data.id;
        }
      }

      // 2. Log history if we have a customerId
      if (targetCustomerId) {
        await api.post('/call-histories', {
          customerId: targetCustomerId,
          note: `Cuộc gọi từ danh sách Theo dõi Khách mua: ${customerName || phone}`
        });
        
        // Refresh history if drawer is open
        if (selectedCustomer?.customerId === targetCustomerId || (userId && selectedCustomer?.userId === userId)) {
          fetchCallHistory(targetCustomerId);
        }
      } else {
        console.warn('Cannot log call history: No customer profile found for this user.');
      }
    } catch (error) {
      console.error('Error logging call history:', error);
    } finally {
      // 3. Open dialer after a tiny delay to ensure the request is dispatched
      setTimeout(() => {
        window.location.href = `tel:${phone}`;
      }, 100);
    }
  };

  const fetchCallHistory = async (customerId: string) => {
    try {
      setIsHistoryLoading(true);
      const res = await api.get(`/call-histories?customerId=${customerId}`);
      if (res.data && Array.isArray(res.data.data)) {
        setCallHistory(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCallHistory(res.data);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openHistoryDrawer = async (item: CustomerInsight) => {
    setSelectedCustomer(item);
    setCallHistory([]);
    
    let targetCustomerId = item.customerId;

    try {
      setIsHistoryLoading(true);
      
      // If customerId is missing, try to fetch it
      if (!targetCustomerId && item.userId) {
        const res = await api.get(`/customers/user/${item.userId}`).catch(() => null);
        if (res?.data?.data) {
          targetCustomerId = res.data.data.id;
          // Update selected customer with the found ID
          setSelectedCustomer(prev => prev ? { ...prev, customerId: targetCustomerId } : null);
        }
      }

      if (targetCustomerId) {
        fetchCallHistory(targetCustomerId);
      } else {
        setIsHistoryLoading(false);
      }
    } catch (error) {
      console.error('Error in openHistoryDrawer:', error);
      setIsHistoryLoading(false);
    }
  };

  const toggleTracking = (userId: string) => {
    setTrackingUserId(prev => prev === userId ? null : userId);
  };

  const insights = useMemo(() => {
    const customerMap = new Map<string, CustomerInsight>();

    // Process all users first
    users.forEach(user => {
      // Find linked customer record
      const linkedCustomer = customers.find(c => c.userId === user.id);
      
      customerMap.set(user.id, {
        userId: user.id,
        user,
        customerId: linkedCustomer?.id,
        lastPurchaseDate: null,
        totalOrders: 0,
        totalQuantity: 0,
        totalAmount: 0,
        daysSinceLastPurchase: null,
        lastCalledDate: null,
        daysSinceLastCall: null,
      });
    });

    // Aggregate orders
    orders.forEach(order => {
      // Only count valid orders (not cancelled/rejected)
      if (['HUY_DON', 'TU_CHOI'].includes(order.status)) return;

      const insight = customerMap.get(order.userId);
      if (insight) {
        insight.totalOrders += 1;
        insight.totalQuantity += Number(order.quantity) || 0;
        insight.totalAmount += Number(order.amount) || 0;

        const orderDate = new Date(order.orderDate);
        if (!insight.lastPurchaseDate || orderDate > insight.lastPurchaseDate) {
          insight.lastPurchaseDate = orderDate;
        }
      }
    });

    // Calculate recency
    const now = new Date();
    const result = Array.from(customerMap.values())
      .filter(i => i.totalOrders > 0) // Only show users who have actually bought
      .map(i => {
        if (i.lastPurchaseDate) {
          const diffTime = Math.abs(now.getTime() - i.lastPurchaseDate.getTime());
          i.daysSinceLastPurchase = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        return i;
      });

    return result.sort((a, b) => {
      if (!a.lastPurchaseDate) return 1;
      if (!b.lastPurchaseDate) return -1;
      return b.lastPurchaseDate.getTime() - a.lastPurchaseDate.getTime();
    });
  }, [users, orders, customers]);

  const filteredInsights = useMemo(() => {
    // 1. Create lookup map from the backend response
    const statusMap = new Map(customerCallStatuses.map(c => [c.customerId, c]));

    // 2. Map & Filter
    const results: CustomerInsight[] = [];

    for (const i of insights) {
      // Name/Phone Search
      const matchesSearch =
        (i.user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.user.phone || '').includes(searchTerm);
      if (!matchesSearch) continue;

      // Purchase recency filter (Lâu chưa mua)
      if (purchaseFilter === 'DORMANT') {
        const purchaseDays = i.daysSinceLastPurchase ?? 9999;
        if (purchaseDays <= 240) continue; // Only keep those > 240 or null
      }

      // Call filter (Backend driven)
      let matchesCall = false;
      let callData = null;

      if (i.customerId && statusMap.has(i.customerId)) {
        matchesCall = true;
        callData = statusMap.get(i.customerId);
      } else {
        if (callFilter === 'ALL') {
          matchesCall = true;
        } else if (!i.customerId && (callFilter === 'NOT_CALLED' || callFilter.startsWith('NO_CALL_'))) {
          // Fallback for users without linked customer records
          matchesCall = true;
        }
      }

      if (!matchesCall) continue;

      results.push({
        ...i,
        lastCalledDate: callData?.lastCalledAt ? new Date(callData.lastCalledAt) : null,
        daysSinceLastCall: callData?.daysSinceLastCall ?? null,
      });
    }

    return results;
  }, [insights, searchTerm, purchaseFilter, callFilter, customerCallStatuses]);

  const getRecencyLabel = (days: number | null) => {
    if (days === null) return 'Chưa mua';
    if (days <= 10) return <span className="recency-tag recent">Mới mua (10d)</span>;
    if (days <= 60) return <span className="recency-tag active">Thường xuyên (60d)</span>;
    if (days <= 150) return <span className="recency-tag standard">Gần đây (5th)</span>;
    if (days <= 240) return <span className="recency-tag fading">Lâu ngày (8th)</span>;
    return <span className="recency-tag dormant">Rất lâu rồi (&gt;8th)</span>;
  };

  return (
    <div className="sales-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Theo Dõi Khách Mua Hàng</h2>
          <p>Phân tích lịch sử mua hàng và mức độ tương tác của khách hàng</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><ShoppingBag size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Tổng khách đã mua</span>
            <span className="stat-value">{insights.length}</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Mua trong 10 ngày qua</span>
            <span className="stat-value">{insights.filter(i => (i.daysSinceLastPurchase ?? 999) <= 10).length}</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><UserIcon size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Khách lâu ngày (&gt;8th)</span>
            <span className="stat-value">{insights.filter(i => (i.daysSinceLastPurchase ?? 0) > 240).length}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, SĐT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <span className="filter-label">Mua hàng:</span>
          <button className={`filter-tab ${purchaseFilter === 'ALL' ? 'active' : ''}`} onClick={() => setPurchaseFilter('ALL')}>Tất cả</button>
          <button className={`filter-tab ${purchaseFilter === 'DORMANT' ? 'active' : ''}`} onClick={() => setPurchaseFilter('DORMANT')}>Lâu chưa mua (&gt;8 tháng)</button>
        </div>

        <div className="filter-tabs call-filter-tabs">
          <span className="filter-label">Gọi điện:</span>
          <button className={`filter-tab ${callFilter === 'ALL' ? 'active' : ''}`} onClick={() => setCallFilter('ALL')}>Tất cả</button>
          <button className={`filter-tab call-none ${callFilter === 'NOT_CALLED' ? 'active' : ''}`} onClick={() => setCallFilter('NOT_CALLED')}>✗ Chưa gọi</button>
          <button className={`filter-tab call-none ${callFilter === 'NO_CALL_10' ? 'active' : ''}`} onClick={() => setCallFilter('NO_CALL_10')}>✗ Chưa gọi 10d</button>
          <button className={`filter-tab call-none ${callFilter === 'NO_CALL_60' ? 'active' : ''}`} onClick={() => setCallFilter('NO_CALL_60')}>✗ Chưa gọi 60d</button>
          <button className={`filter-tab call-none ${callFilter === 'NO_CALL_5M' ? 'active' : ''}`} onClick={() => setCallFilter('NO_CALL_5M')}>✗ Chưa gọi 5 tháng</button>
          <button className={`filter-tab call-ok ${callFilter === 'CALLED_10' ? 'active' : ''}`} onClick={() => setCallFilter('CALLED_10')}>✓ Đã gọi ≤10d</button>
          <button className={`filter-tab call-ok ${callFilter === 'CALLED_60' ? 'active' : ''}`} onClick={() => setCallFilter('CALLED_60')}>✓ Đã gọi ≤60d</button>
        </div>
      </div>

      <div className={`sales-content-layout ${trackingUserId ? 'has-panel' : ''}`}>
        <div className="table-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Đang tải dữ liệu phân tích...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="sales-table desktop-only">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Lần mua cuối</th>
                  <th>Độ trễ (ngày)</th>
                  <th>Tổng đơn</th>
                  <th>Tổng tiền</th>
                  <th>Phân loại</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredInsights.length > 0 ? (
                  filteredInsights.map((item) => (
                    <tr key={item.userId} className={trackingUserId === item.userId ? 'expanded-row tracking-active' : ''}>
                        <td>
                          <button 
                            className={`btn-expand ${trackingUserId === item.userId ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTracking(item.userId);
                            }}
                          >
                            <ChevronRight size={18} className={trackingUserId === item.userId ? 'rotate-180' : ''} />
                          </button>
                        </td>
                        <td>
                          <div 
                            className="customer-info" 
                            onClick={() => toggleTracking(item.userId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="avatar">
                              {item.user.fullName?.[0] || item.user.username?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="name">{item.user.fullName || item.user.username}</div>
                              <div className="username">@{item.user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div 
                            className="phone-cell" 
                            onClick={() => handleCall(item.user.phone || '', item.customerId, item.user.fullName || item.user.username, item.userId)}
                            style={{ cursor: item.user.phone ? 'pointer' : 'default', color: item.user.phone ? '#2563eb' : 'inherit' }}
                            title={item.user.phone ? 'Click để gọi và lưu lịch sử' : ''}
                          >
                            <Phone size={14} />
                            <span style={{ fontWeight: 500 }}>{item.user.phone || '-'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <Calendar size={14} />
                            <span>{item.lastPurchaseDate?.toLocaleDateString('vi-VN') || '-'}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.daysSinceLastPurchase} ngày</td>
                        <td style={{ textAlign: 'center' }}>{item.totalOrders}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td>{getRecencyLabel(item.daysSinceLastPurchase)}</td>
                        <td>
                          <button 
                            className="btn-view"
                            title="Xem chi tiết User"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users?search=${item.user.username}`);
                            }}
                          >
                            <ExternalLink size={16} />
                          </button>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="empty-row">
                      Không tìm thấy khách hàng phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="mobile-card-list">
              {filteredInsights.length > 0 ? (
                filteredInsights.map((item) => (
                  <div 
                    key={item.userId} 
                    className="mobile-sales-card"
                    onClick={() => openHistoryDrawer(item)}
                  >
                    <div className="card-header">
                      <div className="customer-info">
                        <div className="avatar">
                          {item.user.fullName?.[0] || item.user.username?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="name">{item.user.fullName || item.user.username}</div>
                          <div className="username">@{item.user.username}</div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button 
                          className={`btn-view-sm ${trackingUserId === item.userId ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTracking(item.userId);
                          }}
                        >
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="card-row">
                        <div className="label">Lần mua cuối</div>
                        <div className="value">
                          {item.lastPurchaseDate?.toLocaleDateString('vi-VN') || '-'} 
                          <span className="delay-text"> ({item.daysSinceLastPurchase} ngày)</span>
                        </div>
                      </div>
                      <div className="card-row">
                        <div className="label">Tổng đơn/Tiền</div>
                        <div className="value">
                          {item.totalOrders} đơn / <strong>{item.totalAmount.toLocaleString('vi-VN')} đ</strong>
                        </div>
                      </div>
                      <div className="card-footer">
                        <div 
                          className="phone-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(item.user.phone || '', item.customerId, item.user.fullName || item.user.username, item.userId);
                          }}
                        >
                          <Phone size={14} />
                          <span>{item.user.phone || 'N/A'}</span>
                        </div>
                        <div className="badge-container">
                          {getRecencyLabel(item.daysSinceLastPurchase)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-mobile">
                  Không tìm thấy khách hàng phù hợp.
                </div>
              )}
            </div>
          </>
        )}
        </div>

        {/* Tracking Side Panel */}
        {trackingUserId && (
          <>
            <div className="panel-overlay" onClick={() => setTrackingUserId(null)} />
            <div className="orders-side-panel">
            <div className="panel-header">
              <div className="customer-compact">
                <div className="avatar-panel">
                  {filteredInsights.find(i => i.userId === trackingUserId)?.user.fullName?.[0] || 
                   filteredInsights.find(i => i.userId === trackingUserId)?.user.username?.[0]}
                </div>
                <div>
                  <h4>{filteredInsights.find(i => i.userId === trackingUserId)?.user.fullName || 
                       filteredInsights.find(i => i.userId === trackingUserId)?.user.username}</h4>
                  <p>@{filteredInsights.find(i => i.userId === trackingUserId)?.user.username}</p>
                </div>
              </div>
              <button className="close-panel" onClick={() => setTrackingUserId(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="panel-body">
              <div className="panel-stats">
                <div className="panel-stat-item">
                  <span className="label">Tổng đơn</span>
                  <span className="value">{filteredInsights.find(i => i.userId === trackingUserId)?.totalOrders}</span>
                </div>
                <div className="panel-stat-item">
                  <span className="label">Tổng tiền</span>
                  <span className="value text-primary">
                    {filteredInsights.find(i => i.userId === trackingUserId)?.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="orders-list-section">
                <h5><ShoppingBag size={14} /> Danh sách đơn hàng</h5>
                <div className="mini-orders-list">
                  {orders
                    .filter(o => o.userId === trackingUserId)
                    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                    .map(order => (
                      <div key={order.id} className="mini-order-card">
                        <div className="order-main">
                          <span className="order-id">#{order.id.slice(-6)}</span>
                          <span className="order-date">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="order-details">
                          <span className="order-qty">{order.quantity} con</span>
                          <span className="order-amount">{order.amount?.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="order-status-row">
                          <span className={`mini-status-badge ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                  {orders.filter(o => o.userId === trackingUserId).length === 0 && (
                    <div className="empty-panel-state">Chưa có đơn hàng nào.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="panel-footer">
              <button 
                className="btn-full-action"
                onClick={() => {
                  const customer = filteredInsights.find(i => i.userId === trackingUserId);
                  if (customer) openHistoryDrawer(customer);
                }}
              >
                <Clock size={16} /> Xem lịch sử liên hệ
              </button>
            </div>
            </div>
          </>
        )}
      </div>

      {/* Call History Drawer */}
      <div className={`history-drawer ${selectedCustomer ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setSelectedCustomer(null)} />
        <div className="drawer-content">
          <div className="drawer-header">
            <div className="customer-min-info">
              <div className="avatar-sm">
                {selectedCustomer?.user.fullName?.[0] || selectedCustomer?.user.username?.[0]}
              </div>
              <div>
                <h4>{selectedCustomer?.user.fullName || selectedCustomer?.user.username}</h4>
                <p>@{selectedCustomer?.user.username}</p>
              </div>
            </div>
            <button className="close-drawer" onClick={() => setSelectedCustomer(null)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="drawer-body">
            <h3><Clock size={16} /> Lịch sử liên hệ</h3>
            
            {isHistoryLoading ? (
              <div className="drawer-loading">
                <div className="loader-sm"></div>
                <p>Đang tải lịch sử...</p>
              </div>
            ) : (
              <div className="drawer-history-list">
                {callHistory.length > 0 ? (
                  callHistory.map((record) => (
                    <div key={record.id} className="history-record">
                      <div className="record-time">
                        {new Date(record.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="record-note">{record.note}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-history-drawer">
                    Chưa có lịch sử liên hệ.
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedCustomer?.user.phone && (
            <div className="drawer-footer">
              <button 
                className="btn-call-full"
                onClick={() => handleCall(
                  selectedCustomer.user.phone || '', 
                  selectedCustomer.customerId, 
                  selectedCustomer.user.fullName || selectedCustomer.user.username,
                  selectedCustomer.userId
                )}
              >
                <Phone size={18} />
                Gọi ngay: {selectedCustomer.user.phone}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesManagement;

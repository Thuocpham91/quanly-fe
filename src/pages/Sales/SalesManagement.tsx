import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User as UserIcon, 
  Calendar, 
  ShoppingBag, 
  Clock, 
  ChevronRight,
  Filter,
  Phone,
  ArrowUpRight
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
  lastPurchaseDate: Date | null;
  totalOrders: number;
  totalQuantity: number;
  totalAmount: number;
  daysSinceLastPurchase: number | null;
}

const SalesManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | '10_DAYS' | '60_DAYS' | '5_MONTHS' | '8_MONTHS' | 'LONGER'>('ALL');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, ordersRes] = await Promise.all([
        api.get('/users'),
        api.get('/orders')
      ]);

      if (usersRes.data && Array.isArray(usersRes.data.data)) {
        setUsers(usersRes.data.data);
      }
      if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
        setOrders(ordersRes.data.data);
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

  const insights = useMemo(() => {
    const customerMap = new Map<string, CustomerInsight>();

    // Process all users first (we only care about CUSTOMER/USER roles or anyone with an order)
    users.forEach(user => {
      customerMap.set(user.id, {
        userId: user.id,
        user,
        lastPurchaseDate: null,
        totalOrders: 0,
        totalQuantity: 0,
        totalAmount: 0,
        daysSinceLastPurchase: null
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
  }, [users, orders]);

  const filteredInsights = useMemo(() => {
    return insights.filter(i => {
      // Name/Phone Search
      const matchesSearch = 
        (i.user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.user.phone || '').includes(searchTerm);

      if (!matchesSearch) return false;

      // Recency Filter
      const days = i.daysSinceLastPurchase ?? 9999;
      switch (activeFilter) {
        case '10_DAYS': return days <= 10;
        case '60_DAYS': return days <= 60;
        case '5_MONTHS': return days <= 150; // 5 * 30
        case '8_MONTHS': return days <= 240; // 8 * 30
        case 'LONGER': return days > 240;
        default: return true;
      }
    });
  }, [insights, searchTerm, activeFilter]);

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
          <button 
            className={`filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >Tất cả</button>
          <button 
            className={`filter-tab ${activeFilter === '10_DAYS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('10_DAYS')}
          >10 ngày</button>
          <button 
            className={`filter-tab ${activeFilter === '60_DAYS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('60_DAYS')}
          >60 ngày</button>
          <button 
            className={`filter-tab ${activeFilter === '5_MONTHS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('5_MONTHS')}
          >5 tháng</button>
          <button 
            className={`filter-tab ${activeFilter === '8_MONTHS' ? 'active' : ''}`}
            onClick={() => setActiveFilter('8_MONTHS')}
          >8 tháng</button>
          <button 
            className={`filter-tab ${activeFilter === 'LONGER' ? 'active' : ''}`}
            onClick={() => setActiveFilter('LONGER')}
          >Lâu hơn</button>
        </div>
      </div>

      <div className="table-wrapper">
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Đang tải dữ liệu phân tích...</p>
          </div>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
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
                  <tr key={item.userId}>
                    <td>
                      <div className="customer-info">
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
                      <div className="phone-cell">
                        <Phone size={14} />
                        <span>{item.user.phone || '-'}</span>
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
                        onClick={() => navigate(`/admin/users?search=${item.user.username}`)}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="empty-row">
                    Không tìm thấy khách hàng phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesManagement;

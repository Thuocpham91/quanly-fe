import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User as UserIcon,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Hash,
  BadgeCheck,
  Clock
} from 'lucide-react';
import api from '../../api/axios';
import './RevenueManagement.css';

interface CreatorData {
  id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  percentage?: number;
  bankAccountName?: string;
  bankName?: string;
  bankCode?: string;
}

interface OrderData {
  id: string;
  userId: string;
  quantity: number;
  amount?: number;
  status: string;
  orderDate?: string;
  createdById?: string;
  creator?: CreatorData;
}

interface RevenueStats {
  creatorId: string;
  creator: CreatorData;
  totalOrders: number;
  totalQuantity: number;
  totalAmount: number;
  bonusAmount: number;
  isPaid: boolean;
}

const RevenueManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [payouts, setPayouts] = useState<any[]>([]);

  // Modal
  const [selectedStat, setSelectedStat] = useState<RevenueStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Lọc theo Tháng / Năm
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, milestonesRes, usersRes, payoutsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/milestones'),
        api.get('/users'),
        api.get('/monthly-payouts').catch(() => ({ data: { data: [] } }))
      ]);

      if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
        setOrders(ordersRes.data.data);
      }
      if (milestonesRes.data && Array.isArray(milestonesRes.data.data)) {
        const activeMilestones = milestonesRes.data.data.filter((m: any) => m.isActive);
        activeMilestones.sort((a: any, b: any) => b.targetAmount - a.targetAmount);
        setMilestones(activeMilestones);
      }
      if (usersRes.data && Array.isArray(usersRes.data.data)) {
        setUsers(usersRes.data.data);
      }
      if (payoutsRes.data && Array.isArray(payoutsRes.data.data)) {
        setPayouts(payoutsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tính toán doanh thu
  const revenueData = useMemo(() => {
    let validOrders = orders.filter(o => o.status === 'DA_HOAN_THANH');
    
    validOrders = validOrders.filter(o => {
      if (!o.orderDate) return false;
      const orderDate = new Date(o.orderDate);
      return orderDate.getMonth() + 1 === selectedMonth && orderDate.getFullYear() === selectedYear;
    });

    const statsMap = new Map<string, RevenueStats>();

    validOrders.forEach(o => {
      const creatorId = o.createdById || o.creator?.id || 'system';
      const freshUser = users.find(u => u.id === creatorId);
      const creatorData: CreatorData = { ...(o.creator || { id: creatorId, username: 'Hệ thống', fullName: 'Hệ Thống' }) };
      
      if (freshUser) {
        creatorData.percentage = freshUser.percentage;
        creatorData.username = freshUser.username || creatorData.username;
        creatorData.fullName = freshUser.fullName || creatorData.fullName;
        creatorData.bankAccountName = freshUser.bankAccountName;
        creatorData.bankName = freshUser.bankName;
        creatorData.bankCode = freshUser.bankCode;
      } else if (creatorData.percentage == null) {
        creatorData.percentage = 0;
      }

      if (!statsMap.has(creatorId)) {
        // Look up isPaid from payouts list
        const payoutRecord = payouts.find(
          p => p.userId === creatorId && p.month === selectedMonth && p.year === selectedYear
        );
        statsMap.set(creatorId, {
          creatorId,
          creator: creatorData,
          totalOrders: 0,
          totalQuantity: 0,
          totalAmount: 0,
          bonusAmount: 0,
          isPaid: payoutRecord?.isPaid || false,
        });
      }

      const stat = statsMap.get(creatorId)!;
      stat.totalOrders += 1;
      stat.totalQuantity += (Number(o.quantity) || 0);
      
      const orderVal = Number(o.amount) || 0;
      const userPct = creatorData.percentage != null ? Number(creatorData.percentage) : 0;
      stat.totalAmount += orderVal * (userPct / 100);
    });

    for (const stat of statsMap.values()) {
      const matchedMilestone = milestones.find((m: any) => stat.totalAmount >= Number(m.targetAmount));
      if (matchedMilestone) {
        stat.bonusAmount = Number(matchedMilestone.bonusAmount);
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [orders, selectedMonth, selectedYear, milestones, users, payouts]);

  const filteredRevenue = revenueData.filter(stat => 
    stat.creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stat.creator.fullName && stat.creator.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalMonthlyRevenue = filteredRevenue.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalMonthlyOrders = filteredRevenue.reduce((sum, item) => sum + item.totalOrders, 0);

  const openBankModal = (stat: RevenueStats) => {
    setSelectedStat(stat);
    setIsModalOpen(true);
  };

  const handleTogglePaid = async (isPaid: boolean) => {
    if (!selectedStat) return;
    try {
      setIsUpdating(true);
      await api.patch(`/monthly-payouts/${selectedStat.creatorId}/paid?month=${selectedMonth}&year=${selectedYear}`, { isPaid });
      // Update local state immediately
      setSelectedStat(prev => prev ? { ...prev, isPaid } : prev);
      await fetchData();
    } catch (err) {
      console.error('Error updating payout status:', err);
      alert('Có lỗi khi cập nhật trạng thái chi trả!');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="revenue-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Doanh Thu Nhân Viên</h2>
          <p>Thống kê đơn hàng và doanh số đã hoàn thành theo tháng</p>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="summary-icon bg-blue-100 text-blue-600">
            <DollarSign size={24} />
          </div>
          <div className="summary-info">
            <p>Tổng Doanh Thu (Tháng {selectedMonth}/{selectedYear})</p>
            <h3>{totalMonthlyRevenue.toLocaleString('vi-VN')} đ</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon bg-green-100 text-green-600">
            <TrendingUp size={24} />
          </div>
          <div className="summary-info">
            <p>Khối Lượng Giao Dịch</p>
            <h3>{totalMonthlyOrders.toLocaleString('vi-VN')} Giao dịch</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon bg-purple-100 text-purple-600">
            <UserIcon size={24} />
          </div>
          <div className="summary-info">
            <p>Nhân Viên Bán Hàng</p>
            <h3>{filteredRevenue.length} Người</h3>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã nhân viên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="date-filters">
          <div className="filter-group">
            <Calendar size={18} />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large"></div>
            <p>Đang tổng hợp dữ liệu doanh thu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Xếp hạng</th>
                  <th>Nhân Viên (Creator)</th>
                  <th style={{ textAlign: 'center' }}>Số Đơn Hoàn Thành</th>
                  <th style={{ textAlign: 'center' }}>% Tham gia</th>
                  <th style={{ textAlign: 'right' }}>Tổng Số Gà</th>
                  <th style={{ textAlign: 'right' }}>Doanh Thu Thực Tế</th>
                  <th style={{ textAlign: 'right' }}>Thưởng Đạt Được</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRevenue.length > 0 ? (
                  filteredRevenue.map((item, index) => (
                    <tr key={item.creatorId}>
                      <td style={{ textAlign: 'center' }}>
                        <div className={`rank-badge rank-${index + 1}`}>
                          {index + 1}
                        </div>
                      </td>
                      <td>
                        <div className="user-info-cell">
                           <div className="avatar-sm">
                             {item.creator.username?.[0]?.toUpperCase() || 'U'}
                           </div>
                           <div>
                             <div style={{ fontWeight: 600, color: '#0f172a' }}>
                               {item.creator.fullName || item.creator.username}
                             </div>
                             <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                               @{item.creator.username}
                             </div>
                           </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {item.totalOrders} đơn
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#2563eb' }}>
                        {item.creator.percentage != null ? `${item.creator.percentage}%` : '0%'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {item.totalQuantity.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                        {item.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '1.05rem' }}>
                        {item.bonusAmount > 0 ? `+ ${item.bonusAmount.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.isPaid ? (
                          <span className="badge" style={{ backgroundColor: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <BadgeCheck size={12} /> Đã chi trả
                          </span>
                        ) : item.bonusAmount > 0 ? (
                          <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Chờ chi trả
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Không có</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => openBankModal(item)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '5px 12px', borderRadius: '7px', border: '1px solid #e2e8f0',
                            background: '#f8fafc', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            color: '#334155', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#e0f2fe')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
                        >
                          <CreditCard size={13} /> Xem TK
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      <FileSpreadsheet size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Không có dữ liệu doanh thu nào trong Tháng {selectedMonth}/{selectedYear}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Info Modal */}
      {isModalOpen && selectedStat && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Thông Tin Ngân Hàng</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{selectedStat.creator.fullName || selectedStat.creator.username}</div>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {/* Bank Info Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { icon: <UserIcon size={16} />, label: 'Chủ tài khoản', value: selectedStat.creator.bankAccountName || 'Chưa cập nhật', highlight: true },
                { icon: <Building2 size={16} />, label: 'Ngân hàng', value: selectedStat.creator.bankName || 'Chưa cập nhật' },
                { icon: <Hash size={16} />, label: 'Số tài khoản', value: selectedStat.creator.bankCode || 'Chưa cập nhật', mono: true },
                { icon: <span style={{ fontSize: '14px' }}>📞</span>, label: 'Số điện thoại', value: (users.find(u => u.id === selectedStat.creatorId)?.phone) || 'Chưa cập nhật' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#2563eb', flexShrink: 0 }}>{row.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</div>
                    <div style={{ fontWeight: row.highlight ? 700 : 600, color: '#0f172a', marginTop: '2px', fontFamily: row.mono ? 'monospace' : undefined, fontSize: row.mono ? '1rem' : undefined }}>{row.value}</div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: '10px', padding: '1rem', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Số tiền cần chi trả</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d' }}>
                    {(selectedStat.totalAmount + selectedStat.bonusAmount).toLocaleString('vi-VN')} đ
                  </div>
                  {selectedStat.bonusAmount > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>
                      Doanh thu: {selectedStat.totalAmount.toLocaleString('vi-VN')}đ + Thưởng: {selectedStat.bonusAmount.toLocaleString('vi-VN')}đ
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Trạng thái</div>
                  {selectedStat.isPaid ? (
                    <span style={{ background: '#059669', color: '#fff', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <BadgeCheck size={13} /> Đã chi trả
                    </span>
                  ) : (
                    <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Chờ chi trả
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '0.6rem 1.25rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#475569' }}>
                Đóng
              </button>
              {selectedStat.isPaid ? (
                <button
                  onClick={() => handleTogglePaid(false)}
                  disabled={isUpdating}
                  style={{ padding: '0.6rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <X size={14} /> {isUpdating ? 'Đang cập nhật...' : 'Đánh dấu Chưa chi trả'}
                </button>
              ) : (
                <button
                  onClick={() => handleTogglePaid(true)}
                  disabled={isUpdating}
                  style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
                >
                  <BadgeCheck size={14} /> {isUpdating ? 'Đang cập nhật...' : 'Xác nhận Đã chi trả'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManagement;

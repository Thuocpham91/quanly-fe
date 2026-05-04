import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import { Lunar } from 'lunar-javascript';
import { 
  PhoneCall, Target, TrendingUp, DollarSign,
  CheckCircle2, Clock, Users, UserSquare2,
  ShoppingBag, Briefcase, Activity, ArrowUp, ArrowDown, BarChart2
} from 'lucide-react';
import api from '../../api/axios';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [payoutStatus, setPayoutStatus] = useState<any>(null);
  const [todayPrice, setTodayPrice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin-only data
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allWorks, setAllWorks] = useState<any[]>([]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const roleCode = typeof user?.role === 'object' && user?.role !== null
    ? user.role.code?.toUpperCase()
    : typeof user?.role === 'string' ? user.role.toUpperCase() : '';
  const isAdmin = ['ADMIN', 'MANAGER', 'STAFF'].includes(roleCode);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const baseRequests = [
          api.get('/orders'),
          api.get('/milestones'),
          api.get(`/monthly-payouts/status?userId=${user?.id}&month=${currentMonth}&year=${currentYear}`),
          api.get('/chicken-prices/today').catch(() => ({ data: { data: null } }))
        ];

        const adminRequests = isAdmin ? [
          api.get('/users').catch(() => ({ data: { data: [] } })),
          api.get('/customers').catch(() => ({ data: { data: [] } })),
          api.get('/works').catch(() => ({ data: { data: [] } })),
        ] : [];

        const [ordersRes, milestonesRes, payoutRes, priceRes, ...adminRes] = await Promise.all([
          ...baseRequests,
          ...adminRequests
        ]);

        if (priceRes.data?.data) setTodayPrice(priceRes.data.data);

        if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
          const allOrdersData = ordersRes.data.data;
          setAllOrders(allOrdersData);

          const myCompletedOrders = allOrdersData.filter((o: any) => {
            if (o.status !== 'DA_HOAN_THANH') return false;
            const creatorId = o.createdById || o.creator?.id;
            if (creatorId !== user?.id) return false;
            if (!o.orderDate) return false;
            const oDate = new Date(o.orderDate);
            return oDate.getMonth() + 1 === currentMonth && oDate.getFullYear() === currentYear;
          });
          setOrders(myCompletedOrders);
        }

        if (milestonesRes.data && Array.isArray(milestonesRes.data.data)) {
          const actives = milestonesRes.data.data.filter((m: any) => m.isActive);
          actives.sort((a: any, b: any) => a.targetAmount - b.targetAmount);
          setMilestones(actives);
        }
        if (payoutRes.data?.data) setPayoutStatus(payoutRes.data.data);

        if (isAdmin && adminRes.length > 0) {
          if (adminRes[0]?.data?.data) setAllUsers(adminRes[0].data.data);
          if (adminRes[1]?.data?.data) setAllCustomers(adminRes[1].data.data);
          if (adminRes[2]?.data?.data) setAllWorks(adminRes[2].data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) fetchDashboardData();
  }, [user]);

  const PriceBanner = () => (
    <div className="price-banner-container" style={{
      display: 'flex', alignItems: 'center', gap: '1.25rem',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      borderRadius: '20px', padding: '1.25rem 2rem',
      boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)', marginBottom: '2rem',
      color: 'white', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, transform: 'rotate(15deg)' }}>
        <BarChart2 size={120} />
      </div>
      <div style={{ background: 'rgba(255,255,255,0.2)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', backdropFilter: 'blur(4px)', flexShrink: 0 }}>
        🐔
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ecfdf5', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          Giá gà hôm nay • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} ({Lunar.fromDate(new Date()).getDay()}/{Lunar.fromDate(new Date()).getMonth()} ÂL)
        </div>
        {todayPrice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(todayPrice.priceGaSo || todayPrice.priceGaTrong || todayPrice.priceGaMai) ? (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {todayPrice.priceGaSo && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fcd34d', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Gà xô</span>
                    <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900 }}>{Number(todayPrice.priceGaSo).toLocaleString('vi-VN')} <small style={{ fontSize: '0.8rem', fontWeight: 600 }}>đ</small></span>
                  </div>
                )}
                {todayPrice.priceGaTrong && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fcd34d', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Gà trống</span>
                    <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900 }}>{Number(todayPrice.priceGaTrong).toLocaleString('vi-VN')} <small style={{ fontSize: '0.8rem', fontWeight: 600 }}>đ</small></span>
                  </div>
                )}
                {todayPrice.priceGaMai && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fcd34d', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Gà mái</span>
                    <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 900 }}>{Number(todayPrice.priceGaMai).toLocaleString('vi-VN')} <small style={{ fontSize: '0.8rem', fontWeight: 600 }}>đ</small></span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {Number(todayPrice.pricePerKg).toLocaleString('vi-VN')}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d1fae5' }}>VNĐ / KG</span>
              </div>
            )}
            {todayPrice.note && (
              <div style={{ background: 'rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#ecfdf5', width: 'fit-content' }}>
                💡 {todayPrice.note}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: '#ecfdf5', fontStyle: 'italic', fontSize: '1.1rem', marginTop: '0.5rem' }}>Đang chờ cập nhật giá từ trang trại...</div>
        )}
      </div>
    </div>
  );

  // ── USER / CUSTOMER dashboard ──
  if (roleCode === 'USER' || roleCode === 'CUSTOMER' || !roleCode) {
    return (
      <div className="user-dashboard" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#1e293b', marginBottom: '1rem', fontWeight: 800 }}>CHÀO MỪNG ĐẾN VỚI TRANG TRẠI!</h1>
        <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '1.5rem', lineHeight: '1.7' }}>
          Chúng tôi tự hào là đơn vị cung cấp các sản phẩm nông nghiệp và chăn nuôi xuất sắc nhất.
        </p>
        <div style={{ 
          background: 'white', padding: '2.5rem', borderRadius: '24px', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          marginBottom: '2.5rem', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--primary)' }} />
          <div style={{ 
            width: '80px', height: '80px', backgroundColor: '#eff6ff', 
            borderRadius: '24px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1)'
          }}>
            <PhoneCall size={40} />
          </div>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 900 }}>Tổng Đài Hỗ Trợ</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem', fontWeight: 500 }}>Đội ngũ chăm sóc luôn sẵn sàng 24/7 giúp đỡ bạn</p>
          <a href="tel:0974095248" style={{ 
            fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', 
            textDecoration: 'none', background: '#eff6ff', padding: '0.75rem 2.5rem', 
            borderRadius: '20px', transition: 'all 0.3s ease' 
          }} className="support-link-btn">0974 095 248</a>
        </div>
        <PriceBanner />
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', marginBottom: '3rem', border: '4px solid #fff' }}>
          <iframe style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} src="https://www.youtube.com/embed/zH1k0N62pE0" title="Video Giới Thiệu Trang Trại" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </div>
    );
  }

  // ── COLLABORATOR dashboard ──
  const totalRevenue = orders.reduce((sum, o) => {
    const orderVal = Number(o.amount) || 0;
    const orderPct = o.creator?.percentage != null ? Number(o.creator.percentage) : (user?.percentage != null ? Number(user.percentage) : 0);
    return sum + (orderVal * (orderPct / 100));
  }, 0);
  const totalQuantity = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
  let targetMilestone = milestones.find(m => Number(m.targetAmount) > totalRevenue);
  let achievedMilestone = [...milestones].reverse().find(m => totalRevenue >= Number(m.targetAmount));
  const currentBonusAmount = achievedMilestone ? Number(achievedMilestone.bonusAmount) : 0;
  let progressPercentage = 100;
  let nextTargetAmount = 0;
  if (targetMilestone) {
    nextTargetAmount = Number(targetMilestone.targetAmount);
    progressPercentage = (totalRevenue / nextTargetAmount) * 100;
  }
  const isPaid = payoutStatus?.isPaid || false;

  // ── ADMIN dashboard computed values ──
  const todayStr = new Date().toISOString().split('T')[0];
  const totalRevenueAdmin = allOrders
    .filter(o => o.status === 'DA_HOAN_THANH')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const thisMonthOrders = allOrders.filter(o => {
    if (!o.orderDate) return false;
    const d = new Date(o.orderDate);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });
  const lastMonthOrders = allOrders.filter(o => {
    if (!o.orderDate) return false;
    const d = new Date(o.orderDate);
    const lm = currentMonth === 1 ? 12 : currentMonth - 1;
    const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
    return d.getMonth() + 1 === lm && d.getFullYear() === ly;
  });
  const orderGrowth = lastMonthOrders.length > 0
    ? Math.round(((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100) : 0;

  // Today's works progress
  const todayWorks = allWorks.filter(w => {
    if (!w.workDate) return false;
    return new Date(w.workDate).toISOString().split('T')[0] === todayStr;
  });
  const totalTasksToday = todayWorks.reduce((s: number, w: any) => s + (w.workTasks?.length || 0), 0);
  const doneTasks = todayWorks.reduce((s: number, w: any) => s + (w.workTasks?.filter((t: any) => t.employeeChecked).length || 0), 0);
  const todayProgress = totalTasksToday > 0 ? Math.round((doneTasks / totalTasksToday) * 100) : 0;

  const pendingOrders = allOrders.filter(o => o.status === 'CHO_DUYET').length;
  const completedOrders = allOrders.filter(o => o.status === 'DA_HOAN_THANH').length;

  if (isAdmin) {
    return (
      <div className="user-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2>Xin chào, {user?.fullName || user?.username}! 👋</h2>
            <p>Tổng quan hệ thống — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="support-banner" style={{ marginBottom: '2.5rem' }}>
          <div className="support-icon"><PhoneCall size={28} /></div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HỖ TRỢ KỸ THUẬT 24/7</p>
            <p className="support-phone"><a href="tel:0974095248">0974 095 248</a></p>
          </div>
        </div>

        <PriceBanner />

        {isLoading ? (
          <div className="loading-container"><div className="loader-large" /><p>Đang tải dữ liệu...</p></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                {
                  icon: <DollarSign size={22} />, color: '#2563eb', bg: '#eff6ff',
                  label: 'Tổng Doanh Thu', value: `${totalRevenueAdmin.toLocaleString('vi-VN')} đ`,
                  sub: `Tháng ${currentMonth}/${currentYear}`
                },
                {
                  icon: <UserSquare2 size={22} />, color: '#7c3aed', bg: '#f5f3ff',
                  label: 'Tổng Khách Hàng', value: allCustomers.length.toLocaleString(),
                  sub: `${allCustomers.filter(c => c.isActive).length} đang hoạt động`
                },
                {
                  icon: <Users size={22} />, color: '#0891b2', bg: '#ecfeff',
                  label: 'Tổng Người Dùng', value: allUsers.length.toLocaleString(),
                  sub: `${allUsers.filter(u => u.role?.code === 'COLLABORATOR').length} cộng tác viên`
                },
                {
                  icon: <ShoppingBag size={22} />, color: '#d97706', bg: '#fffbeb',
                  label: 'Đơn Hàng Tháng Này', value: thisMonthOrders.length.toLocaleString(),
                  sub: orderGrowth > 0 ? `↑ ${orderGrowth}% so với tháng trước` : orderGrowth < 0 ? `↓ ${Math.abs(orderGrowth)}% so với tháng trước` : 'Không thay đổi',
                  subColor: orderGrowth >= 0 ? '#059669' : '#dc2626'
                },
              ].map((card, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{card.value}</div>
                    <div style={{ fontSize: '0.75rem', color: (card as any).subColor || '#94a3b8', marginTop: '2px' }}>{card.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Order status + Today's work */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Order Status */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Activity size={18} style={{ color: '#2563eb' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Tình Trạng Đơn Hàng</span>
                </div>
                {[
                  { label: 'Chờ duyệt', count: pendingOrders, color: '#d97706', bg: '#fef3c7' },
                  { label: 'Đã hoàn thành', count: completedOrders, color: '#059669', bg: '#dcfce7' },
                  { label: 'Đã hủy', count: allOrders.filter(o => o.status === 'HUY_DON').length, color: '#dc2626', bg: '#fee2e2' },
                  { label: 'Từ chối', count: allOrders.filter(o => o.status === 'TU_CHOI').length, color: '#64748b', bg: '#f1f5f9' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>{row.label}</span>
                    <span style={{ background: row.bg, color: row.color, borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                      {row.count} đơn
                    </span>
                  </div>
                ))}
              </div>

              {/* Today's Work Progress */}
              <div style={{ background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Briefcase size={18} style={{ color: '#7c3aed' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Tiến Độ Công Việc Hôm Nay</span>
                </div>

                {todayWorks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem 0' }}>
                    <Briefcase size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>Không có công việc hôm nay</p>
                  </div>
                ) : (
                  <>
                    {/* Circular progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="40" cy="40" r="34" fill="none" stroke="#7c3aed" strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            strokeDashoffset={`${2 * Math.PI * 34 * (1 - todayProgress / 100)}`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#7c3aed' }}>
                          {todayProgress}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Hoàn thành</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{doneTasks}/{totalTasksToday} nhiệm vụ</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{todayWorks.length} đợt làm việc hôm nay</div>
                      </div>
                    </div>

                    {/* Work list */}
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {todayWorks.slice(0, 3).map((w: any) => {
                        const done = w.workTasks?.filter((t: any) => t.employeeChecked).length || 0;
                        const total = w.workTasks?.length || 0;
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }}>{w.title}</span>
                            <div style={{ width: '60px', background: '#e2e8f0', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, background: '#7c3aed', height: '100%', borderRadius: '999px' }} />
                            </div>
                            <span style={{ color: '#64748b', flexShrink: 0 }}>{pct}%</span>
                          </div>
                        );
                      })}
                      {todayWorks.length > 3 && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>+{todayWorks.length - 3} đợt khác...</div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── COLLABORATOR ──
  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Xin chào, {user?.fullName || user?.username}!</h2>
          <p>Dưới đây là báo cáo doanh thu & KPIs của bạn trong Tháng {currentMonth}/{currentYear}.</p>
        </div>
      </div>

      <div className="support-banner" style={{ marginBottom: '2.5rem' }}>
        <div className="support-icon"><PhoneCall size={28} /></div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HỖ TRỢ KỸ THUẬT 24/7</p>
          <p className="support-phone"><a href="tel:0974095248">0974 095 248</a></p>
        </div>
      </div>

      <PriceBanner />

      {isLoading ? (
        <div className="loading-container"><div className="loader-large" /><p>Đang tổng hợp dữ liệu cá nhân...</p></div>
      ) : (
        <>
          <div className="kpi-cards">
            <div className="kpi-card revenue-card">
              <div className="kpi-icon"><DollarSign size={24} /></div>
              <div className="kpi-content">
                <p>Doanh Thu Thực Tế</p>
                <h3>{totalRevenue.toLocaleString('vi-VN')} đ</h3>
              </div>
            </div>
            <div className="kpi-card target-card">
              <div className="kpi-icon"><Target size={24} /></div>
              <div className="kpi-content">
                <p>Kpi Thưởng Dự Kiến</p>
                <h3 style={{ color: '#059669' }}>+ {currentBonusAmount.toLocaleString('vi-VN')} đ</h3>
              </div>
            </div>
            <div className="kpi-card status-card">
              <div className="kpi-icon">{isPaid ? <CheckCircle2 size={24} /> : <Clock size={24} />}</div>
              <div className="kpi-content">
                <p>Trạng Thái Thưởng</p>
                {isPaid ? (
                  <h3 style={{ color: '#16a34a' }}>Đã Được Thanh Toán</h3>
                ) : (
                  <h3 style={{ color: '#ea580c' }}>Tạm Tính (Ghi Nhận)</h3>
                )}
              </div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <h3><TrendingUp size={24} /> Tiến độ Mục tiêu</h3>
              <span>{Math.min(progressPercentage, 100).toFixed(1)}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-fill" style={{ width: `${Math.min(progressPercentage, 100)}%` }} />
            </div>
            <div className="progress-footer">
              {targetMilestone ? (
                <span>Tiếp tục cố gắng! Bạn cần thêm <strong>{(nextTargetAmount - totalRevenue).toLocaleString('vi-VN')} đ</strong> để đạt mốc thưởng <strong>{Number(targetMilestone.bonusAmount).toLocaleString('vi-VN')} đ</strong>.</span>
              ) : (
                <span style={{ color: 'var(--success)', fontWeight: 800 }}>⭐ Chúc mừng! Bạn đã chinh phục tất cả mốc KPI cao nhất!</span>
              )}
            </div>
            <div className="milestones-track">
              {milestones.map((m, index) => {
                const isPassed = totalRevenue >= Number(m.targetAmount);
                return (
                  <div key={m.id} className={`milestone-point ${isPassed ? 'passed' : ''}`}>
                    <div className="m-point">
                      {isPassed ? <CheckCircle2 size={24} /> : <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#94a3b8' }}>{index + 1}</span>}
                    </div>
                    <div className="m-label">
                      <strong>Mốc {index + 1}</strong>
                      <span>{Number(m.targetAmount).toLocaleString('vi-VN')} đ</span>
                      <span className="m-bonus">+{Number(m.bonusAmount).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Dashboard;

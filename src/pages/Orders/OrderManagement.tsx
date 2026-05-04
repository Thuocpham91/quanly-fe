import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Lunar } from 'lunar-javascript';
import { 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Search, 
  ShoppingBag, 
  Calendar, 
  User as UserIcon,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './OrderManagement.css';

interface UserData {
  id: string;
  username: string;
  fullName?: string;
  phone?: string;
}

interface OrderData {
  id: string;
  userId: string;
  user?: UserData;
  quantity: number;
  unitPrice?: number;
  amount?: number;
  type: string;
  status: string;
  orderDate?: string;
  exportDate?: string;
  saleDate?: string;
  workId?: string;
  creator?: { fullName: string; username: string };
  createdAt: string;
  description?: string;
  gaSo?: number;
  gaTrong?: number;
  gaMai?: number;
  priceGaSo?: number;
  priceGaTrong?: number;
  priceGaMai?: number;
}

const OrderManagement: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [todayPrice, setTodayPrice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  
  // Backend role logic
  const roleCode = typeof user?.role === 'object' && user?.role !== null 
      ? user.role.code?.toUpperCase() 
      : typeof user?.role === 'string' 
        ? user.role.toUpperCase() 
        : '';
  const isCollaborator = roleCode === 'COLLABORATOR';
  const isNormalUser = roleCode === 'USER' || roleCode === 'CUSTOMER';
  const isAdvancedRole = ['ADMIN', 'MANAGER', 'STAFF'].includes(roleCode);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [formData, setFormData] = useState({
    userId: '',
    quantity: '' as string | number,
    gaSo: '' as string | number,
    gaTrong: '' as string | number,
    gaMai: '' as string | number,
    priceGaSo: '' as string | number,
    priceGaTrong: '' as string | number,
    priceGaMai: '' as string | number,
    unitPrice: '' as string | number,
    amount: '' as string | number,
    type: 'MUA_GA',
    status: 'CHO_DUYET',
    orderDate: new Date().toISOString().split('T')[0],
    exportDate: '',
    saleDate: '',
    workId: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, usersRes, worksRes, customersRes, priceRes] = await Promise.all([
        api.get('/orders'),
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/works').catch(() => ({ data: { data: [] } })),
        api.get('/customers').catch(() => ({ data: { data: [] } })),
        api.get('/chicken-prices/today').catch(() => ({ data: { data: null } }))
      ]);
      if (priceRes.data?.data) setTodayPrice(priceRes.data.data);

      if (ordersRes.data && Array.isArray(ordersRes.data.data)) {
        setOrders(ordersRes.data.data);
      }
      if (usersRes?.data && Array.isArray(usersRes.data.data)) {
        setUsers(usersRes.data.data);
      }
      if (worksRes?.data && Array.isArray(worksRes.data.data)) {
        setWorks(worksRes.data.data);
      }
      if (customersRes?.data && Array.isArray(customersRes.data.data)) {
        setCustomersList(customersRes.data.data);
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

  const formatNumber = (val: string | number) => {
    if (!val && val !== 0) return '';
    const numString = String(val).replace(/\D/g, '');
    return numString ? Number(numString).toLocaleString('vi-VN') : '';
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    handleInputChange({ target: { name, value: rawVal } } as any);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'workId' && value) {
      const selectedWork = works.find(w => w.id === value);
      if (selectedWork) {
        setCapacityWarning('');
        const currentTotal = Number(selectedWork.purchaseQuantity) || 0;
        const capacity = Number(selectedWork.quantity) || 0;
        const orderQuantity = Number(formData.quantity) || 0;
        
        const oldQuantity = editingOrder?.workId === value ? Number(editingOrder.quantity) : 0;
        const projectedTotal = currentTotal - oldQuantity + orderQuantity;

        if (projectedTotal > capacity) {
          setCapacityWarning(`Cảnh báo: Đợt nuôi này chỉ có ${capacity} gà, nhưng tổng lượng đặt hàng sẽ lên tới ${projectedTotal} gà.`);
        }

        if (selectedWork.exportDate) {
          setFormData(prev => ({
            ...prev,
            workId: value,
            exportDate: new Date(selectedWork.exportDate).toISOString().split('T')[0]
          }));
          return;
        }
      }
    } else if (name === 'quantity') {
      const orderQuantity = Number(value) || 0;
      if (formData.workId) {
        const selectedWork = works.find(w => w.id === formData.workId);
        if (selectedWork) {
          const currentTotal = Number(selectedWork.purchaseQuantity) || 0;
          const capacity = Number(selectedWork.quantity) || 0;
          const oldQuantity = editingOrder?.workId === formData.workId ? Number(editingOrder.quantity) : 0;
          const projectedTotal = currentTotal - oldQuantity + orderQuantity;

          if (projectedTotal > capacity) {
            setCapacityWarning(`Cảnh báo: Đợt nuôi này chỉ có ${capacity} gà, nhưng tổng lượng đặt hàng sẽ lên tới ${projectedTotal} gà.`);
          } else {
            setCapacityWarning('');
          }
        }
      }
    }
    
    setFormData((prev) => {
      const nextState = { ...prev, [name]: value };
      
      // Auto-calculate quantity from chicken types if any change
      if (['gaSo', 'gaTrong', 'gaMai', 'priceGaSo', 'priceGaTrong', 'priceGaMai'].includes(name)) {
        const s = name === 'gaSo' ? Number(value) : Number(nextState.gaSo);
        const t = name === 'gaTrong' ? Number(value) : Number(nextState.gaTrong);
        const m = name === 'gaMai' ? Number(value) : Number(nextState.gaMai);
        
        // Auto-populate prices from todayPrice if adding quantity for the first time
        if (name === 'gaSo' && value && !nextState.priceGaSo && todayPrice?.priceGaSo) {
          nextState.priceGaSo = todayPrice.priceGaSo;
        }
        if (name === 'gaTrong' && value && !nextState.priceGaTrong && todayPrice?.priceGaTrong) {
          nextState.priceGaTrong = todayPrice.priceGaTrong;
        }
        if (name === 'gaMai' && value && !nextState.priceGaMai && todayPrice?.priceGaMai) {
          nextState.priceGaMai = todayPrice.priceGaMai;
        }

        const ps = name === 'priceGaSo' ? Number(value) : Number(nextState.priceGaSo);
        const pt = name === 'priceGaTrong' ? Number(value) : Number(nextState.priceGaTrong);
        const pm = name === 'priceGaMai' ? Number(value) : Number(nextState.priceGaMai);

        const total = (s || 0) + (t || 0) + (m || 0);
        if (total > 0 && ['gaSo', 'gaTrong', 'gaMai'].includes(name)) {
          nextState.quantity = total;
        }

        // Calculate amount from specific prices if any are present
        if (ps || pt || pm) {
          const calculatedAmount = (s * ps) + (t * pt) + (m * pm);
          if (calculatedAmount > 0) {
            nextState.amount = calculatedAmount;
            // Also update main unitPrice as a weighted average if total quantity exist
            if (total > 0) {
              nextState.unitPrice = Math.round(calculatedAmount / total);
            }
          }
        }
      }

      if (name === 'quantity' || name === 'unitPrice') {
         const q = Number(nextState.quantity);
         const p = Number(nextState.unitPrice);
         // Only auto-calc amount from q*p if NOT using per-type pricing
         const hasPerTypePricing = Number(nextState.priceGaSo) || Number(nextState.priceGaTrong) || Number(nextState.priceGaMai);
         if (q > 0 && p > 0 && !hasPerTypePricing) {
            nextState.amount = q * p;
         }
      }
      return nextState;
    });
  };

  const getUnifiedList = () => {
    return isCollaborator 
      ? customersList.map(c => ({
          id: c.userCustomId,
          fullName: c.name,
          username: c.phone || '',
          phone: c.phone || ''
        }))
      : users;
  };

  const openAddModal = () => {
    setEditingOrder(null);
    setFormData({
      userId: isNormalUser && user ? user.id : '',
      quantity: '',
      gaSo: '',
      gaTrong: '',
      gaMai: '',
      priceGaSo: '',
      priceGaTrong: '',
      priceGaMai: '',
      unitPrice: '',
      amount: '',
      type: isCollaborator || isNormalUser ? 'DAT_GA' : 'MUA_GA',
      status: 'CHO_DUYET',
      orderDate: new Date().toISOString().split('T')[0],
      exportDate: '',
      saleDate: '',
      workId: '',
      description: ''
    });
    setCustomerSearchInput('');
    setError('');
    setCapacityWarning('');
    setIsModalOpen(true);
  };

  const openEditModal = (order: OrderData) => {
    setEditingOrder(order);
    
    const unified = getUnifiedList();
    const existingUser = unified.find(u => u.id === order.userId);
    
    setCustomerSearchInput(existingUser 
      ? `${existingUser.phone ? existingUser.phone + ' - ' : ''}${existingUser.fullName || existingUser.username}` 
      : order.user?.username || order.userId);

    setFormData({
      userId: order.userId,
      quantity: order.quantity,
      gaSo: order.gaSo || '',
      gaTrong: order.gaTrong || '',
      gaMai: order.gaMai || '',
      priceGaSo: order.priceGaSo || '',
      priceGaTrong: order.priceGaTrong || '',
      priceGaMai: order.priceGaMai || '',
      unitPrice: order.unitPrice || '',
      amount: order.amount || '',
      type: order.type,
      status: order.status,
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
      exportDate: order.exportDate ? new Date(order.exportDate).toISOString().split('T')[0] : '',
      saleDate: order.saleDate ? new Date(order.saleDate).toISOString().split('T')[0] : '',
      workId: order.workId || '',
      description: order.description || ''
    });
    setError('');
    setCapacityWarning('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('Form data before validation:', formData);
    
    // More robust validation
    if (!formData.userId || !formData.userId.trim()) {
      setError('Vui lòng chọn khách hàng!');
      console.log('Validation failed: userId is empty');
      return;
    }
    
    const quantityNum = Number(String(formData.quantity).replace(/\D/g, ''));
    if (!quantityNum || quantityNum <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ (lớn hơn 0)!');
      console.log('Validation failed: quantity is invalid', formData.quantity, quantityNum);
      return;
    }
    
    if (!formData.orderDate || !formData.orderDate.trim()) {
      setError('Vui lòng chọn ngày đặt hàng!');
      console.log('Validation failed: orderDate is empty');
      return;
    }

    console.log('Validation passed, submitting...');

    try {
      setIsSubmitting(true);
      
      const payload = {
        userId: formData.userId,
        quantity: quantityNum,
        gaSo: formData.gaSo ? Number(formData.gaSo) : 0,
        gaTrong: formData.gaTrong ? Number(formData.gaTrong) : 0,
        gaMai: formData.gaMai ? Number(formData.gaMai) : 0,
        priceGaSo: formData.priceGaSo ? Number(formData.priceGaSo) : 0,
        priceGaTrong: formData.priceGaTrong ? Number(formData.priceGaTrong) : 0,
        priceGaMai: formData.priceGaMai ? Number(formData.priceGaMai) : 0,
        unitPrice: formData.unitPrice ? Number(String(formData.unitPrice).replace(/\D/g, '')) : undefined,
        amount: formData.amount ? Number(String(formData.amount).replace(/\D/g, '')) : undefined,
        type: formData.type,
        status: formData.status,
        orderDate: new Date(formData.orderDate).toISOString(),
        exportDate: formData.exportDate ? new Date(formData.exportDate).toISOString() : null,
        saleDate: formData.saleDate ? new Date(formData.saleDate).toISOString() : null,
        workId: formData.workId || null,
        description: formData.description || undefined
      };

      if (editingOrder) {
        await api.put(`/orders/${editingOrder.id}`, payload);
      } else {
        await api.post('/orders', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving order:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (order: OrderData) => {
    const isRestricted = isNormalUser || isCollaborator;
    const blockedStatuses = ['DA_HOAN_THANH', 'DA_DUYET'];

    if (isRestricted && blockedStatuses.includes(order.status)) {
      const label = order.status === 'DA_HOAN_THANH' ? 'đã hoàn thành' : 'đã được duyệt';
      alert(`Không thể thao tác trên đơn hàng ${label}!`);
      return;
    }

    const confirmMsg = isRestricted
      ? 'Bạn có chắc chắn muốn HỦY đơn hàng này?'
      : 'Bạn có chắc chắn muốn XÓA đơn hàng này?';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.delete(`/orders/${order.id}`);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa/hủy đơn hàng.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DA_HOAN_THANH':
        return <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}><CheckCircle2 size={12} /> Hoàn thành</span>;
      case 'DA_DUYET':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Đã duyệt</span>;
      case 'TU_CHOI':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Từ chối</span>;
      case 'HUY_DON':
        return <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}><X size={12} /> Đã hủy</span>;
      default:
        return <span className="badge badge-warning"><Clock size={12} /> Chờ duyệt</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MUA_GA': return 'Mua gà';
      case 'DAT_GA': return 'Đặt gà';
      default: return type;
    }
  };

  const filteredOrders = orders.filter(o => 
    (o.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toString().includes(searchTerm)
  );

    const unifiedDataSource = isCollaborator 
      ? customersList.map(c => ({
          id: c.userCustomId,          // Map system linked user ID 
          fullName: c.name,
          username: c.phone || '',
          phone: c.phone || ''
        }))
      : users;

  return (
    <div className="order-page-container">
      {/* Chicken Price Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        background: 'linear-gradient(135deg, #16a34a 0%, #065f46 100%)',
        borderRadius: '12px', padding: '0.75rem 1.25rem',
        boxShadow: '0 4px 16px rgba(22,163,74,0.2)', marginBottom: '1.25rem'
      }}>
        <span style={{ fontSize: '1.6rem' }}>🐔</span>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Giá gà hôm nay • {new Date().toLocaleDateString('vi-VN')} ({Lunar.fromDate(new Date()).getDay()}/{Lunar.fromDate(new Date()).getMonth()} ÂL)
          </div>
          {todayPrice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {/* If we have breakdown prices, show them prominently */}
              {(todayPrice.priceGaSo || todayPrice.priceGaTrong || todayPrice.priceGaMai) ? (
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {todayPrice.priceGaSo && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà xô</span>
                      <span style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>{Number(todayPrice.priceGaSo).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {todayPrice.priceGaTrong && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà trống</span>
                      <span style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>{Number(todayPrice.priceGaTrong).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {todayPrice.priceGaMai && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà mái</span>
                      <span style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>{Number(todayPrice.priceGaMai).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback if no breakdown exists */
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {Number(todayPrice.pricePerKg).toLocaleString('vi-VN')}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#86efac' }}>đ/kg</span>
                </div>
              )}

              {todayPrice.note && (
                <span style={{ color: '#bbf7d0', fontSize: '0.7rem', fontStyle: 'italic' }}>• {todayPrice.note}</span>
              )}
            </div>
          ) : (
            <span style={{ color: '#bbf7d0', fontStyle: 'italic', fontSize: '0.9rem' }}>Chưa cập nhật giá hôm nay</span>
          )}
        </div>
      </div>

      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Đơn Hàng</h2>
          <p>Theo dõi và quản lý các giao dịch mua hàng</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Tạo Đơn Hàng</span>
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo khách hàng hoặc mã đơn..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  <th>Mã Đơn</th>
                  {!isNormalUser && <th>Khách Hàng</th>}
                  {!isNormalUser && <th>Người Tạo</th>}
                  <th>Loại Đơn</th>
                  <th>Số Lượng</th>
                  <th>Đơn Giá</th>
                  <th>Tổng Tiền</th>
                  <th>Ngày Đặt</th>
                  <th>Ngày Xuất</th>
                  <th>Ngày Bán</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(order)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => handleDelete(order)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <Link to={`/orders/${order.id}`} className="order-id-link">
                          <span className="order-id">#{order.id}</span>
                        </Link>
                      </td>
                      {!isNormalUser && (
                        <td>
                          <div className="user-info-cell">
                            <UserIcon size={16} />
                            <span>{order.user?.username || 'N/A'}</span>
                          </div>
                        </td>
                      )}
                      {!isNormalUser && (
                        <td>
                          <div className="user-info-cell">
                             <UserIcon size={14} />
                             <span>{order.creator?.fullName || order.creator?.username || 'Hệ thống'}</span>
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="type-cell">
                          <Tag size={14} />
                          <span>{getTypeLabel(order.type)}</span>
                        </div>
                      </td>
                      <td className="quantity-cell">{order.quantity.toLocaleString('vi-VN')}</td>
                      <td style={{ color: '#059669', fontWeight: 500 }}>{order.unitPrice ? order.unitPrice.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{order.amount ? order.amount.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell" style={{ color: '#059669', fontWeight: 600 }}>
                          <Calendar size={14} />
                          <span>{order.exportDate ? new Date(order.exportDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell" style={{ color: '#2563eb', fontWeight: 600 }}>
                          <Calendar size={14} />
                          <span>{order.saleDate ? new Date(order.saleDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="empty-state">Không tìm thấy đơn hàng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingOrder ? 'Chỉnh Sửa Đơn Hàng' : 'Tạo Đơn Hàng Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                
                {!isNormalUser && (
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label>Khách Hàng ({isCollaborator ? 'Chọn từ danh sách' : 'Nhập SĐT hoặc Chọn'}) *</label>
                    <input 
                      type="text" 
                      placeholder="Click hoặc gõ SĐT/Tên..."
                      value={customerSearchInput}
                      onChange={(e) => {
                        setCustomerSearchInput(e.target.value);
                        setShowCustomerDropdown(true);
                        
                        // Auto-select if exact match
                        const val = e.target.value;
                        const unified = getUnifiedList();
                        const found = unified.find(u => u.phone === val || u.fullName === val || u.username === val);
                        if (found) {
                          setFormData(prev => ({ ...prev, userId: found.id }));
                        } else {
                          setFormData(prev => ({ ...prev, userId: '' }));
                        }
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      // Use a small delay for onBlur so the onClick on the dropdown item can fire
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      required={!formData.userId}
                      style={{
                         width: '100%',
                         padding: '0.625rem',
                         border: '1px solid #e2e8f0',
                         borderRadius: '6px'
                      }}
                    />
                    {showCustomerDropdown && (
                      <div style={{
                         position: 'absolute', 
                         top: '100%', 
                         left: 0, 
                         right: 0, 
                         maxHeight: '200px', 
                         overflowY: 'auto', 
                         background: '#fff', 
                         border: '1px solid #e2e8f0', 
                         zIndex: 10, 
                         borderRadius: '6px',
                         boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {getUnifiedList().filter(u => 
                          !customerSearchInput || 
                          (u.phone && u.phone.includes(customerSearchInput)) || 
                          (u.fullName && u.fullName.toLowerCase().includes(customerSearchInput.toLowerCase())) ||
                          (u.username && u.username.toLowerCase().includes(customerSearchInput.toLowerCase()))
                        ).map(u => (
                          <div 
                            key={u.id} 
                            style={{ 
                              padding: '10px 12px', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid #f1f5f9',
                              fontSize: '0.875rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, userId: u.id }));
                              setCustomerSearchInput(`${u.phone ? u.phone + ' - ' : ''}${u.fullName || u.username}`);
                              setShowCustomerDropdown(false);
                            }}
                          >
                             {u.phone ? <strong>{u.phone}</strong> : null} {u.phone ? '- ' : ''}<span>{u.fullName || u.username}</span>
                          </div>
                        ))}
                        {getUnifiedList().filter(u => 
                          !customerSearchInput || 
                          (u.phone && u.phone.includes(customerSearchInput)) || 
                          (u.fullName && u.fullName.toLowerCase().includes(customerSearchInput.toLowerCase())) ||
                          (u.username && u.username.toLowerCase().includes(customerSearchInput.toLowerCase()))
                        ).length === 0 && (
                          <div style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                             Không tìm thấy khách hàng phù hợp...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isAdvancedRole && (
                  <div className="form-group">
                    <label>Liên kết Ngày Xuất Gà (Từ Module Work)</label>
                    <select name="workId" value={formData.workId} onChange={handleInputChange}>
                      <option value="">-- Chọn đợt nuôi để lấy ngày xuất --</option>
                      {works.map(w => (
                        <option key={w.id} value={w.id}>
                          {new Date(w.exportDate).toLocaleDateString('vi-VN')} - {w.title} (SL: {w.quantity})
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      * Chọn đợt nuôi gà sẽ tự động điền Ngày Xuất Hàng.
                    </p>
                    {capacityWarning && (
                      <div className="warning-message" style={{ 
                        backgroundColor: '#fff7ed', 
                        color: '#c2410c', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        marginTop: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        border: '1px solid #ffedd5'
                      }}>
                        <AlertCircle size={16} />
                        {capacityWarning}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '12px', 
                  marginBottom: '1.25rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    color: '#64748b', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={16} /> Chi tiết theo loại gà
                    </div>
                    {todayPrice && (
                      <span style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                        * Đang áp dụng giá hôm nay
                      </span>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isAdvancedRole ? '1fr 1fr' : '1fr', 
                    gap: '1.5rem' 
                  }}>
                    <div className="chicken-type-column">
                      <h5 style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#94a3b8' }}>
                        SỐ LƯỢNG (Con) {!isAdvancedRole && ' - Quản trị viên sẽ cập nhật giá sau'}
                      </h5>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Gà sô</label>
                        <input
                          type="text"
                          name="gaSo"
                          value={formatNumber(formData.gaSo)}
                          onChange={(e) => handleNumberChange(e, 'gaSo')}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Gà trống</label>
                        <input
                          type="text"
                          name="gaTrong"
                          value={formatNumber(formData.gaTrong)}
                          onChange={(e) => handleNumberChange(e, 'gaTrong')}
                          placeholder="0"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.7rem' }}>Gà mái</label>
                        <input
                          type="text"
                          name="gaMai"
                          value={formatNumber(formData.gaMai)}
                          onChange={(e) => handleNumberChange(e, 'gaMai')}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {isAdvancedRole && (
                      <div className="chicken-price-column">
                        <h5 style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#94a3b8' }}>ĐƠN GIÁ (đ/con)</h5>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.7rem' }}>Giá Gà sô</label>
                          <input
                            type="text"
                            name="priceGaSo"
                            value={formatNumber(formData.priceGaSo)}
                            onChange={(e) => handleNumberChange(e, 'priceGaSo')}
                            placeholder="0"
                            style={{ color: '#16a34a', fontWeight: 600 }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.7rem' }}>Giá Gà trống</label>
                          <input
                            type="text"
                            name="priceGaTrong"
                            value={formatNumber(formData.priceGaTrong)}
                            onChange={(e) => handleNumberChange(e, 'priceGaTrong')}
                            placeholder="0"
                            style={{ color: '#16a34a', fontWeight: 600 }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.7rem' }}>Giá Gà mái</label>
                          <input
                            type="text"
                            name="priceGaMai"
                            value={formatNumber(formData.priceGaMai)}
                            onChange={(e) => handleNumberChange(e, 'priceGaMai')}
                            placeholder="0"
                            style={{ color: '#16a34a', fontWeight: 600 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại Đơn Hàng *</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} required>
                      {isAdvancedRole && <option value="MUA_GA">Mua gà (Giao ngay)</option>}
                      <option value="DAT_GA">Đặt gà (Chờ xuất)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tổng Số Lượng *</label>
                    <input
                      type="text"
                      name="quantity"
                      value={formatNumber(formData.quantity)}
                      onChange={(e) => handleNumberChange(e, 'quantity')}
                      placeholder="VD: 100"
                      required
                      style={{ 
                        backgroundColor: (formData.gaSo || formData.gaTrong || formData.gaMai) ? '#f1f5f9' : '#fff',
                        fontWeight: (formData.gaSo || formData.gaTrong || formData.gaMai) ? 700 : 400
                      }}
                      title={(formData.gaSo || formData.gaTrong || formData.gaMai) ? "Tự động tính từ chi tiết loại gà" : ""}
                    />
                  </div>
                  
                  {isAdvancedRole && (
                    <div className="form-group">
                      <label>Đơn Giá (VNĐ)</label>
                      <input
                        type="text"
                        name="unitPrice"
                        value={formatNumber(formData.unitPrice)}
                        onChange={(e) => handleNumberChange(e, 'unitPrice')}
                        placeholder="VD: 50.000"
                      />
                    </div>
                  )}
                </div>

                {isAdvancedRole && (
                  <div className="form-group">
                      <label>Tổng Tiền (Thành Tiền)</label>
                      <input
                        type="text"
                        name="amount"
                        value={formatNumber(formData.amount)}
                        onChange={(e) => handleNumberChange(e, 'amount')}
                        placeholder="VD: 5.000.000"
                      />
                  </div>
                )}

                <div className="form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e: any) => handleInputChange(e)}
                    placeholder="Nhập ghi chú, địa chỉ giao hàng, mô tả đơn hàng..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày Đặt Hàng *</label>
                    <input
                      type="date"
                      name="orderDate"
                      value={formData.orderDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  {isAdvancedRole && (
                    <>
                      <div className="form-group">
                        <label>Ngày Xuất Hàng</label>
                        <input
                          type="date"
                          name="exportDate"
                          value={formData.exportDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Ngày Bán</label>
                        <input
                          type="date"
                          name="saleDate"
                          value={formData.saleDate}
                          onChange={handleInputChange}
                          min={formData.exportDate || undefined}
                        />
                      </div>
                    </>
                  )}
                </div>

                {isAdvancedRole && (
                  <div className="form-group">
                    <label>Trạng Thái</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="CHO_DUYET">Chờ duyệt</option>
                      <option value="DA_DUYET">Đã duyệt</option>
                      <option value="DA_HOAN_THANH">Đã hoàn thành</option>
                      <option value="TU_CHOI">Từ chối</option>
                      <option value="HUY_DON">Đã hủy</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Đơn Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

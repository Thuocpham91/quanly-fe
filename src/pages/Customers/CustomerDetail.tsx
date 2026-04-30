import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, Mail, MapPin, Clock, FileText, Edit2, X, Share2, Users } from 'lucide-react';
import api from '../../api/axios';
import './CustomerDetail.css';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
  isActive: boolean;
  isSelfCustomer: boolean;
  createdAt?: string;
  userId?: string;
  editorIds?: string[];
}

interface UserData {
  id: string;
  fullName: string;
  username: string;
}

interface CallHistory {
  id: string;
  customerId: string;
  createdAt: string;
  note: string;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [history, setHistory] = useState<CallHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedEditorIds, setSelectedEditorIds] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [customerRes, historyRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/call-histories?customerId=${id}`)
      ]);

      if (customerRes.data && customerRes.data.data) {
        const custData = customerRes.data.data;
        setCustomer(custData);
        setSelectedEditorIds(custData.editorIds || []);
      } else if (customerRes.data) {
        setCustomer(customerRes.data);
        setSelectedEditorIds(customerRes.data.editorIds || []);
      }

      if (historyRes.data && Array.isArray(historyRes.data.data)) {
        setHistory(historyRes.data.data);
      } else if (Array.isArray(historyRes.data)) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.error('Error fetching customer detail:', err);
      setError('Không thể tải thông tin khách hàng hoặc lịch sử cuộc gọi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleCall = async () => {
    if (!customer?.phone) {
      alert('Khách hàng này không có số điện thoại!');
      return;
    }

    try {
      setIsCalling(true);
      
      // Save call history record
      await api.post('/call-histories', {
        customerId: id,
        note: `Cuộc gọi đi từ trang chi tiết khách hàng: ${customer.name}`
      });

      // Trigger actual call
      window.location.href = `tel:${customer.phone}`;
      
      // Refresh history list
      const historyRes = await api.get(`/call-histories?customerId=${id}`);
      if (historyRes.data && Array.isArray(historyRes.data.data)) {
        setHistory(historyRes.data.data);
      } else if (Array.isArray(historyRes.data)) {
        setHistory(historyRes.data);
      }
    } catch (err) {
      console.error('Error saving call history:', err);
      // Still allow the call even if history saving fails
      window.location.href = `tel:${customer.phone}`;
    } finally {
      setIsCalling(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await api.post(`/customers/${id}/share`, { editorIds: selectedEditorIds });
      setIsShareModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error sharing customer:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cấp quyền.');
    } finally {
      setIsSharing(false);
    }
  };

  const openShareModal = async () => {
    setIsShareModalOpen(true);
    if (allUsers.length === 0) {
      try {
        const res = await api.get('/users');
        if (res.data && Array.isArray(res.data.data)) {
          setAllUsers(res.data.data);
        } else if (Array.isArray(res.data)) {
          setAllUsers(res.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    }
  };

  const toggleEditor = (userId: string) => {
    setSelectedEditorIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const openEditModal = () => {
    if (!customer) return;
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      note: customer.note || '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Vui lòng nhập Tên khách hàng.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        note: formData.note || undefined,
      };

      await api.put(`/customers/${id}`, payload);
      setIsModalOpen(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Error updating customer:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu khách hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader-large"></div>
        <p>Đang tải thông tin khách hàng...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-detail-container">
        <div className="error-state">
           <h3>Không tìm thấy thông tin khách hàng</h3>
           <button className="btn-primary" onClick={() => navigate('/customers')}>Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-detail-container">
      <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="back-btn" onClick={() => navigate('/customers')}>
          <ArrowLeft size={18} /> Quay lại danh sách
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={openShareModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#f8fafc' }}>
            <Share2 size={18} /> Cấp quyền
          </button>
          <button className="btn-secondary" onClick={openEditModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Edit2 size={18} /> Sửa thông tin
          </button>
        </div>
      </div>

      <div className="customer-info-card">
        <div className="info-main">
          <h2>{customer.name}</h2>
          <div className="customer-id">Mã khách hàng: #{customer.id}</div>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="label"><Phone size={12} /> Điện thoại</span>
              <span className="value">
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                    {customer.phone}
                  </a>
                ) : 'Chưa cập nhật'}
              </span>
            </div>
            <div className="info-item">
              <span className="label"><Mail size={12} /> Email</span>
              <span className="value">{customer.email || 'Chưa cập nhật'}</span>
            </div>
            <div className="info-item">
              <span className="label"><MapPin size={12} /> Địa chỉ</span>
              <span className="value">{customer.address || 'Chưa cập nhật'}</span>
            </div>
            <div className="info-item">
              <span className="label"><Calendar size={12} /> Ngày tham gia</span>
              <span className="value">
                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="actions-panel">
          <button 
            className="call-btn" 
            onClick={handleCall}
            disabled={isCalling || !customer.phone}
          >
            <Phone size={20} fill="white" />
            {isCalling ? 'Đang xử lý...' : 'GỌI NGAY'}
          </button>
        </div>
      </div>

      {customer.note && (
        <div className="history-section" style={{ marginBottom: '2rem' }}>
           <h3 className="section-title"><FileText size={18} /> Ghi chú khách hàng</h3>
           <p style={{ color: '#475569', lineHeight: 1.6 }}>{customer.note}</p>
        </div>
      )}

      <div className="history-section">
        <h3 className="section-title"><Clock size={18} /> Lịch sử liên hệ</h3>
        
        <div className="history-list">
          {history.length > 0 ? (
            history.map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-icon">
                  <Phone size={18} />
                </div>
                <div className="history-content">
                  <div className="history-time">
                    {new Date(record.createdAt).toLocaleString('vi-VN')}
                  </div>
                  <div className="history-note">{record.note}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-history">
              Chưa có lịch sử cuộc gọi nào cho khách hàng này.
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Chỉnh sửa khách hàng</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group-modal">
                  <label>Tên khách hàng *</label>
                  <input name="name" type="text" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group-modal">
                  <label>Điện thoại</label>
                  <input name="phone" type="text" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="form-group-modal">
                  <label>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group-modal">
                  <label>Địa chỉ</label>
                  <input name="address" type="text" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-group-modal">
                  <label>Ghi chú</label>
                  <textarea name="note" value={formData.note} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Cấp quyền chỉnh sửa</h3>
              <button className="close-btn" onClick={() => setIsShareModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                Chọn những người dùng được phép chỉnh sửa hồ sơ khách hàng này.
              </p>
              <div className="user-selection-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {allUsers.length > 0 ? (
                  allUsers.filter(u => u.id !== customer?.userId).map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => toggleEditor(u.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.75rem', 
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        backgroundColor: selectedEditorIds.includes(u.id) ? '#eff6ff' : 'transparent'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedEditorIds.includes(u.id)} 
                        onChange={() => {}} // Handled by div click
                        style={{ marginRight: '0.75rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{u.username}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách người dùng...</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsShareModalOpen(false)}>Hủy</button>
              <button type="button" className="btn-primary" onClick={handleShare} disabled={isSharing}>
                {isSharing ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;

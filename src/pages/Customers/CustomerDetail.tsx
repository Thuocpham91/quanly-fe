import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, Mail, MapPin, Clock, FileText } from 'lucide-react';
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [customerRes, historyRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/call-histories?customerId=${id}`)
      ]);

      if (customerRes.data && customerRes.data.data) {
        setCustomer(customerRes.data.data);
      } else if (customerRes.data) {
          setCustomer(customerRes.data);
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
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/customers')}>
          <ArrowLeft size={18} /> Quay lại danh sách
        </button>
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
    </div>
  );
};

export default CustomerDetail;

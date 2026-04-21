import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Edit2, Trash2, Plus, Eye } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './CustomerManagement.css';

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

const CustomerManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/customers');
      const data = response.data;
      if (data && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Không thể tải danh sách khách hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      note: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: CustomerData) => {
    setEditingCustomer(customer);
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

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: unknown) {
      console.error('Error saving customer:', err);
      const errorMessage = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : 'Có lỗi xảy ra khi lưu khách hàng.';
      setError(errorMessage || 'Có lỗi xảy ra khi lưu khách hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;

    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Có lỗi xảy ra khi xóa khách hàng.');
    }
  };

  return (
    <div className="object-page-container">
      <div className="page-header">
        <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2>Quản lý Khách hàng</h2>
            <p>Quản lý danh sách khách hàng, thông tin liên hệ và trạng thái.</p>
          </div>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} />
            <span>Tạo Khách Hàng</span>
          </button>
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
                  <th>ID</th>
                  <th>Tên khách hàng</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Địa chỉ</th>
                  <th>Ghi chú</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '160px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{customer.name}</div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.address || '-'}</td>
                      <td>{customer.note || '-'}</td>
                      <td>
                        <span className={`type-badge ${customer.isSelfCustomer ? 'type-self' : 'type-normal'}`}>
                          {customer.isSelfCustomer ? 'Tự động' : 'Thường'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${customer.isActive ? 'status-active' : 'status-inactive'}`}>
                          {customer.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                            title="Chi tiết"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                            title="Sửa"
                            onClick={() => openEditModal(customer)}
                            disabled={customer.isSelfCustomer}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '0.4rem', borderRadius: '4px', color: '#ef4444' }}
                            title="Xóa"
                            onClick={() => handleDelete(customer.id)}
                            disabled={customer.isSelfCustomer}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      Chưa có khách hàng nào. Hãy thêm mới!
                    </td>
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
              <h3>Chỉnh sửa khách hàng</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group-modal">
                  <label htmlFor="name">Tên khách hàng *</label>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group-modal">
                  <label htmlFor="phone">Điện thoại</label>
                  <input id="phone" name="phone" type="text" value={formData.phone} onChange={handleInputChange} placeholder="VD: 0912345678" />
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    * Nhập SĐT để tự động liên kết hoặc tạo mới tài khoản đăng nhập cho KH (Nếu chưa có).
                  </p>
                </div>
                <div className="form-group-modal">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group-modal">
                  <label htmlFor="address">Địa chỉ</label>
                  <input id="address" name="address" type="text" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-group-modal">
                  <label htmlFor="note">Ghi chú</label>
                  <input id="note" name="note" type="text" value={formData.note} onChange={handleInputChange} />
                </div>
                {error && <p className="form-error">{error}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;

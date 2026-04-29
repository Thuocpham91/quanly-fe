import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Search, Filter, Calendar, CreditCard, Info } from 'lucide-react';
import api from '../../api/axios';
import './ExpenseManagement.css';

interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  category: string;
  workId?: string;
  work?: {
    title: string;
    object?: { name: string };
  };
  description?: string;
  createdAt: string;
}

interface WorkData {
  id: string;
  title: string;
  object?: { name: string };
}

const CATEGORIES = [
  'Cám / Thức ăn',
  'Thuốc / Vắc xin',
  'Con giống',
  'Điện / Nước',
  'Lương / Nhân công',
  'Vật tư / Thiết bị',
  'Vận chuyển',
  'Khác'
];

const ExpenseManagement: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [works, setWorks] = useState<WorkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    workId: '',
    fromDate: '',
    toDate: ''
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    workId: '',
    description: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...filters,
        limit: 1000 // Load more for summary calculation
      };
      const res = await api.get('/expenses', { params });
      if (res.data && Array.isArray(res.data.data)) {
        setExpenses(res.data.data);
        const total = res.data.data.reduce((sum: number, exp: ExpenseData) => sum + Number(exp.amount), 0);
        setTotalAmount(total);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorks = async () => {
    try {
      const res = await api.get('/works', { params: { limit: 100 } });
      if (res.data && Array.isArray(res.data.data)) {
        setWorks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching works:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWorks();
  }, [filters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: CATEGORIES[0],
      workId: '',
      description: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (expense: ExpenseData) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      type: expense.type,
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      workId: expense.workId || '',
      description: expense.description || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.amount || !formData.date) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc!');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        workId: formData.workId || null
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert('Không thể xóa khoản chi này.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="expense-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Chi Tiêu</h2>
          <p>Theo dõi các khoản chi phí chăn nuôi và vận hành</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Ghi chép chi phí</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng chi tiêu (theo lọc)</div>
            <div className="stat-value">{formatCurrency(totalAmount)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
            <Filter size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Số lượng bản ghi</div>
            <div className="stat-value">{expenses.length}</div>
          </div>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-row">
          <div className="filter-group" style={{ flex: 2 }}>
            <label><Search size={14} /> Tìm kiếm</label>
            <input 
              type="text" 
              name="keyword" 
              placeholder="Tên chi phí, mô tả..." 
              value={filters.keyword} 
              onChange={handleFilterChange} 
            />
          </div>
          <div className="filter-group">
            <label>Danh mục</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">Tất cả danh mục</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Đợt nuôi</label>
            <select name="workId" value={filters.workId} onChange={handleFilterChange}>
              <option value="">Tất cả đợt</option>
              {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
            </select>
          </div>
        </div>
        <div className="filter-row" style={{ marginTop: '1rem' }}>
          <div className="filter-group">
            <label><Calendar size={14} /> Từ ngày</label>
            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
          </div>
          <div className="filter-group">
            <label><Calendar size={14} /> Đến ngày</label>
            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
          </div>
          <button className="btn-secondary" onClick={() => setFilters({ keyword: '', category: '', workId: '', fromDate: '', toDate: '' })}>
            Xóa lọc
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
                  <th style={{ width: '100px' }}>Hành động</th>
                  <th>Ngày chi</th>
                  <th>Tên chi phí</th>
                  <th>Danh mục</th>
                  <th>Đợt nuôi</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon-edit" onClick={() => openEditModal(exp)} title="Sửa"><Edit2 size={16} /></button>
                          <button className="btn-icon-delete" onClick={() => handleDelete(exp.id)} title="Xóa"><Trash2 size={16} /></button>
                        </div>
                      </td>
                      <td>{new Date(exp.date).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`type-badge ${exp.type.toLowerCase()}`}>
                          {exp.type === 'INCOME' ? 'Thu nhập' : 'Chi phí'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        {exp.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{exp.description}</div>}
                      </td>
                      <td>
                        <span className="category-badge">{exp.category}</span>
                      </td>
                      <td>
                        {exp.work ? (
                          <div className="work-link">
                            <span style={{ fontWeight: 500 }}>{exp.work.title}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>{exp.work.object?.name}</span>
                          </div>
                        ) : <span style={{ color: '#cbd5e1' }}>Không gắn đợt</span>}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: exp.type === 'INCOME' ? '#059669' : '#ef4444' }}>
                        {exp.type === 'INCOME' ? '+' : '-'}{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state">Chưa có dữ liệu chi tiêu.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? 'Cập Nhật Chi Phí' : 'Ghi Chép Chi Phí Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group-modal">
                  <label>Tên chi phí / Nội dung *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VD: Mua cám giai đoạn 1, Vắc xin dịch tả..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-modal">
                    <label>Loại giao dịch *</label>
                    <select name="type" value={formData.type} onChange={handleInputChange}>
                      <option value="EXPENSE">Chi phí (-)</option>
                      <option value="INCOME">Thu nhập (+)</option>
                    </select>
                  </div>
                  <div className="form-group-modal">
                    <label>Danh mục</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group-modal">
                    <label>Số tiền (VNĐ) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="VD: 500000"
                      required
                    />
                  </div>
                  <div className="form-group-modal">
                    <label>Ngày chi *</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-modal">
                  <label>Gắn vào đợt nuôi (Work)</label>
                  <select name="workId" value={formData.workId} onChange={handleInputChange}>
                    <option value="">Không gắn đợt</option>
                    {works.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                  </select>
                </div>

                <div className="form-group-modal">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập ghi chú thêm..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader-small" /> : 'Lưu Dữ Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;

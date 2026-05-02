import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Search, Filter, Calendar, CreditCard, Info } from 'lucide-react';
import api from '../../api/axios';
import './ExpenseManagement.css';

interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  type: 'INCOME' | 'EXPENSE' | 'DEBT';
  date: string;
  category: string;
  workId?: string;
  work?: {
    title: string;
    object?: { name: string };
  };
  debtType?: 'RECEIVABLE' | 'PAYABLE';
  debtStatus?: 'PENDING' | 'PAID';
  debtorName?: string;
  dueDate?: string;
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
    type: '',
    debtStatus: '',
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
    paidAmount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'DEBT',
    date: new Date().toISOString().split('T')[0],
    category: CATEGORIES[0],
    workId: '',
    debtType: 'PAYABLE' as 'RECEIVABLE' | 'PAYABLE',
    debtStatus: 'PENDING' as 'PENDING' | 'PAID',
    debtorName: '',
    dueDate: '',
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
      paidAmount: '',
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      category: CATEGORIES[0],
      workId: '',
      debtType: 'PAYABLE',
      debtStatus: 'PENDING',
      debtorName: '',
      dueDate: '',
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
      paidAmount: expense.paidAmount.toString(),
      type: expense.type,
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      workId: expense.workId || '',
      debtType: expense.debtType || 'PAYABLE',
      debtStatus: expense.debtStatus || 'PENDING',
      debtorName: expense.debtorName || '',
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
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
        paidAmount: Number(formData.paidAmount || 0),
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

  const handleMarkAsPaid = async (expense: ExpenseData) => {
    try {
      await api.put(`/expenses/${expense.id}`, { paidAmount: expense.amount, debtStatus: 'PAID' });
      fetchData();
    } catch (err) {
      alert('Không thể cập nhật trạng thái nợ.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="expense-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Thu & Chi</h2>
          <p>Theo dõi các khoản doanh thu và chi phí vận hành</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm giao dịch</span>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
            <Info size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Lợi nhuận dự tính</div>
            <div className="stat-value" style={{ color: totalAmount >= 0 ? '#15803d' : '#ef4444' }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng chi tiêu</div>
            <div className="stat-value">
              {formatCurrency(expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + Number(e.amount), 0))}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Tổng nợ chưa trả</div>
            <div className="stat-value" style={{ color: '#92400e' }}>
              {formatCurrency(expenses.filter(e => e.type === 'DEBT' && e.debtStatus === 'PENDING').reduce((sum, e) => sum + Number(e.amount), 0))}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
            <Filter size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Số lượng giao dịch</div>
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
          <div className="filter-group">
            <label>Loại giao dịch</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Tất cả</option>
              <option value="INCOME">Chỉ thu nhập</option>
              <option value="EXPENSE">Chỉ chi phí</option>
              <option value="DEBT">Chỉ tiền nợ</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Trạng thái nợ</label>
            <select name="debtStatus" value={filters.debtStatus} onChange={handleFilterChange}>
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chưa thanh toán</option>
              <option value="PAID">Đã thanh toán</option>
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
          <button className="btn-secondary" onClick={() => setFilters({ keyword: '', category: '', workId: '', type: '', debtStatus: '', fromDate: '', toDate: '' })}>
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
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Nội dung giao dịch</th>
                  <th>Danh mục</th>
                  <th>Đợt nuôi</th>
                  <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                  <th style={{ textAlign: 'right' }}>Đã trả</th>
                  <th style={{ textAlign: 'right' }}>Còn lại</th>
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
                          {exp.type === 'DEBT' && exp.debtStatus === 'PENDING' && (
                            <button className="btn-icon-check" onClick={() => handleMarkAsPaid(exp)} title="Đánh dấu đã trả"><CreditCard size={16} /></button>
                          )}
                        </div>
                      </td>
                      <td>{new Date(exp.date).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span className={`type-badge ${(exp.type || '').toLowerCase()}`}>
                          {(exp.type || '').toUpperCase() === 'INCOME' ? 'Lợi nhuận' : (exp.type || '').toUpperCase() === 'DEBT' ? 'Tiền nợ' : 'Chi phí'}
                        </span>
                        {exp.type === 'DEBT' && (
                          <div className={`debt-status-badge ${(exp.debtStatus || '').toLowerCase()}`}>
                            {exp.debtStatus === 'PAID' ? 'Đã trả' : 'Chưa trả'}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{exp.title}</div>
                        {exp.type === 'DEBT' && exp.debtorName && (
                          <div className="debtor-info">
                            <Info size={12} /> {exp.debtType === 'RECEIVABLE' ? 'Nợ từ:' : 'Nợ cho:'} {exp.debtorName}
                          </div>
                        )}
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
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(exp.amount)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#059669' }}>
                        {formatCurrency(exp.paidAmount || 0)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: (exp.amount - (exp.paidAmount || 0)) > 0 ? '#ef4444' : '#059669' }}>
                        {formatCurrency(exp.amount - (exp.paidAmount || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state">Chưa có dữ liệu thu chi.</td>
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
              <h3>{editingExpense ? 'Cập Nhật Giao Dịch' : 'Ghi Chép Thu/Chi Mới'}</h3>
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
                      <option value="DEBT">Tiền nợ (Nợ)</option>
                    </select>
                  </div>
                  <div className="form-group-modal">
                    <label>Danh mục</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {formData.type === 'DEBT' && (
                  <>
                    <div className="form-row">
                      <div className="form-group-modal">
                        <label>Loại nợ *</label>
                        <select name="debtType" value={formData.debtType} onChange={handleInputChange}>
                          <option value="PAYABLE">Khoản phải trả (Mình nợ)</option>
                          <option value="RECEIVABLE">Khoản phải thu (Họ nợ)</option>
                        </select>
                      </div>
                      <div className="form-group-modal">
                        <label>Trạng thái *</label>
                        <select name="debtStatus" value={formData.debtStatus} onChange={handleInputChange}>
                          <option value="PENDING">Chưa thanh toán</option>
                          <option value="PAID">Đã thanh toán</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group-modal">
                        <label>Đối tượng (Tên người nợ/chủ nợ) *</label>
                        <input
                          type="text"
                          name="debtorName"
                          value={formData.debtorName}
                          onChange={handleInputChange}
                          placeholder="VD: Anh Nam, Đại lý cám..."
                          required={formData.type === 'DEBT'}
                        />
                      </div>
                      <div className="form-group-modal">
                        <label>Hạn thanh toán</label>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="form-row">
                  <div className="form-group-modal">
                    <label>Tổng số tiền (VNĐ) *</label>
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
                    <label>Đã thanh toán (VNĐ)</label>
                    <input
                      type="number"
                      name="paidAmount"
                      value={formData.paidAmount}
                      onChange={handleInputChange}
                      placeholder="VD: 200000"
                    />
                  </div>
                </div>
                <div className="form-row">
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

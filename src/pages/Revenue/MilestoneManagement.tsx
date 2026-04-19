import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import './MilestoneManagement.css';

interface MilestoneData {
  id: string;
  targetAmount: number;
  bonusAmount: number;
  title?: string;
  isActive: boolean;
}

const MilestoneManagement: React.FC = () => {
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    targetAmount: '',
    bonusAmount: '',
    title: '',
    isActive: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/milestones');
      if (res.data && Array.isArray(res.data.data)) {
        setMilestones(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const openAddModal = () => {
    setEditingMilestone(null);
    setFormData({
      targetAmount: '',
      bonusAmount: '',
      title: '',
      isActive: true
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MilestoneData) => {
    setEditingMilestone(item);
    setFormData({
      targetAmount: item.targetAmount.toString(),
      bonusAmount: item.bonusAmount.toString(),
      title: item.title || '',
      isActive: item.isActive
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.targetAmount || !formData.bonusAmount) {
      setError('Vui lòng nhập Mốc doanh thu và Mức thưởng!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        targetAmount: Number(formData.targetAmount),
        bonusAmount: Number(formData.bonusAmount),
        title: formData.title,
        isActive: formData.isActive
      };

      if (editingMilestone) {
        await api.put(`/milestones/${editingMilestone.id}`, payload);
      } else {
        await api.post('/milestones', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving milestone:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mốc thưởng này?')) return;

    try {
      await api.delete(`/milestones/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting milestone:', err);
      alert('Có lỗi xảy ra khi xóa.');
    }
  };

  return (
    <div className="milestone-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Các Mốc Đạt Doanh Thu</h2>
          <p>Thiết lập KPI và mức thưởng tương ứng cho nhân viên bán hàng</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm Mốc Thưởng</span>
        </button>
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
                  <th style={{ width: '60px' }}>STT</th>
                  <th>Tên / Mô tả Mốc</th>
                  <th style={{ textAlign: 'right' }}>Mốc Doanh Thu Cần Đạt (VNĐ)</th>
                  <th style={{ textAlign: 'right' }}>Mức Thưởng (VNĐ)</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {milestones.length > 0 ? (
                  milestones.map((item, index) => (
                    <tr key={item.id} className={!item.isActive ? 'inactive-row' : ''}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                        {index + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Target size={16} style={{ color: '#8b5cf6' }} />
                          <span style={{ fontWeight: 500 }}>{item.title || `Mốc ${index + 1}`}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#334155' }}>
                        {Number(item.targetAmount).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontSize: '1.05rem' }}>
                        + {Number(item.bonusAmount).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.isActive ? (
                          <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>Đang áp dụng</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>Đã tắt</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon btn-edit" onClick={() => openEditModal(item)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => handleDelete(item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <Target size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Chưa có mốc thưởng nào được thiết lập.</p>
                      <button className="btn-secondary" onClick={openAddModal} style={{ marginTop: '1rem' }}>
                        Thiết lập mốc đầu tiên
                      </button>
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
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>{editingMilestone ? 'Chỉnh Sửa Mốc Thưởng' : 'Thêm Mốc Thưởng Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message"><AlertCircle size={14}/> {error}</div>}
                
                <div className="form-group">
                  <label>Tên / Mô tả Mốc (Không bắt buộc)</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VD: Mốc Khởi Động"
                  />
                </div>

                <div className="form-group">
                  <label>Mốc Doanh Thu Cần Đạt (VNĐ) *</label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    placeholder="VD: 50000000"
                    min="1"
                    required
                  />
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Ví dụ: 50.000.000 đ
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Mức Thưởng (VNĐ) *</label>
                  <input
                    type="number"
                    name="bonusAmount"
                    value={formData.bonusAmount}
                    onChange={handleInputChange}
                    placeholder="VD: 1000000"
                    min="0"
                    required
                  />
                  <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Khoản tiền thưởng nhân viên nhận được khi đạt mức doanh thu.
                  </small>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Áp dụng mốc thưởng này</label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Dữ Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneManagement;

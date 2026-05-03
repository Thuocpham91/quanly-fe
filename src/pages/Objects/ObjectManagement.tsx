import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Eye, Edit2, Trash2, Tag, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import './ObjectManagement.css';

interface ObjectData {
  id: string;
  name: string;
  startDate: string | Date | null;
  description: string | null;
  type: string | null;
  status?: string;
}

const ObjectTypes = [
  { value: 'vào ấp trứng', label: 'Vào ấp trứng' },
  { value: 'vào gà', label: 'Vào gà' }
];

const ObjectManagement: React.FC = () => {
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const navigate = useNavigate();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingObject, setEditingObject] = useState<ObjectData | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    startDate: '', 
    description: '',
    type: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');

  // Fetch objects
  const fetchObjects = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/objects?page=${page}&limit=${limit}`);
      if (response.data && Array.isArray(response.data.data)) {
        setObjects(response.data.data);
        const total = response.data.total || 0;
        setTotalPages(Math.ceil(total / limit) || 1);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error fetching objects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects(1);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingObject(null);
    setFormData({ name: '', startDate: '', description: '', type: 'vào ấp trứng', status: 'ACTIVE' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (obj: ObjectData) => {
    setEditingObject(obj);
    setFormData({ 
      name: obj.name, 
      startDate: obj.startDate ? obj.startDate.toString() : '',
      description: obj.description || '',
      type: obj.type || 'vào ấp trứng',
      status: obj.status || 'ACTIVE'
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đối tượng này?')) return;

    try {
      await api.delete(`/objects/${id}`);
      fetchObjects(currentPage);
    } catch (err) {
      console.error('Lỗi khi xóa object:', err);
      alert('Có lỗi xảy ra khi xóa dữ liệu.');
    }
  };

  const handleFinish = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn kết thúc đợt này? Sau khi kết thúc, lịch trình công việc của đợt này sẽ không hiển thị nữa.')) return;
    try {
      await api.put(`/objects/${id}`, { status: 'FINISHED' });
      fetchObjects(currentPage);
    } catch (err) {
      console.error('Lỗi khi kết thúc object:', err);
      alert('Có lỗi xảy ra.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.type) {
      setError('Vui lòng nhập đầy đủ Tên và Loại đối tượng!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        name: formData.name,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        description: formData.description ? formData.description : null,
        type: formData.type,
        status: formData.status
      };

      if (editingObject) {
        await api.put(`/objects/${editingObject.id}`, payload);
      } else {
        await api.post('/objects', payload);
      }
      
      setIsModalOpen(false);
      fetchObjects(editingObject ? currentPage : 1);
    } catch (err: any) {
      console.error('Lỗi khi lưu object:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="object-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Object</h2>
          <p>Danh sách các đối tượng và nghiệp vụ hiện tại</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm Mới Object</span>
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
                  <th>ID</th>
                  <th>Tên Object</th>
                  <th>Loại</th>
                  <th>Start Date</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '180px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {objects.length > 0 ? (
                  objects.map((obj) => (
                    <tr key={obj.id}>
                      <td>{obj.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{obj.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Tag size={14} color="#64748b" />
                          <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                            {obj.type || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {obj.startDate ? new Date(obj.startDate).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td>
                        <span className={`status-badge-custom ${obj.status?.toLowerCase() || 'active'}`}>
                          {obj.status === 'FINISHED' ? 'Đã xong' : 'Đang nuôi'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                            title="Chi tiết"
                            onClick={() => navigate(`/admin/objects/${obj.id}`, { state: obj })}
                          >
                            <Eye size={16} />
                          </button>
                          {obj.status !== 'FINISHED' && (
                             <button 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px' }}
                              title="Hoàn thành"
                              onClick={() => handleFinish(obj.id)}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                            title="Sửa"
                            onClick={() => openEditModal(obj)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '4px', color: '#ef4444' }}
                            title="Xóa"
                            onClick={() => handleDelete(obj.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Chưa có đối tượng nào. Hãy thêm mới!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!isLoading && totalPages > 1 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '1rem', borderTop: '1px solid #e2e8f0', background: 'white', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <button 
              type="button"
              className="btn-secondary" 
              disabled={currentPage === 1}
              onClick={() => fetchObjects(currentPage - 1)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}
            >
              Trước
            </button>
            <span style={{ fontWeight: 500, color: '#64748b' }}>Trang {currentPage} / {totalPages}</span>
            <button 
              type="button"
              className="btn-secondary" 
              disabled={currentPage === totalPages}
              onClick={() => fetchObjects(currentPage + 1)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingObject ? 'Cập Nhật Đối Tượng' : 'Thêm Đối Tượng Mới'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="form-group-modal" style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}
                
                <div className="form-group-modal">
                  <label htmlFor="name">Tên đối tượng (Name)</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên đối tượng..."
                    required
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="type">Loại đối tượng (Type)</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    {ObjectTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-modal">
                  <label htmlFor="status">Trạng thái</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="ACTIVE">Đang nuôi (Active)</option>
                    <option value="FINISHED">Đã xong (Finished)</option>
                  </select>
                </div>
                
                <div className="form-group-modal">
                  <label htmlFor="startDate">Ngày bắt đầu (Tùy chọn)</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group-modal">
                  <label htmlFor="description">Mô tả (Tùy chọn)</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả cho object..."
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
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

export default ObjectManagement;

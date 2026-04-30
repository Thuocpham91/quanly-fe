import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Search, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  Circle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './WorkManagement.css';

interface ObjectData {
  id: string;
  name: string;
}

interface WorkData {
  id: string;
  title: string;
  objectId: string;
  object?: ObjectData;
  description?: string;
  workDate: string;
  exportDate?: string;
  quantity?: number;
  purchaseQuantity?: number;
  removalCount?: number;
  startDate?: string | Date;
  workTasks?: any[];
}

const WorkManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [works, setWorks] = useState<WorkData[]>([]);
  const [objects, setObjects] = useState<ObjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkData | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    objectId: '',
    description: '',
    workDate: '',
    startDate: '',
    quantity: '' as string | number,
    purchaseQuantity: '' as string | number,
    removalCount: '' as string | number,
    employeeChecked: false,
    managerChecked: false
  });

  const roleCode = typeof user?.role === 'object' && user?.role !== null 
    ? user.role.code?.toUpperCase() 
    : typeof user?.role === 'string' 
      ? user.role.toUpperCase() 
      : '';
  
  const isManager = ['ADMIN', 'MANAGER', 'STAFF'].includes(roleCode);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [worksRes, objectsRes] = await Promise.all([
        api.get('/works'),
        api.get('/objects')
      ]);

      if (worksRes.data && Array.isArray(worksRes.data.data)) {
        setWorks(worksRes.data.data);
      }
      if (objectsRes.data && Array.isArray(objectsRes.data.data)) {
        setObjects(objectsRes.data.data);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (name === 'objectId' && value) {
      const selectedObj = objects.find(o => o.id === value);
      if (selectedObj && (selectedObj as any).startDate) {
        const objDate = new Date((selectedObj as any).startDate).toISOString().split('T')[0];
        setFormData((prev) => ({ ...prev, [name]: value, startDate: objDate }));
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const openAddModal = () => {
    setEditingWork(null);
    setFormData({
      title: '',
      objectId: objects.length > 0 ? objects[0].id : '',
      description: '',
      workDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      quantity: '',
      purchaseQuantity: '',
      removalCount: '',
      employeeChecked: false,
      managerChecked: false
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (work: WorkData) => {
    setEditingWork(work);
    setFormData({
      title: work.title,
      objectId: work.objectId,
      description: work.description || '',
      workDate: work.workDate ? new Date(work.workDate).toISOString().split('T')[0] : '',
      startDate: work.startDate ? new Date(work.startDate).toISOString().split('T')[0] : '',
      quantity: work.quantity || '',
      purchaseQuantity: work.purchaseQuantity || '',
      removalCount: work.removalCount || '',
      employeeChecked: (work as any).employeeChecked || false,
      managerChecked: (work as any).managerChecked || false
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.objectId || !formData.workDate) {
      setError('Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const constructLocalDate = (dateStr: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const payload = {
        title: formData.title,
        objectId: Number(formData.objectId),
        description: formData.description,
        workDate: constructLocalDate(formData.workDate as string),
        startDate: constructLocalDate(formData.startDate as string) || new Date(),
        quantity: formData.quantity !== '' ? Number(formData.quantity) : null,
        purchaseQuantity: formData.purchaseQuantity !== '' ? Number(formData.purchaseQuantity) : null,
        removalCount: formData.removalCount !== '' ? Number(formData.removalCount) : null,
        employeeChecked: formData.employeeChecked,
        managerChecked: formData.managerChecked,
      };

      if (editingWork) {
        await api.put(`/works/${editingWork.id}`, payload);
      } else {
        await api.post('/works', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving work:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;

    try {
      await api.delete(`/works/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting work:', err);
      alert('Có lỗi xảy ra khi xóa công việc.');
    }
  };

  const filteredWorks = works.filter(w => 
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.object?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="work-page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Công Việc</h2>
          <p>Theo dõi và cập nhật tiến độ công việc cho các Object</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm Công Việc</span>
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề hoặc đối tượng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="loader-large"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                   <th>Tiêu đề</th>
                   <th>Ngày làm việc</th>
                   <th>Ngày xuất gà</th>
                   <th>Quy mô (Ban đầu)</th>
                   <th>Tổng số đặt</th>
                   <th>Số lượng hiện tại</th>
                   <th>Tổng số nhiệm vụ</th>
                   <th>Trạng thái</th>
                   <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorks.length > 0 ? (
                  filteredWorks.map((work) => (
                    <tr key={work.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{work.title}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{work.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                          <Calendar size={14} />
                          <span>{work.workDate ? new Date(work.workDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', fontWeight: 600 }}>
                          <Calendar size={14} />
                          <span>
                            {work.exportDate ? new Date(work.exportDate).toLocaleDateString('vi-VN') : '-'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {work.quantity !== null && work.quantity !== undefined ? work.quantity.toLocaleString('vi-VN') : '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#059669' }}>
                            {work.purchaseQuantity !== null && work.purchaseQuantity !== undefined ? work.purchaseQuantity.toLocaleString('vi-VN') : '0'}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Từ đơn hàng</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#ef4444' }}>
                            {(() => {
                              const totalRemoval = work.workTasks?.reduce((sum, t) => sum + (t.removalCount || 0), 0) || 0;
                              const currentQty = (work.quantity || 0) - totalRemoval;
                              return Math.max(0, currentQty).toLocaleString('vi-VN');
                            })()}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            Đã loại: {work.workTasks?.reduce((sum, t) => sum + (t.removalCount || 0), 0) || 0}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>
                           {work.workTasks?.length || 0} nhiệm vụ
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-primary">
                           {Math.round(((work.workTasks?.filter(t => t.employeeChecked).length || 0) / (work.workTasks?.length || 1)) * 100)}% Hoàn thành
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem' }}
                            onClick={() => navigate(`/admin/works/${work.id}`)}
                          >
                            <ChevronRight size={16} />
                            <span>Chi tiết</span>
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={(e) => { e.stopPropagation(); openEditModal(work); }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(work.id); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có công việc nào.
                    </td>
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
              <h3>{editingWork ? 'Cập Nhật Công Việc' : 'Thêm Công Việc Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
                
                <div className="form-group-modal">
                  <label>Tiêu đề công việc *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="VD: Kiểm tra đàn gà định kỳ"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-modal">
                    <label>Đối tượng (Object) *</label>
                    <select name="objectId" value={formData.objectId} onChange={handleInputChange} required>
                      <option value="">Chọn một object...</option>
                      {objects.map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group-modal">
                    <label>Ngày làm việc (Target) *</label>
                    <input
                      type="date"
                      name="workDate"
                      value={formData.workDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-modal">
                  <label>Ngày bắt đầu đợt *</label>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Ngày làm mốc để tính lịch trình các nhiệm vụ mẫu
                  </div>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group-modal">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Ghi chú thêm về công việc..."
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group-modal">
                    <label>Số lượng (Quantity)</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="VD: 500"
                    />
                  </div>
                  <div className="form-group-modal">
                    <label>Số lượng mua (Purchase)</label>
                    <input
                      type="number"
                      name="purchaseQuantity"
                      value={formData.purchaseQuantity}
                      onChange={handleInputChange}
                      placeholder="VD: 1000"
                    />
                  </div>
                  <div className="form-group-modal">
                    <label>Số lượng loại bỏ (Removal)</label>
                    <input
                      type="number"
                      name="removalCount"
                      value={formData.removalCount}
                      onChange={handleInputChange}
                      placeholder="VD: 10"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      name="employeeChecked"
                      checked={formData.employeeChecked}
                      onChange={handleInputChange}
                    />
                    <span>Nhân viên đã xác nhận</span>
                  </label>

                  {isManager && (
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        name="managerChecked"
                        checked={formData.managerChecked}
                        onChange={handleInputChange}
                      />
                      <span>Quản lý đã xác nhận</span>
                    </label>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader-small" /> : 'Lưu Công Việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkManagement;

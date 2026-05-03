import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  X, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Calendar, 
  Hash, 
  Tag, 
  FileText, 
  Briefcase, 
  ClipboardList,
  ChevronRight,
  Loader2
} from 'lucide-react';
import api from '../../api/axios';
import './ObjectManagement.css'; // Re-use table & modal styles
import './ObjectDetail.css';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface TaskData {
  id: string;
  taskName: string;
  quantity: number;
  workDate: number;
  removalCount?: number;
  scheduledDate?: number;
  feedPerAnimal?: number;
  description?: string;
}

interface WorkData {
  id: string;
  title: string;
  workDate: string;
  exportDate?: string;
  quantity?: number;
  workTasks?: any[];
}

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

const ObjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Object data passed from state
  const objectData = location.state || { name: 'Object #' + id };

  const [activeTab, setActiveTab] = useState<'tasks' | 'works'>('tasks');
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const [totalTaskPages, setTotalTaskPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [works, setWorks] = useState<WorkData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states for task creation/editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [formData, setFormData] = useState({ 
    taskName: '', 
    quantity: '', 
    workDate: '', 
    removalCount: '',
    feedPerAnimal: '',
    description: ''
  });
  const [error, setError] = useState('');

  const fetchTasks = async (page: number = 1, customLimit?: number) => {
    const fetchLimit = customLimit || limit;
    try {
      const response = await api.get(`/objects/${id}/tasks?page=${page}&limit=${fetchLimit}`);
      if (response.data && Array.isArray(response.data.data)) {
        setTasks(response.data.data);
        const total = response.data.total || 0;
        setTotalTaskPages(Math.ceil(total / fetchLimit) || 1);
        setCurrentTaskPage(page);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchWorks = async () => {
    try {
      const response = await api.get(`/works?objectId=${id}`);
      if (response.data && Array.isArray(response.data.data)) {
        setWorks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching works:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchTasks(1), fetchWorks()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (content: string) => {
    setFormData((prev) => ({ ...prev, description: content }));
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ taskName: '', quantity: '', workDate: '', removalCount: '', feedPerAnimal: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskData) => {
    setEditingTask(task);
    setFormData({ 
        taskName: task.taskName, 
        quantity: task.quantity?.toString() || '', 
        workDate: task.workDate.toString(), 
        removalCount: task.removalCount?.toString() || '',
        feedPerAnimal: task.feedPerAnimal?.toString() || '',
        description: task.description || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.taskName || !formData.workDate) {
      setError('Vui lòng nhập đầy đủ Tên Task và Ngày làm việc!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        taskName: formData.taskName,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        workDate: Number(formData.workDate),
        removalCount: formData.removalCount ? Number(formData.removalCount) : null,
        feedPerAnimal: formData.feedPerAnimal ? Number(formData.feedPerAnimal) : null,
        description: formData.description || null
      };

      if (editingTask) {
        await api.put(`/objects/${id}/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/objects/${id}/tasks`, payload);
      }
      
      setIsModalOpen(false);
      fetchTasks(editingTask ? currentTaskPage : 1);
    } catch (err: any) {
      console.error('Lỗi khi lưu task:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu Task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa task này?')) return;

    try {
      await api.delete(`/objects/${id}/tasks/${taskId}`);
      fetchTasks(currentTaskPage);
    } catch (err: any) {
      console.error('Lỗi khi xóa task:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa Task.');
    }
  };

  return (
    <div className="detail-container">
      <button className="back-btn" onClick={() => navigate('/admin/objects')}>
        <ArrowLeft size={18} /> 
        <span>Quay lại danh sách</span>
      </button>

      <div className="detail-header-card">
        <div className="header-main">
          <div className="title-section">
            <div className="id-badge">
              <Hash size={12} />
              <span>{id}</span>
            </div>
            <h2>{objectData.name}</h2>
          </div>
          <div className="status-badge" style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: 700, padding: '0.5rem 1rem' }}>
            <Tag size={16} />
            <span>{objectData.type || 'Nghiệp vụ'}</span>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Ngày bắt đầu</span>
            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="#64748b" />
              {objectData.startDate ? new Date(objectData.startDate).toLocaleDateString('vi-VN') : '-'}
            </div>
          </div>
          <div className="info-item">
            <span className="info-label">Loại quy trình</span>
            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={16} color="#64748b" />
              {objectData.type || 'Tiêu chuẩn'}
            </div>
          </div>
          <div className="info-item" style={{ gridColumn: 'span 2' }}>
            <span className="info-label">Mô tả chi tiết</span>
            <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="#64748b" />
              {objectData.description || 'Chưa có mô tả cho đối tượng này.'}
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-item ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <ClipboardList size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Quy trình Task Mẫu
        </button>
        <button 
          className={`tab-item ${activeTab === 'works' ? 'active' : ''}`}
          onClick={() => setActiveTab('works')}
        >
          <Briefcase size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Lịch sử Công việc ({works.length})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-container" style={{ padding: '5rem 0' }}>
          <Loader2 className="loader-large animate-spin" size={40} color="#2563eb" />
          <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Đang tải dữ liệu...</p>
        </div>
      ) : activeTab === 'tasks' ? (
        <div className="section-card">
          <div className="section-header">
            <h3>Danh sách Task Templates</h3>
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} />
              <span>Thêm Task Mới</span>
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Tên Task</th>
                  <th>Quy mô</th>
                  <th>Lượng cám (g/con)</th>
                  <th>Ngày làm (Offset)</th>
                  <th>Dự kiến (Tương đối)</th>
                  <th>Loại bỏ</th>
                  <th>Mô tả / Ghi chú</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td><span style={{ color: '#94a3b8' }}>#{task.id}</span></td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{task.taskName}</td>
                      <td>{task.quantity || '-'}</td>
                      <td>{task.feedPerAnimal ? `${task.feedPerAnimal}g` : '-'}</td>
                      <td>
                        <span className="id-badge" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                          +{task.workDate} ngày
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#2563eb', fontWeight: 500 }}>
                          {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </td>
                      <td>{task.removalCount ?? '-'}</td>
                      <td>
                        <div 
                          className="rich-text-content ql-editor"
                          style={{ maxWidth: '300px', fontSize: '0.875rem', color: '#64748b', padding: 0, whiteSpace: task.description && /<(p|br|ul|ol|li|strong|em|u|span|div|h[1-6])[>\s/]/i.test(task.description) ? 'normal' : 'pre-wrap' }}
                          dangerouslySetInnerHTML={{ __html: task.description || '-' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn-icon-only btn-edit" title="Sửa" onClick={() => openEditModal(task)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon-only btn-delete" title="Xóa" onClick={() => handleDelete(task.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state-container">
                        <div className="empty-icon"><ClipboardList size={32} /></div>
                        <p>Chưa có Task mẫu nào được thiết lập.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {tasks.length > 0 && (
            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid #e2e8f0', background: 'white', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Hiển thị:</span>
                <select 
                  value={limit} 
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setLimit(newLimit);
                    fetchTasks(1, newLimit);
                  }}
                  style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                >
                  <option value={10}>10 dòng</option>
                  <option value={20}>20 dòng</option>
                  <option value={50}>50 dòng</option>
                  <option value={100}>100 dòng</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  type="button"
                  className="btn-secondary" 
                  disabled={currentTaskPage === 1}
                  onClick={() => fetchTasks(currentTaskPage - 1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}
                >
                  Trước
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 500, color: '#64748b' }}>Trang</span>
                  <select 
                    value={currentTaskPage}
                    onChange={(e) => fetchTasks(parseInt(e.target.value))}
                    style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#0f172a', outline: 'none' }}
                  >
                    {Array.from({ length: totalTaskPages }, (_, i) => i + 1).map(page => (
                      <option key={page} value={page}>{page}</option>
                    ))}
                  </select>
                  <span style={{ fontWeight: 500, color: '#64748b' }}>/ {totalTaskPages}</span>
                </div>
                <button 
                  type="button"
                  className="btn-secondary" 
                  disabled={currentTaskPage === totalTaskPages}
                  onClick={() => fetchTasks(currentTaskPage + 1)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="section-card">
          <div className="section-header">
            <h3>Các đợt công việc đã triển khai</h3>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tiêu đề Công việc</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày xuất gà</th>
                  <th>Quy mô</th>
                  <th>Nhiệm vụ</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {works.length > 0 ? (
                  works.map((work) => (
                    <tr key={work.id}>
                      <td><span style={{ color: '#94a3b8' }}>#{work.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{work.title}</td>
                      <td>{new Date(work.workDate).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>
                          {work.exportDate ? new Date(work.exportDate).toLocaleDateString('vi-VN') : '-'}
                        </span>
                      </td>
                      <td>{work.quantity?.toLocaleString('vi-VN') || '-'}</td>
                      <td>
                        <span className="id-badge">{work.workTasks?.length || 0} nhiệm vụ</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}
                            onClick={() => navigate(`/admin/works/${work.id}`)}
                          >
                            <span>Chi tiết</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state-container">
                        <div className="empty-icon"><Briefcase size={32} /></div>
                        <p>Chưa có đợt công việc nào được tạo cho Object này.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Cập Nhật Task Mẫu' : 'Thêm Task Mẫu Mới'}</h3>
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
                  <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>
                    {error}
                  </div>
                )}
                
                <div className="form-group-modal">
                  <label htmlFor="taskName">Tên Task Template *</label>
                  <input
                    type="text"
                    id="taskName"
                    name="taskName"
                    value={formData.taskName}
                    onChange={handleInputChange}
                    placeholder="VD: Kiểm tra nhiệt độ, Tiêm vaccine..."
                    required
                  />
                </div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-modal">
                    <label htmlFor="workDate">Ngày làm việc (Ngày thứ mấy) *</label>
                    <select
                      id="workDate"
                      name="workDate"
                      value={formData.workDate}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    >
                      <option value="">Chọn ngày (1-400)</option>
                      {Array.from({ length: 400 }, (_, i) => i + 1).map(day => {
                        const isTaken = tasks.some(t => t.workDate === day && t.id !== editingTask?.id);
                        if (isTaken) return null;
                        return (
                          <option key={day} value={day}>
                            Ngày thứ {day}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group-modal">
                    <label htmlFor="quantity">Quy mô (Tùy chọn)</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Số lượng áp dụng..."
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group-modal">
                    <label htmlFor="removalCount">Số lượng loại bỏ dự kiến</label>
                    <input
                      type="number"
                      id="removalCount"
                      name="removalCount"
                      value={formData.removalCount}
                      onChange={handleInputChange}
                      placeholder="Số lượng hao hụt dự kiến..."
                    />
                  </div>
                  <div className="form-group-modal">
                    <label htmlFor="feedPerAnimal">Số gam cám / 1 con (Không bắt buộc)</label>
                    <input
                      type="number"
                      step="0.1"
                      id="feedPerAnimal"
                      name="feedPerAnimal"
                      value={formData.feedPerAnimal}
                      onChange={handleInputChange}
                      placeholder="VD: 15.5..."
                    />
                  </div>
                </div>

                <div className="form-group-modal">
                  <label>Ghi chú / Hướng dẫn công việc</label>
                  <div style={{ marginBottom: '40px' }}>
                    <ReactQuill 
                      theme="snow" 
                      value={formData.description} 
                      onChange={handleDescriptionChange}
                      modules={quillModules}
                      placeholder="Nhập hướng dẫn chi tiết (có thể xuống dòng, tô đậm...)"
                      style={{ height: '150px' }}
                    />
                  </div>
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
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Lưu Task Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectDetail;

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import './ObjectManagement.css'; // Re-use table & modal styles
import './ObjectDetail.css';

interface TaskData {
  id: string;
  taskName: string;
  quantity: number;
  workDate: number;
  removalCount?: number;
  scheduledDate?: number;
  description?: string;
}

const ObjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Object data passed from state
  const objectData = location.state || { name: 'Object ' + id };

  const [tasks, setTasks] = useState<TaskData[]>([]);
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
    description: ''
  });
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/objects/${id}/tasks`);
      if (response.data && Array.isArray(response.data.data)) {
        setTasks(response.data.data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTasks();
    }
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ taskName: '', quantity: '', workDate: '', removalCount: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskData) => {
    setEditingTask(task);
    setFormData({ 
        taskName: task.taskName, 
        quantity: task.quantity.toString(), 
        workDate: task.workDate.toString(), 
        removalCount: task.removalCount?.toString() || '',
        description: task.description || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.taskName || !formData.workDate) {
      setError('Vui lòng nhập đầy đủ Task Name và Work Date!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        taskName: formData.taskName,
        quantity: formData.quantity ? Number(formData.quantity) : null,
        workDate: Number(formData.workDate),
        removalCount: formData.removalCount ? Number(formData.removalCount) : null,
        description: formData.description || null
      };

      if (editingTask) {
        await api.put(`/objects/${id}/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/objects/${id}/tasks`, payload);
      }
      
      // Close modal and refresh
      setIsModalOpen(false);
      setFormData({ taskName: '', quantity: '', workDate: '', removalCount: '', description: '' });
      fetchTasks();
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
      fetchTasks();
    } catch (err: any) {
      console.error('Lỗi khi xóa task:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa Task.');
    }
  };

  return (
    <div className="detail-container">
      <button className="back-btn" onClick={() => navigate('/objects')}>
        <ArrowLeft size={18} /> Quay lại danh sách
      </button>

      <div className="detail-header">
        <div className="detail-info">
          <h2>{objectData.name}</h2>
          <p>Thuộc tính Object ID: {id}</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <h3 className="task-section-title">Danh sách Task</h3>
        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Thêm Mới Task</span>
        </button>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large"></div>
            <p>Đang tải dữ liệu Task...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Tên Task</th>
                  <th>Số lượng</th>
                  <th>Work Date</th>
                  <th>Scheduled</th>
                  <th>Removal</th>
                  <th>Mô tả</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.id}</td>
                      <td>{task.taskName}</td>
                      <td>{task.quantity}</td>
                      <td>{task.workDate}</td>
                      <td>
                          <span style={{ color: '#2563eb', fontWeight: 500 }}>
                            {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('vi-VN') : '-'}
                          </span>
                      </td>
                      <td>{task.removalCount ?? '-'}</td>
                      <td>{task.description || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                            title="Sửa Task"
                            onClick={() => openEditModal(task)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                            title="Xóa Task"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      Chưa có Task nào cho Object này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Cập Nhật Task' : 'Thêm Task Mới'}</h3>
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
                  <label htmlFor="taskName">Tên Task (Task Name)</label>
                  <input
                    type="text"
                    id="taskName"
                    name="taskName"
                    value={formData.taskName}
                    onChange={handleInputChange}
                    placeholder="VD: task 1..."
                    required
                  />
                </div>
                
                <div className="form-group-modal">
                  <label htmlFor="quantity">Số lượng (Quantity - Tùy chọn)</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="VD: 3"
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="workDate">Ngày làm việc (Work Date Offset)</label>
                  <input
                    type="number"
                    id="workDate"
                    name="workDate"
                    value={formData.workDate}
                    onChange={handleInputChange}
                    placeholder="VD: 4"
                    required
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="removalCount">Số lượng loại bỏ (Removal Count)</label>
                  <input
                    type="number"
                    id="removalCount"
                    name="removalCount"
                    value={formData.removalCount}
                    onChange={handleInputChange}
                    placeholder="VD: 1"
                  />
                </div>

                <div className="form-group-modal">
                  <label htmlFor="description">Mô tả (Description)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả chi tiết..."
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
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

export default ObjectDetail;

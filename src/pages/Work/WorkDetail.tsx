import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Briefcase,
  Save,
  Trash2,
  Edit,
  Info,
  ChevronRight,
  ShoppingBag,
  User as UserIcon
} from 'lucide-react';
import api from '../../api/axios';
import './WorkDetail.css';

interface WorkTaskData {
  id: string;
  taskName: string;
  description?: string;
  startDate: string;
  employeeChecked: boolean;
  managerChecked: boolean;
  quantity?: number;
  removalCount?: number;
}

interface WorkData {
  id: string;
  title: string;
  objectId: string;
  object?: { name: string };
  startDate: string;
  workDate?: string;
  exportDate?: string;
  quantity?: number;
  purchaseQuantity?: number;
  workTasks: WorkTaskData[];
  orders?: any[];
}

const WorkDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<WorkData | null>(null);
  const [tasks, setTasks] = useState<WorkTaskData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/works/${id}`);
      if (res.data && res.data.data) {
        setWork(res.data.data);
        setTasks(res.data.data.workTasks || []);
      }
    } catch (err) {
      console.error('Error fetching work detail:', err);
      setError('Không thể tải thông tin đợt công việc.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkDetail();
  }, [fetchWorkDetail]);

  const handleToggleCheck = async (taskId: string, field: 'employeeChecked' | 'managerChecked', currentVal: boolean) => {
    try {
      setIsSaving(true);
      await api.put(`/works/tasks/${taskId}`, { [field]: !currentVal });
      
      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: !currentVal } : t));
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Không thể cập nhật trạng thái nhiệm vụ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTaskData = async (taskId: string, field: 'quantity' | 'removalCount', val: string) => {
    const numVal = val === '' ? null : Number(val);
    try {
      await api.put(`/works/tasks/${taskId}`, { [field]: numVal });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: numVal ?? undefined } : t));
    } catch (err) {
      console.error('Error updating task data:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này khỏi đợt?')) return;
    try {
      await api.delete(`/works/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loader-large"></div>
        <p>Đang tải chi tiết đợt công việc...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#ef4444" />
        <p>{error || 'Không tìm thấy thông tin đợt công việc.'}</p>
        <button className="btn-secondary" onClick={() => navigate('/works')}>Quay lại</button>
      </div>
    );
  }

  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.employeeChecked).length / tasks.length) * 100) 
    : 0;

  return (
    <div className="work-detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/works')}>
          <ArrowLeft size={20} />
          <span>Danh sách đợt</span>
        </button>
        
        <div className="header-main">
          <div className="title-section">
            <div className="badge-id">Batch #{work.id}</div>
            <h2>{work.title}</h2>
            <div className="subtitle">
              <span>Được tạo cho Object: <strong>{work.object?.name || 'N/A'}</strong></span>
              <span className="divider">|</span>
              <Calendar size={14} />
              <span>Bắt đầu: {new Date(work.startDate).toLocaleDateString('vi-VN')}</span>
              {work.exportDate && (
                <>
                  <span className="divider">|</span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Xuất gà: {new Date(work.exportDate).toLocaleDateString('vi-VN')}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="progress-section">
            <div className="progress-info">
              <span>Tiến độ hoàn thành: {completionRate}%</span>
              <span>{tasks.filter(t => t.employeeChecked).length}/{tasks.length} nhiệm vụ</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="tasks-section">
        <div className="section-title">
          <h3>Danh Sách Nhiệm Vụ Chi Tiết</h3>
          <p>Cập nhật trạng thái và số lượng thực tế cho từng đầu việc</p>
        </div>

        <div className="task-list">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.employeeChecked ? 'checked' : ''}`}>
                <div className="task-main-info">
                  <div className="task-title-group">
                    <h4>{task.taskName}</h4>
                    {task.description && (
                      <div className="task-desc">
                        <Info size={12} />
                        <span>{task.description}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="task-date">
                    <Calendar size={14} />
                    <span>Dự kiến: {new Date(task.startDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="task-controls">
                  <div className="control-group">
                    <label>Số lượng (QTY)</label>
                    <input 
                      type="number" 
                      defaultValue={task.quantity || ''}
                      onBlur={(e) => handleUpdateTaskData(task.id, 'quantity', e.target.value)}
                      placeholder="-"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Loại bỏ (Removal)</label>
                    <input 
                      type="number" 
                      defaultValue={task.removalCount || ''}
                      onBlur={(e) => handleUpdateTaskData(task.id, 'removalCount', e.target.value)}
                      placeholder="-"
                      className="removal-input"
                    />
                  </div>

                  <div className="check-buttons">
                    <button 
                      className={`check-btn employee ${task.employeeChecked ? 'active' : ''}`}
                      onClick={() => handleToggleCheck(task.id, 'employeeChecked', task.employeeChecked)}
                      title="Nhân viên xác nhận"
                    >
                      {task.employeeChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      <span>Nhân viên</span>
                    </button>
                    
                    <button 
                      className={`check-btn manager ${task.managerChecked ? 'active' : ''}`}
                      onClick={() => handleToggleCheck(task.id, 'managerChecked', task.managerChecked)}
                      title="Quản lý xác nhận"
                    >
                      {task.managerChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      <span>Quản lý</span>
                    </button>
                  </div>

                  <button className="delete-task-btn" onClick={() => handleDeleteTask(task.id)} title="Xóa nhiệm vụ">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-tasks">
              <p>Chưa có nhiệm vụ nào trong đợt này.</p>
            </div>
          )}
        </div>
      </div>

      {work.orders && work.orders.length > 0 && (
        <div className="orders-section" style={{ marginTop: '2.5rem' }}>
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <ShoppingBag size={22} color="#059669" />
               <h3>Chi Tiết Đơn Hàng Liên Kết</h3>
            </div>
            <p>Danh sách các đơn hàng đóng góp vào tổng số lượng của đợt này</p>
          </div>

          <div className="table-responsive" style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Loại</th>
                  <th>Số Lượng</th>
                  <th>Ngày Đặt</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {work.orders.map((order: any) => (
                  <tr key={order.id}>
                    <td><span className="order-id-tag">#{order.id}</span></td>
                    <td>
                      <div className="user-info-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserIcon size={14} />
                        <span>{order.user?.fullName || order.user?.username || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{order.type === 'MUA_GA' ? 'Mua gà' : 'Đặt gà'}</td>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{order.quantity?.toLocaleString('vi-VN')}</td>
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <span>Chi tiết Đơn</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkDetail;

// Helper AlertCircle for Error handled locally
const AlertCircle: React.FC<{ size: number, color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

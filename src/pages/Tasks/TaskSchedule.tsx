import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Briefcase,
  User as UserIcon,
  ShieldCheck,
  History,
  X,
  Activity,
  ArrowRight
} from 'lucide-react';
import api from '../../api/axios';
import './TaskSchedule.css';

interface WorkTask {
  id: string;
  taskName: string;
  description?: string;
  startDate: string;
  employeeChecked: boolean;
  managerChecked: boolean;
  quantity?: number;
  removalCount?: number;
  workId: string;
  work?: {
    title: string;
    object?: {
      name: string;
    }
  }
}

interface TaskHistoryData {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  createdBy?: string;
  createdAt: string;
}

const TaskSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<WorkTask | null>(null);
  const [taskHistories, setTaskHistories] = useState<TaskHistoryData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const dateStr = formatDate(selectedDate);
      const res = await api.get('/works/tasks', {
        params: {
          startDate: dateStr,
          limit: 100 // Load all tasks for the day
        }
      });
      if (res.data && Array.isArray(res.data.data)) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const setDay = (type: 'yesterday' | 'today' | 'tomorrow') => {
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const toggleStatus = async (task: WorkTask, field: 'employeeChecked' | 'managerChecked') => {
    try {
      setIsUpdating(true);
      const newVal = !task[field];
      await api.put(`/works/tasks/${task.id}`, { [field]: newVal });
      
      // Update local state
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, [field]: newVal } : t));
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateData = async (taskId: string, field: 'quantity' | 'removalCount', val: string) => {
    const numVal = val === '' ? null : Number(val);
    try {
      await api.put(`/works/tasks/${taskId}`, { [field]: numVal });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: numVal ?? undefined } : t));
    } catch (err) {
      console.error('Error updating task data:', err);
    }
  };

  const handleOpenHistory = async (task: WorkTask) => {
    setSelectedHistoryTask(task);
    setIsHistoryLoading(true);
    setTaskHistories([]);
    try {
      const res = await api.get(`/works/tasks/${task.id}/history`);
      if (res.data && res.data.data) {
        setTaskHistories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching task history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setSelectedHistoryTask(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="task-schedule-container">
      <div className="schedule-header">
        <div className="header-top">
          <div className="title-section">
            <h2>Lịch Trình Công Việc</h2>
            <p className="subtitle">Quản lý và theo dõi nhiệm vụ hàng ngày</p>
          </div>
          
          <div className="quick-nav">
            <button 
              className={`nav-btn ${formatDate(selectedDate) === formatDate(new Date(new Date().setDate(new Date().getDate() - 1))) ? 'active' : ''}`}
              onClick={() => setDay('yesterday')}
            >
              Hôm qua
            </button>
            <button 
              className={`nav-btn ${isToday(selectedDate) ? 'active' : ''}`}
              onClick={() => setDay('today')}
            >
              Hôm nay
            </button>
            <button 
              className={`nav-btn ${formatDate(selectedDate) === formatDate(new Date(new Date().setDate(new Date().getDate() + 1))) ? 'active' : ''}`}
              onClick={() => setDay('tomorrow')}
            >
              Ngày mai
            </button>
          </div>
        </div>

        <div className="date-selector">
          <button className="arrow-btn" onClick={() => handleDateChange(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="current-date">
            <Calendar size={20} />
            <span>{selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button className="arrow-btn" onClick={() => handleDateChange(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="tasks-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Đang tải nhiệm vụ...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="task-grid">
            {tasks.map((task) => (
              <div key={task.id} className={`task-card-schedule ${task.employeeChecked ? 'completed' : ''}`}>
                <div className="task-batch-info">
                  <div className="batch-tag">
                    <Briefcase size={12} />
                    <span>{task.work?.title || 'Đợt nuôi'}</span>
                  </div>
                  <div className="object-tag">
                    <span>{task.work?.object?.name || 'Đối tượng'}</span>
                  </div>
                </div>

                <div className="task-main">
                  <div className="task-info">
                    <h3 className="task-name">{task.taskName}</h3>
                    {task.description && <div className="task-desc" dangerouslySetInnerHTML={{ __html: task.description }}></div>}
                  </div>
                  
                  <div className="task-data-inputs" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className="control-group">
                      <label>Số lượng (QTY)</label>
                      <input 
                        type="number" 
                        defaultValue={task.quantity || ''}
                        onBlur={(e) => handleUpdateData(task.id, 'quantity', e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="control-group">
                      <label>Loại bỏ (Removal)</label>
                      <input 
                        type="number" 
                        defaultValue={task.removalCount || ''}
                        onBlur={(e) => handleUpdateData(task.id, 'removalCount', e.target.value)}
                        placeholder="-"
                        className="removal-input"
                      />
                    </div>
                  </div>

                  <div className="task-actions-btns">
                    <button 
                      className={`status-toggle employee ${task.employeeChecked ? 'checked' : ''}`}
                      onClick={() => toggleStatus(task, 'employeeChecked')}
                      disabled={isUpdating}
                    >
                      {task.employeeChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      <span>Nhân viên</span>
                    </button>
                    
                    <button 
                      className={`status-toggle manager ${task.managerChecked ? 'checked' : ''}`}
                      onClick={() => toggleStatus(task, 'managerChecked')}
                      disabled={isUpdating}
                    >
                      {task.managerChecked ? <ShieldCheck size={18} /> : <Circle size={18} />}
                      <span>Quản lý</span>
                    </button>
                  </div>
                </div>

                <div className="task-footer">
                  <div className="time-info">
                     <Clock size={14} />
                     <span>Hạn: {new Date(task.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="footer-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="history-btn" onClick={() => handleOpenHistory(task)}>
                      <History size={14} />
                      <span>Lịch sử</span>
                    </button>
                    {task.employeeChecked && task.managerChecked && (
                      <div className="all-done-tag">
                        <CheckCircle2 size={12} />
                        <span>Đã hoàn tất</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Calendar size={48} />
            </div>
            <h3>Không có nhiệm vụ nào</h3>
            <p>Vui lòng chọn ngày khác hoặc kiểm tra lại lịch trình.</p>
          </div>
        )}
      </div>

      {/* HISTORY DRAWER */}
      {selectedHistoryTask && (
        <>
          <div className="history-overlay" onClick={handleCloseHistory}></div>
          <div className="history-drawer">
            <div className="history-drawer-header">
              <h3>Lịch sử cập nhật</h3>
              <button className="close-drawer-btn" onClick={handleCloseHistory}>
                <X size={20} />
              </button>
            </div>
            <div className="history-drawer-content">
              <div className="history-task-context">
                <h4>{selectedHistoryTask.taskName}</h4>
                <p>{selectedHistoryTask.work?.title || 'Đợt nuôi'} - {selectedHistoryTask.work?.object?.name || 'Đối tượng'}</p>
              </div>

              {isHistoryLoading ? (
                <div className="loading-state-small">
                  <div className="loader"></div>
                  <p>Đang tải lịch sử...</p>
                </div>
              ) : taskHistories.length > 0 ? (
                <div className="history-timeline">
                  {taskHistories.map((hist) => (
                    <div key={hist.id} className="history-item">
                      <div className="history-icon">
                         <Activity size={16} />
                      </div>
                      <div className="history-details">
                        <div className="history-action">{hist.action}</div>
                        <div className="history-change">
                          <span className="old-val">{hist.oldValue || 'Trống'}</span>
                          <ArrowRight size={12} className="val-arrow" />
                          <span className="new-val">{hist.newValue || 'Trống'}</span>
                        </div>
                        <div className="history-meta">
                          <span>Bởi: {hist.createdBy || 'Hệ thống'}</span>
                          <span>•</span>
                          <span>{new Date(hist.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-history">
                  <Activity size={32} />
                  <p>Chưa có lịch sử cập nhật nào cho nhiệm vụ này.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskSchedule;

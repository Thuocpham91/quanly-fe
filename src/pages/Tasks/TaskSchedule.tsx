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
  ShieldCheck
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
  workId: string;
  work?: {
    title: string;
    object?: {
      name: string;
    }
  }
}

const TaskSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
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
                  {task.employeeChecked && task.managerChecked && (
                    <div className="all-done-tag">
                      <CheckCircle2 size={12} />
                      <span>Đã hoàn tất</span>
                    </div>
                  )}
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
    </div>
  );
};

export default TaskSchedule;

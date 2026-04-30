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
  ArrowRight,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  Plus,
  Loader2
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
  fileUrls?: string[];
  workId: string;
  work?: {
    title: string;
    quantity?: number;
    object?: {
      name: string;
    };
    workTasks?: { removalCount?: number }[];
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
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<WorkTask | null>(null);
  const [taskHistories, setTaskHistories] = useState<TaskHistoryData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [works, setWorks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    taskName: '',
    workId: '',
    description: '',
    time: '08:00'
  });

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

  const fetchWorks = async () => {
    try {
      const res = await api.get('/works', { params: { limit: 100 } });
      if (res.data && res.data.data) {
        setWorks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching works:', err);
    }
  };

  useEffect(() => {
    if (isAddModalOpen && works.length === 0) {
      fetchWorks();
    }
  }, [isAddModalOpen, works.length]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.taskName || !newTaskForm.workId) return;

    try {
      setIsSubmitting(true);
      
      // Construct date correctly by setting time on a copy of selectedDate
      const startDateTime = new Date(selectedDate);
      const [hours, minutes] = newTaskForm.time.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      await api.post('/works/tasks', {
        taskName: newTaskForm.taskName,
        workId: Number(newTaskForm.workId),
        description: newTaskForm.description,
        startDate: startDateTime
      });

      setIsAddModalOpen(false);
      setNewTaskForm({ taskName: '', workId: '', description: '', time: '08:00' });
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Có lỗi xảy ra khi tạo nhiệm vụ.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleFileUpload = async (taskId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingTaskId(taskId);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await api.post('/files/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data && res.data.data) {
        const newUrls = res.data.data.map((f: any) => f.url);
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const updatedUrls = [...(task.fileUrls || []), ...newUrls];
          await api.put(`/works/tasks/${taskId}`, { fileUrls: updatedUrls });
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, fileUrls: updatedUrls } : t));
        }
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      alert('Có lỗi xảy ra khi tải file lên!');
    } finally {
      setUploadingTaskId(null);
      event.target.value = '';
    }
  };

  const handleRemoveFile = async (taskId: string, urlToRemove: string) => {
    if (!window.confirm('Bạn có chắc muốn xoá file này?')) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedUrls = (task.fileUrls || []).filter(url => url !== urlToRemove);
      try {
        await api.put(`/works/tasks/${taskId}`, { fileUrls: updatedUrls });
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, fileUrls: updatedUrls } : t));
      } catch (err) {
        console.error('Error removing file:', err);
      }
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
          <div className="date-nav-wrapper">
            <button className="arrow-btn" onClick={() => handleDateChange(-1)}>
              <ChevronLeft size={20} />
            </button>
            <div className="current-date">
              <Calendar size={20} />
              <span>{selectedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
            <button className="arrow-btn" onClick={() => handleDateChange(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            <span>Thêm nhiệm vụ</span>
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
                  {task.work?.quantity !== undefined && task.work.quantity !== null && (
                    <div className="object-tag" style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca' }}>
                      <span style={{ fontWeight: 600 }}>
                        Còn: {(() => {
                          const totalRemoval = task.work.workTasks?.reduce((sum, t) => sum + (t.removalCount || 0), 0) || 0;
                          const currentQty = task.work.quantity! - totalRemoval;
                          return Math.max(0, currentQty).toLocaleString('vi-VN');
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="task-main">
                  <div className="task-info">
                    <h3 className="task-name">{task.taskName}</h3>
                    {task.description && <div className="task-desc" dangerouslySetInnerHTML={{ __html: task.description }}></div>}
                  </div>
                  
                  <div className="task-data-inputs">
                    <div className="control-group">
                      <label>Số lượng</label>
                      <input 
                        type="number" 
                        defaultValue={task.quantity || ''}
                        onBlur={(e) => handleUpdateData(task.id, 'quantity', e.target.value)}
                        placeholder="-"
                      />
                    </div>
                    <div className="control-group">
                      <label>Loại bỏ</label>
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

                  {/* File Upload & Display */}
                  <div className="task-files-section">
                    {task.fileUrls && task.fileUrls.length > 0 && (
                      <div className="task-files-list">
                        {task.fileUrls.map((url, idx) => {
                          const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                          return (
                            <div key={idx} className="task-file-item">
                              <a href={url} target="_blank" rel="noreferrer" className="file-link">
                                {isImage ? <ImageIcon size={14} /> : <FileIcon size={14} />}
                              </a>
                              <button className="remove-file-btn" onClick={() => handleRemoveFile(task.id, url)} title="Xóa file">
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="task-footer">
                  <div className="footer-left">
                    <label className="upload-file-btn">
                      {uploadingTaskId === task.id ? <Loader2 size={14} className="spin" /> : <Paperclip size={14} />}
                      <span>Đính kèm</span>
                      <input type="file" multiple onChange={(e) => handleFileUpload(task.id, e)} style={{ display: 'none' }} disabled={uploadingTaskId === task.id} />
                    </label>
                  </div>
                  <div className="footer-right">
                    <div className="time-info">
                      <Clock size={14} />
                      <span>{new Date(task.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button className="history-btn" onClick={() => handleOpenHistory(task)}>
                      <History size={14} />
                    </button>
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

      {/* ADD TASK MODAL */}
      {isAddModalOpen && (
        <>
          <div className="history-overlay" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="add-task-modal">
            <div className="modal-header">
              <h3>Thêm nhiệm vụ mới</h3>
              <button className="close-modal-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-content">
              <div className="form-group">
                <label>Đợt công việc (Work)</label>
                <select 
                  required 
                  value={newTaskForm.workId} 
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, workId: e.target.value })}
                >
                  <option value="">-- Chọn đợt công việc --</option>
                  {works.map((w) => (
                    <option key={w.id} value={w.id}>{w.title} ({w.object?.name || 'N/A'})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tên nhiệm vụ</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ví dụ: Kiểm tra sức khỏe, Vệ sinh chuồng..."
                  value={newTaskForm.taskName}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, taskName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Thời gian dự kiến (Ngày {selectedDate.toLocaleDateString('vi-VN')})</label>
                <input 
                  type="time" 
                  required 
                  value={newTaskForm.time}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, time: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Mô tả (tuỳ chọn)</label>
                <textarea 
                  rows={3}
                  placeholder="Nhập ghi chú thêm nếu có..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Tạo nhiệm vụ'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskSchedule;

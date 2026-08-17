import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { Lunar } from 'lunar-javascript';
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
  Camera,
  File as FileIcon,
  Trash2,
  Plus,
  Loader2,
  Repeat,
  LayoutGrid,
  List,
  Search
} from 'lucide-react';
import api from '../../api/axios';
import { compressImage } from '../../utils/imageUtils';
import './TaskSchedule.css';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

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
  feedPerAnimal?: number;
  work?: {
    title: string;
    quantity?: number;
    object?: {
      name: string;
    };
    workTasks?: { removalCount?: number }[];
  };
  isRecurring?: boolean;
  hasEggCount?: boolean;
  eggCount?: number;
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
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  
  const [selectedHistoryTask, setSelectedHistoryTask] = useState<WorkTask | null>(null);
  const [taskHistories, setTaskHistories] = useState<TaskHistoryData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  // View mode & Calendar View states
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [monthlyTasks, setMonthlyTasks] = useState<WorkTask[]>([]);

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

  const handleScanFixedTasks = async () => {
    try {
      setIsLoading(true);
      const dateStr = formatDate(selectedDate);
      // Backend automatically generates recurring tasks when searchTasks is called with startDate.
      // So we just need to re-fetch tasks.
      await fetchTasks();
    } catch (err) {
      console.error('Error scanning fixed tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth();
      const startDate = formatDate(new Date(year, month, 1));
      const endDate = formatDate(new Date(year, month + 1, 0));
      
      const res = await api.get('/works/tasks', {
        params: {
          startDate,
          endDate,
          limit: 500
        }
      });
      if (res.data && Array.isArray(res.data.data)) {
        setMonthlyTasks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching monthly tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchMonthlyTasks();
    } else {
      fetchTasks();
    }
  }, [viewMode, fetchMonthlyTasks, fetchTasks]);

  const handleMonthChange = (delta: number) => {
    setCalendarMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const getCalendarDaysMatrix = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // 0 = Monday, ..., 6 = Sunday
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
    
    const matrix: Array<{ dayNum: number | null; dateObj: Date | null }> = [];
    
    // Padding before 1st of month
    for (let i = 0; i < startDayOfWeek; i++) {
      matrix.push({ dayNum: null, dateObj: null });
    }
    
    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      matrix.push({
        dayNum: d,
        dateObj: new Date(year, month, d)
      });
    }
    
    // Padding after end of month to complete grid
    while (matrix.length % 7 !== 0) {
      matrix.push({ dayNum: null, dateObj: null });
    }
    
    return matrix;
  };

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

  const handleUpdateData = async (taskId: string, field: 'quantity' | 'removalCount' | 'eggCount', val: string) => {
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
    
    try {
      const processedFiles = await Promise.all(
        Array.from(files).map(file => compressImage(file))
      );

      processedFiles.forEach((file) => {
        formData.append('files', file);
      });

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
      {/* Top Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Task Management</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Quản lý và theo dõi lịch trình công việc</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn-primary" 
            style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#6366f1' }}
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            <span>Thêm công việc</span>
          </button>
        </div>
      </div>

      {/* Control Bar: View Toggle, Search, Status Filter Pills */}
      <div className="calendar-controls-bar">
        <div className="view-mode-toggle-group">
          <button 
            className={viewMode === 'list' ? 'active' : ''} 
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
            <span>List View</span>
          </button>
          <button 
            className={viewMode === 'calendar' ? 'active' : ''} 
            onClick={() => setViewMode('calendar')}
          >
            <LayoutGrid size={16} />
            <span>Calendar View</span>
          </button>
        </div>

        <div className="calendar-search-input">
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Tìm theo nhiệm vụ, đối tượng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter-pills">
          <button 
            className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`status-pill ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Đang chờ
          </button>
          <button 
            className={`status-pill ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Hoàn thành
          </button>
          <button 
            className={`status-pill ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Đã hủy
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="calendar-view-container">
          {/* Month Navigation Header */}
          <div className="calendar-month-header">
            <button className="month-nav-arrow" onClick={() => handleMonthChange(-1)}>
              <ChevronLeft size={20} />
            </button>
            <h3 className="month-title">
              Tháng {calendarMonth.getMonth() + 1}, {calendarMonth.getFullYear()}
            </h3>
            <button className="month-nav-arrow" onClick={() => handleMonthChange(1)}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid-wrapper">
            <div className="calendar-week-header">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            <div className="calendar-days-grid">
              {getCalendarDaysMatrix(calendarMonth).map((cell, idx) => {
                if (!cell.dayNum || !cell.dateObj) {
                  return <div key={idx} className="calendar-day-cell empty"></div>;
                }

                const dateStr = formatDate(cell.dateObj);
                const isCellToday = isToday(cell.dateObj);

                // Filter tasks for this day
                const dayTasks = monthlyTasks.filter(t => {
                  if (!t.startDate) return false;
                  const taskDateStr = formatDate(new Date(t.startDate));
                  if (taskDateStr !== dateStr) return false;

                  // Status filter
                  if (statusFilter === 'pending' && (t.employeeChecked || t.managerChecked)) return false;
                  if (statusFilter === 'completed' && !t.employeeChecked && !t.managerChecked) return false;

                  // Search term filter
                  if (searchTerm) {
                    const matchName = (t.taskName || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const matchWork = (t.work?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const matchObj = (t.work?.object?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                    if (!matchName && !matchWork && !matchObj) return false;
                  }

                  return true;
                });

                return (
                  <div 
                    key={idx} 
                    className={`calendar-day-cell ${isCellToday ? 'today' : ''}`}
                    onClick={() => {
                      setSelectedDate(cell.dateObj!);
                      setViewMode('list');
                    }}
                  >
                    <div className="cell-day-num">{cell.dayNum}</div>
                    
                    <div className="cell-tasks-list">
                      {dayTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id} 
                          className={`calendar-task-item ${task.employeeChecked ? 'done' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(task, 'employeeChecked');
                          }}
                          title={`${task.taskName} - ${task.work?.title || ''}`}
                        >
                          <span className="task-dot"></span>
                          <span className="task-title-text">{task.taskName}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="more-tasks-tag">+{dayTasks.length - 3} nữa</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div>
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
                <div className="current-date" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.2', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={20} />
                    <span>{selectedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    ({Lunar.fromDate(selectedDate).getDay()}/{Lunar.fromDate(selectedDate).getMonth()} ÂL)
                  </span>
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
              <button 
                className="btn-secondary" 
                style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                onClick={handleScanFixedTasks}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 size={16} className="spin" /> : <Repeat size={16} />}
                <span>Quét task cố định</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div 
                  className="task-batch-info" 
                  onClick={() => navigate(`/admin/works/${task.workId}`)}
                  style={{ cursor: 'pointer' }}
                  title="Xem chi tiết đợt công việc"
                >
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
                        SL: {task.work.quantity.toLocaleString('vi-VN')} | Còn: {(() => {
                          const totalRemoval = task.work.workTasks?.reduce((sum, t) => sum + (t.removalCount || 0), 0) || 0;
                          const currentQty = task.work.quantity! - totalRemoval;
                          return Math.max(0, currentQty).toLocaleString('vi-VN');
                        })()}
                      </span>
                    </div>
                  )}
                  {task.feedPerAnimal !== undefined && task.feedPerAnimal !== null && task.feedPerAnimal > 0 && task.work?.quantity !== undefined && (
                    <div className="object-tag" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                      <span style={{ fontWeight: 600 }}>
                        Tổng cám: {(() => {
                          const totalRemoval = task.work.workTasks?.reduce((sum, t) => sum + (t.removalCount || 0), 0) || 0;
                          const currentQty = Math.max(0, task.work.quantity! - totalRemoval);
                          const totalFeedGrams = currentQty * task.feedPerAnimal!;
                          if (totalFeedGrams >= 1000) {
                            return (totalFeedGrams / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' kg';
                          }
                          return totalFeedGrams.toLocaleString('vi-VN') + ' g';
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="task-main">
                  <div className="task-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 className="task-name">{task.taskName}</h3>
                      {task.isRecurring && (
                        <div title="Nhiệm vụ lặp lại hàng ngày" style={{ color: '#c2410c', display: 'flex', alignItems: 'center' }}>
                          <Repeat size={14} />
                        </div>
                      )}
                    </div>
                    {task.description && <div className="task-desc ql-editor" style={{ padding: 0, whiteSpace: /<(p|br|ul|ol|li|strong|em|u|span|div|h[1-6])[>\s/]/i.test(task.description) ? 'normal' : 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: task.description }}></div>}
                  </div>
                  
                  <div className="task-data-inputs">
                    {task.hasEggCount && (
                      <div className="control-group" style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
                        <label style={{ color: '#9a3412' }}>Số trứng</label>
                        <input 
                          type="number" 
                          defaultValue={task.eggCount || ''}
                          onBlur={(e) => handleUpdateData(task.id, 'eggCount', e.target.value)}
                          placeholder="SL trứng"
                          className="quantity-input"
                          style={{ borderColor: '#fdba74' }}
                        />
                      </div>
                    )}

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
                          const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
                          return (
                            <div key={idx} className="task-file-item">
                              {isImage ? (
                                <button
                                  className="file-link file-img-thumb"
                                  onClick={() => setLightboxUrl(url)}
                                  title="Xem ảnh"
                                >
                                  <img src={url} alt={`file-${idx}`} className="thumb-preview" />
                                </button>
                              ) : (
                                <a href={url} target="_blank" rel="noreferrer" className="file-link">
                                  <FileIcon size={14} />
                                </a>
                              )}
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
                      {uploadingTaskId === task.id ? <Loader2 size={14} className="spin" /> : <Camera size={14} />}
                      <span>Chụp ảnh</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        multiple 
                        onChange={(e) => handleFileUpload(task.id, e)} 
                        style={{ display: 'none' }} 
                        disabled={uploadingTaskId === task.id} 
                      />
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
                <ReactQuill 
                  theme="snow"
                  value={newTaskForm.description} 
                  onChange={(val) => setNewTaskForm({ ...newTaskForm, description: val })}
                  placeholder="Nhập ghi chú thêm nếu có..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ],
                  }}
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
      {/* IMAGE LIGHTBOX */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>
              <X size={24} />
            </button>
            <img src={lightboxUrl} alt="preview" className="lightbox-img" />
            <a href={lightboxUrl} target="_blank" rel="noreferrer" className="lightbox-download">
              Mở ảnh gốc ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskSchedule;

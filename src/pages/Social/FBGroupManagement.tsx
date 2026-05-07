import React, { useState, useEffect } from 'react';
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Search
} from 'lucide-react';
import api from '../../api/axios';
import './Social.css';

// Custom Facebook Icon since lucide-react version might not export it
const Facebook: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = "currentColor" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

interface FBGroup {
  id: string;
  name: string;
  url: string;
  type?: string;
}

const groupTypes = [
  { value: 'MUA_BAN', label: 'Mua bán / Giao dịch' },
  { value: 'KY_THUAT', label: 'Kỹ thuật / Chăn nuôi' },
  { value: 'CONG_DONG', label: 'Hội nhóm / Cộng đồng' },
  { value: 'VUNG_MIEN', label: 'Theo vùng miền' },
  { value: 'KHAC', label: 'Khác' }
];

const FBGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<FBGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroup, setEditingGroup] = useState<FBGroup | null>(null);
  const [form, setForm] = useState({ name: '', url: '', type: 'KHAC' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/social/groups');
      if (res.data) {
        setGroups(res.data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await api.put(`/social/groups/${editingGroup.id}`, form);
      } else {
        await api.post('/social/groups', form);
      }
      fetchGroups();
      closeModal();
    } catch (err) {
      console.error('Error saving group:', err);
      alert('Không thể lưu nhóm.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhóm này?')) {
      try {
        await api.delete(`/social/groups/${id}`);
        fetchGroups();
      } catch (err) {
        console.error('Error deleting group:', err);
      }
    }
  };

  const openModal = (group?: FBGroup) => {
    if (group) {
      setEditingGroup(group);
      setForm({ name: group.name, url: group.url, type: group.type || 'KHAC' });
    } else {
      setEditingGroup(null);
      setForm({ name: '', url: '', type: 'KHAC' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setForm({ name: '', url: '', type: 'KHAC' });
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.type && g.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="social-container">
      <div className="social-header">
        <div>
          <h2>Quản lý Hội nhóm Facebook</h2>
          <p>Phân loại và quản lý các nhóm Facebook của bạn</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} />
          <span>Thêm nhóm mới</span>
        </button>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhóm theo tên hoặc loại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.625rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>

      <div className="group-grid">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => (
            <div key={group.id} className="group-card">
              <div className="group-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Facebook size={20} color="#1877f2" />
                  {group.type && (
                    <span style={{ fontSize: '0.7rem', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px', color: '#0369a1', fontWeight: 600 }}>
                      {groupTypes.find(t => t.value === group.type)?.label || group.type}
                    </span>
                  )}
                </div>
                <h3>{group.name}</h3>
                <div className="group-url">{group.url}</div>
              </div>
              <div className="group-actions">
                <a href={group.url} target="_blank" rel="noreferrer" className="btn-open-group">
                  <ExternalLink size={16} />
                  <span>Mở nhóm</span>
                </a>
                <button className="btn-edit-group" onClick={() => openModal(group)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-delete-group" onClick={() => handleDelete(group.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', color: '#64748b' }}>
            Chưa có nhóm nào. Nhấn "Thêm nhóm mới" để bắt đầu.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeModal}>
          <div className="modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingGroup ? 'Chỉnh sửa nhóm' : 'Thêm nhóm Facebook mới'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Tên nhóm *</label>
                <input 
                  type="text" 
                  required 
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Hội Chăn Nuôi Gà"
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Đường dẫn (URL) *</label>
                <input 
                  type="url" 
                  required 
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://facebook.com/groups/..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Loại hội nhóm *</label>
                <select 
                  required
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
                >
                  {groupTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FBGroupManagement;

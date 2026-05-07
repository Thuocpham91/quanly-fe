import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Edit2, Facebook, Search } from 'lucide-react';
import './Social.css';

interface FBGroup {
  id: string;
  name: string;
  url: string;
  category?: string;
}

const FBGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<FBGroup[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroup, setEditingGroup] = useState<FBGroup | null>(null);
  const [form, setForm] = useState({ name: '', url: '', category: '' });

  useEffect(() => {
    const savedGroups = localStorage.getItem('fb_groups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    } else {
      // Default groups for demo
      const defaults = [
        { id: '1', name: 'Hội Gà Giống Miền Bắc', url: 'https://www.facebook.com/groups/hoigagiongmienbac', category: 'Kinh doanh' },
        { id: '2', name: 'Kỹ Thuật Chăn Nuôi Gà', url: 'https://www.facebook.com/groups/kythuatchannuoiga', category: 'Kỹ thuật' }
      ];
      setGroups(defaults);
      localStorage.setItem('fb_groups', JSON.stringify(defaults));
    }
  }, []);

  const saveToStorage = (newGroups: FBGroup[]) => {
    setGroups(newGroups);
    localStorage.setItem('fb_groups', JSON.stringify(newGroups));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      const updated = groups.map(g => g.id === editingGroup.id ? { ...g, ...form } : g);
      saveToStorage(updated);
    } else {
      const newGroup = {
        id: Date.now().toString(),
        ...form
      };
      saveToStorage([...groups, newGroup]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhóm này?')) {
      const filtered = groups.filter(g => g.id !== id);
      saveToStorage(filtered);
    }
  };

  const openModal = (group?: FBGroup) => {
    if (group) {
      setEditingGroup(group);
      setForm({ name: group.name, url: group.url, category: group.category || '' });
    } else {
      setEditingGroup(null);
      setForm({ name: '', url: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setForm({ name: '', url: '', category: '' });
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="social-container">
      <div className="social-header">
        <div>
          <h2>Quản lý Hội nhóm Facebook</h2>
          <p>Lưu danh sách các nhóm bạn thường xuyên đăng bài để truy cập nhanh</p>
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
            placeholder="Tìm kiếm nhóm..." 
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
                  {group.category && <span style={{ fontSize: '0.7rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: '#64748b' }}>{group.category}</span>}
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Danh mục (tùy chọn)</label>
                <input 
                  type="text" 
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Ví dụ: Kinh doanh, Kỹ thuật..."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
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

import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Image as ImageIcon, 
  ExternalLink, 
  Settings, 
  Facebook, 
  Trash2,
  AlertCircle,
  Save,
  Clock,
  Plus
} from 'lucide-react';
import api from '../../api/axios';
import { compressImage } from '../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import './Social.css';

interface FBGroup {
  id: string;
  name: string;
  url: string;
  category?: string;
}

interface FBTemplate {
  id: string;
  content: string;
  fileUrls?: string[];
  createdAt: string;
}

const FacebookAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [groups, setGroups] = useState<FBGroup[]>([]);
  const [templates, setTemplates] = useState<FBTemplate[]>([]);
  const [isCompresing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/social/templates');
      if (res.data) {
        setTemplates(res.data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsCompressing(true);
    try {
      const newImages = await Promise.all(
        Array.from(files).map(async (file) => {
          const compressed = await compressImage(file);
          return {
            file: compressed,
            preview: URL.createObjectURL(compressed)
          };
        })
      );
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      console.error('Error compressing images:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    });
  };

  const handleSaveTemplate = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      let fileUrls: string[] = [];
      
      // Upload images if any
      const imagesToUpload = images.filter(img => !img.url);
      if (imagesToUpload.length > 0) {
        const formData = new FormData();
        imagesToUpload.forEach(img => formData.append('files', img.file));
        const uploadRes = await api.post('/files/upload-multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data && uploadRes.data.data) {
          fileUrls = uploadRes.data.data.map((f: any) => f.url);
        }
      }

      // Add existing urls
      const existingUrls = images.filter(img => img.url).map(img => img.url!);
      fileUrls = [...existingUrls, ...fileUrls];

      await api.post('/social/templates', {
        content,
        fileUrls
      });
      
      alert('Đã lưu mẫu bài đăng thành công!');
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Không thể lưu mẫu.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadTemplate = (template: FBTemplate) => {
    if (content && !window.confirm('Nội dung hiện tại sẽ bị thay thế. Bạn có chắc chắn?')) return;
    setContent(template.content);
    setImages(template.fileUrls?.map(url => ({
      file: new File([], 'remote-file'), // placeholder
      preview: url,
      url: url
    })) || []);
  };

  const deleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa mẫu này?')) return;
    try {
      await api.delete(`/social/templates/${id}`);
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  return (
    <div className="social-container">
      <div className="social-header">
        <div>
          <h2>Trợ lý Đăng bài Facebook</h2>
          <p>Soạn nội dung, nén ảnh và đăng bài vào hội nhóm một cách nhanh chóng</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => navigate('/admin/social/groups')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} />
            <span>Quản lý nhóm</span>
          </button>
        </div>
      </div>

      <div className="assistant-grid">
        <div className="post-editor-section">
          <div className="post-editor-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2Icon size={18} />
                <span>Nội dung bài đăng</span>
              </h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleSaveTemplate}
                disabled={isSaving || !content}
              >
                {isSaving ? <Check size={14} /> : <Save size={14} />}
                <span>Lưu thành bài mẫu</span>
              </button>
            </div>
            
            <textarea 
              className="post-content-area"
              placeholder="Nhập nội dung bài đăng của bạn tại đây... (Ví dụ: Gà giống siêu trứng, liên hệ ngay...)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <div className="image-section">
              <label className="image-upload-zone">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleImageChange}
                  disabled={isCompresing}
                />
                <ImageIcon size={32} style={{ marginBottom: '0.5rem', color: '#1877f2' }} />
                <p>{isCompresing ? 'Đang nén ảnh...' : 'Nhấn để thêm hình ảnh hoặc chụp ảnh'}</p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ảnh sẽ được tự động tối ưu dung lượng</span>
              </label>

              {images.length > 0 && (
                <div className="preview-images">
                  {images.map((img, idx) => (
                    <div key={idx} className="preview-image-item">
                      <img src={img.preview} alt={`preview-${idx}`} />
                      <button className="remove-img-btn" onClick={() => removeImage(idx)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="assistant-actions">
              <button 
                className={`btn-copy ${isCopying ? 'success' : ''}`} 
                onClick={handleCopy}
                disabled={!content}
              >
                {isCopying ? <Check size={18} /> : <Copy size={18} />}
                <span>{isCopying ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                <span>Sau khi sao chép, hãy mở nhóm ở bên cạnh và dán vào.</span>
              </div>
            </div>
          </div>

          {/* Templates Section for Mobile/Below Editor */}
          <div className="template-section">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#64748b" />
              <span>Bài đăng mẫu đã lưu</span>
            </h3>
            <div className="template-list">
              {templates.length > 0 ? (
                templates.map(tpl => (
                  <div key={tpl.id} className="template-card" onClick={() => loadTemplate(tpl)}>
                    <div className="template-content">{tpl.content}</div>
                    <div className="template-meta">
                      <div className="template-imgs-count">
                        <ImageIcon size={12} />
                        <span>{tpl.fileUrls?.length || 0} ảnh</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>{new Date(tpl.createdAt).toLocaleDateString('vi-VN')}</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                          onClick={(e) => deleteTemplate(e, tpl.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Chưa có bài mẫu nào được lưu.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-groups">
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <h3>
              <Facebook size={20} color="#1877f2" />
              <span>Mở nhanh Hội nhóm</span>
            </h3>
            <div className="mini-group-list">
              {groups.length > 0 ? (
                groups.map(group => (
                  <a 
                    key={group.id} 
                    href={group.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="mini-group-item"
                    title={`Mở ${group.name}`}
                  >
                    <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.name}
                    </span>
                    <ExternalLink size={14} />
                  </a>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                  Chưa có nhóm nào được lưu.
                  <button 
                    onClick={() => navigate('/admin/social/groups')}
                    style={{ display: 'block', margin: '0.5rem auto', color: '#1877f2', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Thêm ngay
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={14} />
                <span>Mẹo nhỏ</span>
              </h4>
              <p style={{ fontSize: '0.75rem', color: '#1e40af', lineHeight: '1.4' }}>
                Lưu các bài đăng hay dùng thành "Mẫu" để đăng nhanh vào nhiều nhóm khác nhau mà không cần soạn lại.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Edit Icon since I forgot to import it
const Edit2Icon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

export default FacebookAssistant;

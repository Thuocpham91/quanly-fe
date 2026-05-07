import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Image as ImageIcon, 
  ExternalLink, 
  Settings, 
  Facebook, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import './Social.css';

interface FBGroup {
  id: string;
  name: string;
  url: string;
  category?: string;
}

const FacebookAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [groups, setGroups] = useState<FBGroup[]>([]);
  const [isCompresing, setIsCompressing] = useState(false);

  useEffect(() => {
    const savedGroups = localStorage.getItem('fb_groups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

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

  return (
    <div className="social-container">
      <div className="social-header">
        <div>
          <h2>Trợ lý Đăng bài Facebook</h2>
          <p>Soạn nội dung, nén ảnh và đăng bài vào hội nhóm một cách nhanh chóng</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/admin/social/groups')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={18} />
          <span>Quản lý nhóm</span>
        </button>
      </div>

      <div className="assistant-grid">
        <div className="post-editor-section">
          <div className="post-editor-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit2Icon size={18} />
              <span>Nội dung bài đăng</span>
            </h3>
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
        </div>

        <div className="sidebar-groups">
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

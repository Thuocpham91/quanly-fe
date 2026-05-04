import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Lunar } from 'lunar-javascript';
import {
  Plus, X, Edit2, Trash2, Search, TrendingUp, TrendingDown, Minus,
  Calendar, DollarSign, Tag, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './ChickenPriceManagement.css';

interface PriceData {
  id: string;
  priceDate: string;
  pricePerKg: number;
  pricePerHead?: number;
  priceGaSo?: number;
  priceGaTrong?: number;
  priceGaMai?: number;
  note?: string;
  createdAt: string;
}

const ChickenPriceManagement: React.FC = () => {
  const { user } = useAuth();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [todayPrice, setTodayPrice] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceData | null>(null);
  const [error, setError] = useState('');

  const roleCode = typeof user?.role === 'object' && user?.role !== null
    ? user.role.code?.toUpperCase()
    : typeof user?.role === 'string' ? user.role.toUpperCase() : '';
  const isAdmin = ['ADMIN', 'MANAGER', 'STAFF'].includes(roleCode);

  const [formData, setFormData] = useState({
    priceDate: new Date().toISOString().split('T')[0],
    pricePerKg: '' as string | number,
    pricePerHead: '' as string | number,
    priceGaSo: '' as string | number,
    priceGaTrong: '' as string | number,
    priceGaMai: '' as string | number,
    note: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [allRes, todayRes] = await Promise.all([
        api.get('/chicken-prices'),
        api.get('/chicken-prices/today')
      ]);
      if (allRes.data?.data) setPrices(allRes.data.data);
      if (todayRes.data?.data) setTodayPrice(todayRes.data.data);
    } catch (err) {
      console.error('Error fetching chicken prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatPrice = (val: string | number) => {
    if (!val && val !== 0) return '';
    return Number(String(val).replace(/\D/g, '')).toLocaleString('vi-VN');
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: rawVal }));
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      priceDate: new Date().toISOString().split('T')[0],
      pricePerKg: '',
      pricePerHead: '',
      priceGaSo: '',
      priceGaTrong: '',
      priceGaMai: '',
      note: ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: PriceData) => {
    setEditingItem(item);
    setFormData({
      priceDate: item.priceDate ? new Date(item.priceDate).toISOString().split('T')[0] : '',
      pricePerKg: item.pricePerKg,
      pricePerHead: item.pricePerHead || '',
      priceGaSo: item.priceGaSo || '',
      priceGaTrong: item.priceGaTrong || '',
      priceGaMai: item.priceGaMai || '',
      note: item.note || ''
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.priceDate || !formData.pricePerKg) {
      setError('Vui lòng nhập đầy đủ ngày và giá/kg!');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        priceDate: formData.priceDate,
        pricePerKg: Number(String(formData.pricePerKg).replace(/\D/g, '')),
        pricePerHead: formData.pricePerHead ? Number(String(formData.pricePerHead).replace(/\D/g, '')) : undefined,
        priceGaSo: formData.priceGaSo ? Number(String(formData.priceGaSo).replace(/\D/g, '')) : undefined,
        priceGaTrong: formData.priceGaTrong ? Number(String(formData.priceGaTrong).replace(/\D/g, '')) : undefined,
        priceGaMai: formData.priceGaMai ? Number(String(formData.priceGaMai).replace(/\D/g, '')) : undefined,
        note: formData.note || undefined
      };
      if (editingItem) {
        await api.put(`/chicken-prices/${editingItem.id}`, payload);
      } else {
        await api.post('/chicken-prices', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi giá này?')) return;
    try {
      await api.delete(`/chicken-prices/${id}`);
      fetchData();
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa!');
    }
  };

  const getTrend = (current: PriceData, all: PriceData[]) => {
    const idx = all.findIndex(p => p.id === current.id);
    const prev = all[idx + 1];
    if (!prev) return null;
    const diff = current.pricePerKg - prev.pricePerKg;
    return diff;
  };

  const filtered = prices.filter(p => {
    if (!searchTerm) return true;
    const dateStr = new Date(p.priceDate).toLocaleDateString('vi-VN');
    return dateStr.includes(searchTerm) || (p.note || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(dateStr).toISOString().split('T')[0] === today;
  };

  return (
    <div className="price-page-container">
      {/* Today Price Banner */}
      <div className="today-price-banner">
        <div className="banner-icon">🐔</div>
        <div className="banner-content">
          <div className="banner-label">Giá gà hôm nay • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ({Lunar.fromDate(new Date()).getDay()}/{Lunar.fromDate(new Date()).getMonth()} ÂL)</div>
          {todayPrice ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {/* If we have breakdown prices, show them prominently */}
              {(todayPrice.priceGaSo || todayPrice.priceGaTrong || todayPrice.priceGaMai) ? (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  {todayPrice.priceGaSo && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà xô</span>
                      <span style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>{Number(todayPrice.priceGaSo).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {todayPrice.priceGaTrong && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà trống</span>
                      <span style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>{Number(todayPrice.priceGaTrong).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  {todayPrice.priceGaMai && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Gà mái</span>
                      <span style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>{Number(todayPrice.priceGaMai).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback if no breakdown exists */
                <div className="banner-prices">
                  <div className="price-main">
                    <span className="price-value">{Number(todayPrice.pricePerKg).toLocaleString('vi-VN')}</span>
                    <span className="price-unit">đ/kg</span>
                  </div>
                </div>
              )}

              {todayPrice.note && (
                <div className="price-note" style={{ marginTop: '0.2rem' }}>
                  <AlertCircle size={13} />
                  <span>{todayPrice.note}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="banner-no-price">Chưa cập nhật giá hôm nay</div>
          )}
        </div>

        {isAdmin && (
          <div className="banner-action">
            <CheckCircle2 size={20} style={{ color: '#86efac' }} />
            <span style={{ fontSize: '0.8rem', color: '#bbf7d0' }}>
              {todayPrice ? 'Đã cập nhật' : 'Chưa cập nhật'}
            </span>
          </div>
        )}
      </div>

      <div className="page-header" style={{ marginTop: '1.5rem' }}>
        <div className="page-title">
          <h2>Quản Lý Giá Gà</h2>
          <p>Theo dõi biến động giá gà theo ngày</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Thêm Giá Mới</span>
          </button>
        )}
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo ngày hoặc ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader-large" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giá / Kg</th>
                  <th>Gà sô</th>
                  <th>Gà trống</th>
                  <th>Gà mái</th>
                  <th>Biến động</th>
                  <th>Ghi chú</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((item) => {
                  const trend = getTrend(item, prices);
                  return (
                    <tr key={item.id} className={isToday(item.priceDate) ? 'row-today' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={14} style={{ color: '#94a3b8' }} />
                          <span style={{ fontWeight: isToday(item.priceDate) ? 700 : 500 }}>
                            {new Date(item.priceDate).toLocaleDateString('vi-VN')}
                          </span>
                          {isToday(item.priceDate) && (
                            <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '999px' }}>
                              Hôm nay
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <DollarSign size={14} style={{ color: '#f59e0b' }} />
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                            {Number(item.pricePerKg).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.priceGaSo ? (
                          <span style={{ fontWeight: 500 }}>{Number(item.priceGaSo).toLocaleString('vi-VN')}đ</span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td>
                        {item.priceGaTrong ? (
                          <span style={{ fontWeight: 500 }}>{Number(item.priceGaTrong).toLocaleString('vi-VN')}đ</span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td>
                        {item.priceGaMai ? (
                          <span style={{ fontWeight: 500 }}>{Number(item.priceGaMai).toLocaleString('vi-VN')}đ</span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td>
                        {trend === null ? (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        ) : trend > 0 ? (
                          <span className="trend-up"><TrendingUp size={14} /> +{trend.toLocaleString('vi-VN')}đ</span>
                        ) : trend < 0 ? (
                          <span className="trend-down"><TrendingDown size={14} /> {trend.toLocaleString('vi-VN')}đ</span>
                        ) : (
                          <span className="trend-flat"><Minus size={14} /> Không đổi</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', color: '#64748b', fontSize: '0.85rem' }}>
                        {item.note || '—'}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit" onClick={() => openEditModal(item)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => handleDelete(item.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Chưa có dữ liệu giá gà nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Cập Nhật Giá Gà' : 'Thêm Giá Gà Mới'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Ngày *</label>
                  <input
                    type="date"
                    value={formData.priceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceDate: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Giá / Kg (VNĐ) *</label>
                    <input
                      type="text"
                      value={formatPrice(formData.pricePerKg)}
                      onChange={(e) => handleNumberChange(e, 'pricePerKg')}
                      placeholder="VD: 85.000"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giá / Con (VNĐ)</label>
                    <input
                      type="text"
                      value={formatPrice(formData.pricePerHead)}
                      onChange={(e) => handleNumberChange(e, 'pricePerHead')}
                      placeholder="VD: 150.000"
                    />
                  </div>
                </div>

                <div className="price-breakdown-section">
                  <h4>Giá chi tiết theo loại (VNĐ)</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gà sô</label>
                      <input
                        type="text"
                        value={formatPrice(formData.priceGaSo)}
                        onChange={(e) => handleNumberChange(e, 'priceGaSo')}
                        placeholder="VD: 85.000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gà trống</label>
                      <input
                        type="text"
                        value={formatPrice(formData.priceGaTrong)}
                        onChange={(e) => handleNumberChange(e, 'priceGaTrong')}
                        placeholder="VD: 90.000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gà mái</label>
                      <input
                        type="text"
                        value={formatPrice(formData.priceGaMai)}
                        onChange={(e) => handleNumberChange(e, 'priceGaMai')}
                        placeholder="VD: 80.000"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    value={formData.note}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="VD: Giá thị trường tham khảo, có thể thay đổi..."
                    rows={3}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChickenPriceManagement;

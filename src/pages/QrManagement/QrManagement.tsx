import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  QrCode, 
  X, 
  Copy, 
  AlertCircle,
  Building,
  CreditCard,
  User,
  Settings,
  HelpCircle,
  DollarSign,
  FileText
} from 'lucide-react';
import './QrManagement.css';

interface QrConfigData {
  id: string;
  bankCode: string;
  bankName: string;
  bankAccount: string;
  accountName: string;
  template: string;
  quickAmount?: number;
  description?: string;
  isActive: boolean;
}

interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

const TEMPLATE_OPTIONS = [
  { id: 'compact', label: 'Bản rút gọn (Có thông tin chuyển khoản)' },
  { id: 'compact2', label: 'Bản rút gọn 2 (Logo ngân hàng lớn)' },
  { id: 'qr_only', label: 'Chỉ mã QR' },
  { id: 'print', label: 'Bản in thẻ' }
];

const FALLBACK_BANKS = [
  { code: 'VCB', name: 'Vietcombank', shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png' },
  { code: 'TCB', name: 'Techcombank', shortName: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png' },
  { code: 'MB', name: 'MB Bank', shortName: 'MB', logo: 'https://api.vietqr.io/img/MB.png' },
  { code: 'CTG', name: 'VietinBank', shortName: 'VietinBank', logo: 'https://api.vietqr.io/img/ICB.png' },
  { code: 'BIDV', name: 'BIDV', shortName: 'BIDV', logo: 'https://api.vietqr.io/img/BIDV.png' },
  { code: 'ACB', name: 'ACB', shortName: 'ACB', logo: 'https://api.vietqr.io/img/ACB.png' },
  { code: 'TPB', name: 'TPBank', shortName: 'TPBank', logo: 'https://api.vietqr.io/img/TPB.png' },
  { code: 'VPB', name: 'VPBank', shortName: 'VPBank', logo: 'https://api.vietqr.io/img/VPB.png' },
  { code: 'VIB', name: 'VIB', shortName: 'VIB', logo: 'https://api.vietqr.io/img/VIB.png' },
  { code: 'STB', name: 'Sacombank', shortName: 'Sacombank', logo: 'https://api.vietqr.io/img/STB.png' },
  { code: 'VARB', name: 'Agribank', shortName: 'Agribank', logo: 'https://api.vietqr.io/img/VBA.png' }
];

const QrManagement: React.FC = () => {
  const [configs, setConfigs] = useState<QrConfigData[]>([]);
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<QrConfigData | null>(null);
  
  // Search bank logic
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    bankCode: '',
    bankName: '',
    bankAccount: '',
    accountName: '',
    template: 'compact',
    quickAmount: '',
    description: '',
    isActive: true
  });

  // Live Test State
  const [selectedConfigForPreview, setSelectedConfigForPreview] = useState<QrConfigData | null>(null);
  const [testAmount, setTestAmount] = useState<string>('');
  const [testDescription, setTestDescription] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    fetchConfigs();
    fetchBanksList();
  }, []);

  useEffect(() => {
    if (configs.length > 0 && !selectedConfigForPreview) {
      const active = configs.find(c => c.isActive) || configs[0];
      setSelectedConfigForPreview(active);
    }
  }, [configs]);

  useEffect(() => {
    if (selectedConfigForPreview) {
      generatePreviewUrl();
    }
  }, [selectedConfigForPreview, testAmount, testDescription]);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/qr-configs');
      if (res.data && Array.isArray(res.data.data)) {
        setConfigs(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching QR configs:', err);
      showToast('error', 'Không thể tải danh sách cấu hình QR.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBanksList = async () => {
    try {
      const response = await fetch('https://api.vietqr.io/v2/banks');
      const data = await response.json();
      if (data.code === '00' && Array.isArray(data.data)) {
        setBanks(data.data);
      } else {
        setBanks(FALLBACK_BANKS as any);
      }
    } catch (err) {
      console.error('Failed to fetch banks list, using fallback:', err);
      setBanks(FALLBACK_BANKS as any);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMessage(text);
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(text);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleOpenAddModal = () => {
    setEditingConfig(null);
    setFormState({
      bankCode: '',
      bankName: '',
      bankAccount: '',
      accountName: '',
      template: 'compact',
      quickAmount: '',
      description: '',
      isActive: configs.length === 0 // Active by default if it's the first one
    });
    setBankSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (config: QrConfigData) => {
    setEditingConfig(config);
    setFormState({
      bankCode: config.bankCode,
      bankName: config.bankName,
      bankAccount: config.bankAccount,
      accountName: config.accountName,
      template: config.template || 'compact',
      quickAmount: config.quickAmount ? String(config.quickAmount) : '',
      description: config.description || '',
      isActive: config.isActive
    });
    const selectedBank = banks.find(b => b.code === config.bankCode);
    setBankSearch(selectedBank ? `${selectedBank.shortName} - ${selectedBank.name}` : config.bankName);
    setIsModalOpen(true);
  };

  const handleSelectBank = (bank: VietQRBank) => {
    setFormState(prev => ({
      ...prev,
      bankCode: bank.code,
      bankName: bank.shortName || bank.name
    }));
    setBankSearch(`${bank.shortName} - ${bank.name}`);
    setShowBankDropdown(false);
  };

  const handleToggleActive = async (config: QrConfigData) => {
    if (config.isActive) return; // Keep active
    try {
      await api.put(`/qr-configs/${config.id}`, { isActive: true });
      showToast('success', `Đã kích hoạt mặc định tài khoản ${config.bankName}`);
      fetchConfigs();
    } catch (err) {
      console.error('Error toggling active:', err);
      showToast('error', 'Có lỗi xảy ra khi đổi cấu hình hoạt động.');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình QR này?')) return;
    try {
      await api.delete(`/qr-configs/${id}`);
      showToast('success', 'Xóa cấu hình thành công!');
      if (selectedConfigForPreview?.id === id) {
        setSelectedConfigForPreview(null);
      }
      fetchConfigs();
    } catch (err) {
      console.error('Error deleting QR config:', err);
      showToast('error', 'Có lỗi xảy ra khi xóa cấu hình.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.bankCode || !formState.bankAccount || !formState.accountName) {
      showToast('error', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formState,
        quickAmount: formState.quickAmount ? Number(formState.quickAmount) : null,
        accountName: formState.accountName.toUpperCase()
      };

      if (editingConfig) {
        await api.put(`/qr-configs/${editingConfig.id}`, payload);
        showToast('success', 'Cập nhật cấu hình QR thành công!');
      } else {
        await api.post('/qr-configs', payload);
        showToast('success', 'Thêm cấu hình QR mới thành công!');
      }
      setIsModalOpen(false);
      fetchConfigs();
    } catch (err: any) {
      console.error('Error saving config:', err);
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePreviewUrl = () => {
    if (!selectedConfigForPreview) return;
    
    // API VietQR format:
    // https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
    
    const bankId = selectedConfigForPreview.bankCode;
    const accountNo = selectedConfigForPreview.bankAccount;
    const template = selectedConfigForPreview.template || 'compact';
    const accountName = encodeURIComponent(selectedConfigForPreview.accountName);
    
    const amount = testAmount ? Number(testAmount) : (selectedConfigForPreview.quickAmount || '');
    const description = encodeURIComponent(testDescription || selectedConfigForPreview.description || '');
    
    let url = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?accountName=${accountName}`;
    if (amount) url += `&amount=${amount}`;
    if (description) url += `&addInfo=${description}`;
    
    setQrUrl(url);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Đã sao chép vào bộ nhớ tạm!');
  };

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) || 
    bank.code.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const activeBankLogo = (code: string) => {
    const matched = banks.find(b => b.code === code);
    return matched ? matched.logo : 'https://api.vietqr.io/img/default.png';
  };

  return (
    <div className="qr-management-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Quản Lý Cấu Hình QR</h2>
          <p>Quản lý tài khoản ngân hàng nhận tiền và xuất mã VietQR thanh toán cho các đơn hàng</p>
        </div>
        <button className="btn-add-qr" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>Thêm Tài Khoản Mới</span>
        </button>
      </div>

      {successMessage && (
        <div className="qr-toast success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="qr-toast error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state">
          <div className="loader-large"></div>
          <p>Đang tải danh sách tài khoản QR...</p>
        </div>
      ) : (
        <div className="qr-grid-layout">
          {/* List Section */}
          <div className="qr-list-section">
            <h3 className="section-title">Danh sách tài khoản ngân hàng</h3>
            {configs.length === 0 ? (
              <div className="empty-qr-state">
                <QrCode size={48} />
                <p>Chưa có cấu hình QR nào được thiết lập.</p>
                <button className="btn-add-qr-outline" onClick={handleOpenAddModal}>
                  Bắt đầu tạo ngay
                </button>
              </div>
            ) : (
              <div className="qr-cards-grid">
                {configs.map((item) => (
                  <div 
                    key={item.id} 
                    className={`qr-item-card ${item.isActive ? 'active' : ''} ${selectedConfigForPreview?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConfigForPreview(item)}
                  >
                    <div className="card-top">
                      <div className="bank-logo-wrapper">
                        <img 
                          src={activeBankLogo(item.bankCode)} 
                          alt={item.bankName} 
                          onError={(e) => { e.currentTarget.src = 'https://api.vietqr.io/img/default.png'; }}
                        />
                      </div>
                      <div className="card-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-action-edit" onClick={() => handleOpenEditModal(item)} title="Chỉnh sửa">
                          <Edit size={16} />
                        </button>
                        <button className="btn-action-delete" onClick={() => handleDeleteConfig(item.id)} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="card-body">
                      <h4 className="account-number">{item.bankAccount}</h4>
                      <p className="account-name">{item.accountName}</p>
                      <p className="bank-name-label">{item.bankName} ({item.bankCode})</p>
                    </div>

                    <div className="card-footer" onClick={e => e.stopPropagation()}>
                      <div className="active-badge-wrapper" onClick={() => handleToggleActive(item)}>
                        {item.isActive ? (
                          <span className="badge-active">
                            <CheckCircle2 size={12} />
                            Mặc định
                          </span>
                        ) : (
                          <button className="btn-set-default">Đặt làm mặc định</button>
                        )}
                      </div>
                      <div className="template-badge">
                        {TEMPLATE_OPTIONS.find(t => t.id === item.template)?.label.split(' ')[0] || 'Rút gọn'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="qr-preview-panel">
            <h3 className="section-title">Thử nghiệm & Xem trước mã QR</h3>
            {selectedConfigForPreview ? (
              <div className="preview-card-wrapper">
                <div className="preview-main-card">
                  <div className="qr-image-frame">
                    {qrUrl ? (
                      <img 
                        src={qrUrl} 
                        alt="VietQR code preview" 
                        className="live-qr-code" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="qr-placeholder">
                        <QrCode size={64} style={{ opacity: 0.3 }} />
                        <p>Đang tạo mã QR...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="preview-details">
                    <div className="preview-bank-info">
                      <img 
                        src={activeBankLogo(selectedConfigForPreview.bankCode)} 
                        alt={selectedConfigForPreview.bankName}
                        className="preview-bank-logo"
                      />
                      <div>
                        <h4>{selectedConfigForPreview.bankName}</h4>
                        <p className="preview-acc">{selectedConfigForPreview.bankAccount}</p>
                      </div>
                    </div>

                    <div className="info-copy-grid">
                      <div className="info-copy-row">
                        <span className="label">Chủ tài khoản:</span>
                        <span className="val">{selectedConfigForPreview.accountName}</span>
                        <button className="btn-copy" onClick={() => handleCopyText(selectedConfigForPreview.accountName)}>
                          <Copy size={13} />
                        </button>
                      </div>
                      <div className="info-copy-row">
                        <span className="label">Số tài khoản:</span>
                        <span className="val mono">{selectedConfigForPreview.bankAccount}</span>
                        <button className="btn-copy" onClick={() => handleCopyText(selectedConfigForPreview.bankAccount)}>
                          <Copy size={13} />
                        </button>
                      </div>
                      {selectedConfigForPreview.quickAmount && (
                        <div className="info-copy-row">
                          <span className="label">Số tiền mẫu:</span>
                          <span className="val">{selectedConfigForPreview.quickAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                      {selectedConfigForPreview.description && (
                        <div className="info-copy-row">
                          <span className="label">Nội dung mẫu:</span>
                          <span className="val">{selectedConfigForPreview.description}</span>
                          <button className="btn-copy" onClick={() => handleCopyText(selectedConfigForPreview.description || '')}>
                            <Copy size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Test simulator tool inside preview */}
                    <div className="test-simulator-container">
                      <h5>Chạy thử nghiệm quét mã</h5>
                      <div className="sim-form-row">
                        <div className="sim-field">
                          <label>
                            <DollarSign size={12} /> Số tiền (đ)
                          </label>
                          <input 
                            type="number" 
                            placeholder="VD: 50000"
                            value={testAmount}
                            onChange={(e) => setTestAmount(e.target.value)}
                          />
                        </div>
                        <div className="sim-field">
                          <label>
                            <FileText size={12} /> Nội dung ck
                          </label>
                          <input 
                            type="text" 
                            placeholder="VD: CHUYEN KHOAN DON HANG" 
                            value={testDescription}
                            onChange={(e) => setTestDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      {(testAmount || testDescription) && (
                        <button className="btn-reset-simulator" onClick={() => { setTestAmount(''); setTestDescription(''); }}>
                          Xóa bộ lọc test
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-preview-state">
                <p>Vui lòng chọn hoặc thêm cấu hình QR để xem trước.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="qr-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="qr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingConfig ? 'Chỉnh sửa Cấu Hình QR' : 'Thêm Cấu Hình QR Mới'}</h3>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group-custom">
                <label className="required-label">Ngân hàng</label>
                <div className="bank-autocomplete-wrapper">
                  <div className="bank-search-input-wrapper">
                    <Building size={16} className="input-inner-icon" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm ngân hàng (VD: Vietcombank, MB...)"
                      value={bankSearch}
                      onChange={(e) => {
                        setBankSearch(e.target.value);
                        setShowBankDropdown(true);
                      }}
                      onFocus={() => setShowBankDropdown(true)}
                    />
                    {bankSearch && (
                      <button 
                        type="button" 
                        className="btn-clear-search" 
                        onClick={() => {
                          setBankSearch('');
                          setFormState(prev => ({ ...prev, bankCode: '', bankName: '' }));
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {showBankDropdown && filteredBanks.length > 0 && (
                    <div className="bank-dropdown-list">
                      {filteredBanks.map(b => (
                        <div key={b.bin} className="bank-dropdown-item" onClick={() => handleSelectBank(b)}>
                          <img 
                            src={b.logo} 
                            alt={b.shortName} 
                            onError={(e) => { e.currentTarget.src = 'https://api.vietqr.io/img/default.png'; }}
                          />
                          <div className="bank-item-desc">
                            <span className="b-code">{b.code}</span>
                            <span className="b-name">{b.shortName} - {b.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showBankDropdown && filteredBanks.length === 0 && (
                    <div className="bank-dropdown-list empty">
                      Không tìm thấy ngân hàng khớp
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-custom">
                  <label className="required-label">Số tài khoản</label>
                  <div className="input-icon-wrapper">
                    <CreditCard size={16} className="input-inner-icon" />
                    <input 
                      type="text" 
                      placeholder="Nhập số tài khoản..."
                      value={formState.bankAccount}
                      onChange={(e) => setFormState(prev => ({ ...prev, bankAccount: e.target.value.replace(/\s+/g, '') }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="required-label">Tên chủ tài khoản</label>
                  <div className="input-icon-wrapper">
                    <User size={16} className="input-inner-icon" />
                    <input 
                      type="text" 
                      placeholder="VD: NGUYEN VAN A"
                      value={formState.accountName}
                      onChange={(e) => setFormState(prev => ({ ...prev, accountName: e.target.value }))}
                      style={{ textTransform: 'uppercase' }}
                      required
                    />
                  </div>
                  <small className="help-text-form">Viết hoa không dấu</small>
                </div>
              </div>

              <div className="form-group-custom">
                <label>Giao diện VietQR mẫu</label>
                <div className="input-icon-wrapper">
                  <Settings size={16} className="input-inner-icon" />
                  <select 
                    value={formState.template}
                    onChange={(e) => setFormState(prev => ({ ...prev, template: e.target.value }))}
                  >
                    {TEMPLATE_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-custom">
                  <label>Số tiền mặc định (Không bắt buộc)</label>
                  <div className="input-icon-wrapper">
                    <span className="input-inner-text">đ</span>
                    <input 
                      type="number" 
                      placeholder="Ví dụ: 100000"
                      value={formState.quickAmount}
                      onChange={(e) => setFormState(prev => ({ ...prev, quickAmount: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group-custom">
                  <label>Nội dung mặc định (Không bắt buộc)</label>
                  <div className="input-icon-wrapper">
                    <FileText size={16} className="input-inner-icon" />
                    <input 
                      type="text" 
                      placeholder="Ví dụ: THANH TOAN GA GIONG"
                      value={formState.description}
                      onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-checkbox-custom">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formState.isActive}
                  onChange={(e) => setFormState(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive">Đặt làm tài khoản QR mặc định của hệ thống</label>
              </div>

              <div className="modal-actions-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : (editingConfig ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrManagement;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import './LandingHome.css';

const chickenBreeds = [
  {
    id: 'dong-tao',
    name: 'Gà Đông Tảo',
    image: '/assets/landing/dong_tao_chicken_1777089026481.png',
    price: 'Liên hệ',
    description: 'Giống gà quý hiếm với đôi chân to đặc trưng, thịt chắc và thơm ngon.',
    tags: ['Quý hiếm', 'Thịt ngon', 'Tiến vua']
  },
  {
    id: 'ga-ho',
    name: 'Gà Hồ',
    image: '/assets/landing/ga_ho_chicken_1777089063143.png',
    price: 'Liên hệ',
    description: 'Giống gà truyền thống, vóc dáng uy nghi, thường dùng trong các lễ hội.',
    tags: ['Truyền thống', 'Dáng đẹp']
  },
  {
    id: 'ga-ta',
    name: 'Gà Ta Thả Vườn',
    image: '/assets/landing/ga_ta_chicken_1777089042217.png',
    price: 'Liên hệ',
    description: 'Gà ta thuần chủng, nuôi thả tự nhiên, đảm bảo chất lượng thịt vượt trội.',
    tags: ['Phổ biến', 'Dễ nuôi', 'Kinh tế']
  },
  {
    id: 'ga-hmong',
    name: "Gà H'Mông",
    image: '/assets/landing/ga_hmong.png',
    price: 'Liên hệ',
    description: 'Giống gà thuốc quý hiếm với xương đen, thịt đen, bổ dưỡng và có giá trị kinh tế cao.',
    tags: ['Quý hiếm', 'Bổ dưỡng', 'Xương đen']
  },
  {
    id: 'ga-ta-lai',
    name: 'Gà Ta Lai',
    image: '/assets/landing/ga_ta_lai.png',
    price: 'Liên hệ',
    description: 'Sự kết hợp giữa gà ta thuần chủng và giống gà năng suất cao, lớn nhanh, khỏe mạnh.',
    tags: ['Năng suất', 'Lớn nhanh', 'Khỏe mạnh']
  }
];


const LandingHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <img 
          src="/assets/landing/hero_bg_new.png" 
          alt="Chicken Farm" 
          className="hero-bg" 
        />
        <div className="landing-container hero-content">
          <div className="hero-text-area">
            <img src="/assets/landing/decorative_chicken.png" alt="" className="hero-decoration" />
            <span className="hero-badge">Chào mừng đến với Gà Giống Samoanh</span>
            <h1>Cung Cấp Giống Gà <span>Chất Lượng</span> Hàng Đầu</h1>
            <p>
              Khởi đầu sự nghiệp chăn nuôi của bạn với nguồn giống khỏe mạnh, 
              được chọn lọc kỹ lưỡng và hỗ trợ kỹ thuật tận tình.
            </p>
            <div className="hero-btns">
              <a href="#products" className="btn-primary">
                Xem sản phẩm <ChevronRight size={20} />
              </a>
              <a href="#about" className="btn-secondary">
                Tìm hiểu thêm
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <h2>Tại sao chọn chúng tôi?</h2>
            <div className="header-line"></div>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><ShieldCheck size={32} /></div>
              <h3>Giống thuần chủng</h3>
              <p>Đảm bảo nguồn gốc rõ ràng, không lai tạp, giữ vững đặc tính giống.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Star size={32} /></div>
              <h3>Chất lượng cao</h3>
              <p>Gà được tiêm chủng đầy đủ, sức đề kháng tốt và tốc độ lớn nhanh.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Zap size={32} /></div>
              <h3>Hỗ trợ kỹ thuật</h3>
              <p>Tư vấn quy trình nuôi dưỡng, phòng bệnh miễn phí cho bà con.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="products-section">
        <div className="landing-container">
          <div className="section-header">
            <span>Danh mục sản phẩm</span>
            <h2>Các loại gà giống nổi bật</h2>
          </div>
          
          <div className="products-grid">
            {chickenBreeds.map((breed) => (
              <div key={breed.id} className="breed-card">
                <div className="breed-image">
                  <img src={breed.image} alt={breed.name} />
                  <div className="breed-tags">
                    {breed.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
                <div className="breed-info">
                  <h3>{breed.name}</h3>
                  <p>{breed.description}</p>
                  <div className="breed-footer">
                    <span className="breed-price">{breed.price}</span>
                    <button 
                      className="view-detail-btn"
                      onClick={() => navigate(`/chicken/${breed.id}`)}
                    >
                      Chi tiết <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="landing-container">
          <div className="about-grid">
            <div className="about-image">
              <img src="/assets/landing/farm_hero_1777089009894.png" alt="About Farm" />
              <div className="experience-badge">
                <span className="num">15+</span>
                <span className="txt">Năm kinh nghiệm</span>
              </div>
            </div>
            <div className="about-text">
              <span>Về chúng tôi</span>
              <h2>Hơn 15 năm đồng hành cùng người chăn nuôi</h2>
              <p>
                Trang trại Gà Giống Samoanh được thành lập với tâm huyết mang đến những 
                con giống tốt nhất cho bà con. Chúng tôi không chỉ bán con giống, 
                mà còn chia sẻ giải pháp chăn nuôi hiệu quả, bền vững.
              </p>
              <ul className="about-list">
                <li>Quy mô trang trại hiện đại</li>
                <li>Hệ thống ấp trứng công nghệ cao</li>
                <li>Đội ngũ chuyên gia giàu kinh nghiệm</li>
              </ul>
              <a href="tel:0974095244" className="btn-primary">Liên hệ ngay</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-box">
            <h2>Bắt đầu trang trại của bạn ngay hôm nay</h2>
            <p>Liên hệ với chúng tôi để nhận tư vấn miễn phí về các loại gà giống và quy trình chăn nuôi hiệu quả nhất.</p>
            <a href="tel:0974095244" className="cta-btn">Nhận tư vấn miễn phí</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingHome;

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Phone, MessageSquare, Info } from 'lucide-react';
import './ChickenDetail.css';

const breedData: Record<string, any> = {
  'dong-tao': {
    name: 'Gà Đông Tảo',
    fullName: 'Gà Đông Tảo (Gà Tiến Vua)',
    image: '/assets/landing/dong_tao_chicken_1777089026481.png',
    description: 'Gà Đông Tảo là một giống gà quý hiếm của Việt Nam, nổi tiếng với đôi chân to thô, xù xì và thịt thơm ngon đặc trưng. Xưa kia, đây là loại gà thường được dùng để tiến vua.',
    features: [
      'Đôi chân to đặc trưng, có vảy thịt bao quanh.',
      'Thịt gà chắc, giòn, không dai, thơm mùi đặc trưng.',
      'Trọng lượng trưởng thành có thể đạt 4.5kg - 6kg.',
      'Sức đề kháng tốt nếu được nuôi đúng kỹ thuật.'
    ],
    specs: {
      'Nguồn gốc': 'Tam Dương, Vĩnh Phúc, Phú Thọ',
      'Đặc điểm chân': 'Chân to, vảy thịt đỏ',
      'Công dụng': 'Thịt thương phẩm cao cấp, quà biếu',
      'Thời gian nuôi': '8 - 12 tháng'
    }
  },
  'ga-ho': {
    name: 'Gà Hồ',
    fullName: 'Gà Hồ Thuần Chủng',
    image: '/assets/landing/ga_ho_chicken_1777089063143.png',
    description: 'Gà Hồ là một giống gà quý ở làng Lạc Thổ, thị trấn Hồ, Bắc Ninh. Giống gà này có vóc dáng uy nghi, tinh thần dũng mãnh, thường được chọn làm linh vật trong các dịp lễ hội.',
    features: [
      'Thân hình to lớn, cân đối, dáng đi oai vệ.',
      'Lông gà có màu sắc đẹp, thường là màu mận chín hoặc đen mượt.',
      'Chất lượng thịt cực tốt, thớ thịt to, thơm và ngọt.',
      'Phù hợp cho các trang trại chăn nuôi quy mô lớn.'
    ],
    specs: {
      'Nguồn gốc': 'Lạc Thổ, Thuận Thành, Bắc Ninh',
      'Đặc điểm': 'Đầu gộc, mã lĩnh',
      'Trọng lượng': '4kg - 5.5kg',
      'Thời gian nuôi': '7 - 10 tháng'
    }
  },
  'ga-ta': {
    name: 'Gà Ta Thả Vườn',
    fullName: 'Gà Ta Thuần Chủng Thả Vườn',
    image: '/assets/landing/ga_ta_chicken_1777089042217.png',
    description: 'Gà Ta là giống gà phổ biến và được ưa chuộng nhất tại Việt Nam. Với phương pháp nuôi thả vườn tự nhiên, gà ta của chúng tôi đảm bảo chất lượng thịt chắc, da giòn và vị ngọt thanh.',
    features: [
      'Dễ nuôi, thích nghi tốt với mọi điều kiện khí hậu.',
      'Thịt chắc, ít mỡ, da vàng giòn tự nhiên.',
      'Sản lượng trứng ổn định, chất lượng trứng thơm ngon.',
      'Chi phí chăn nuôi thấp, hiệu quả kinh tế cao.'
    ],
    specs: {
      'Nguồn gốc': 'Việt Nam',
      'Đặc điểm': 'Thân hình thon gọn, nhanh nhẹn',
      'Trọng lượng': '1.8kg - 2.5kg',
      'Thời gian nuôi': '4 - 5 tháng'
    }
  },
  'ga-hmong': {
    name: "Gà H'Mông",
    fullName: "Gà H'Mông (Gà Mông Đen)",
    image: '/assets/landing/ga_hmong.png',
    description: "Gà H'Mông là giống gà quý hiếm của vùng núi cao phía Bắc. Đặc điểm nổi bật nhất là xương đen, thịt đen, phủ tạng đen và da đen. Đây không chỉ là món ăn ngon mà còn là vị thuốc quý trong y học cổ truyền.",
    features: [
      'Xương đen, thịt đen, da đen đặc trưng.',
      'Hàm lượng dinh dưỡng cao, ít mỡ, thịt chắc.',
      'Sức đề kháng cực tốt, thích nghi được với môi trường khắc nghiệt.',
      'Giá trị kinh tế và dược liệu rất cao.'
    ],
    specs: {
      'Nguồn gốc': 'Vùng núi Tây Bắc Việt Nam',
      'Đặc điểm': 'Xương đen, thịt đen, da đen',
      'Công dụng': 'Thực phẩm bổ dưỡng, dược liệu',
      'Trọng lượng': '1.5kg - 2.2kg'
    }
  },
  'ga-ta-lai': {
    name: 'Gà Ta Lai',
    fullName: 'Gà Ta Lai (Gà Ta Lai Chọi/Mía)',
    image: '/assets/landing/ga_ta_lai.png',
    description: 'Gà Ta Lai là kết quả của việc lai tạo giữa gà ta thuần chủng và các giống gà chọi hoặc gà mía. Giống gà này hội tụ được cả ưu điểm về chất lượng thịt của gà ta và tốc độ tăng trưởng nhanh của giống lai.',
    features: [
      'Tốc độ lớn nhanh hơn gà ta thuần chủng.',
      'Thịt chắc, thơm ngon, tỷ lệ thịt đùi và lườn cao.',
      'Sức đề kháng tốt, dễ chăm sóc, phù hợp nuôi thả vườn.',
      'Hiệu quả kinh tế cao, thời gian xuất chuồng ngắn.'
    ],
    specs: {
      'Nguồn gốc': 'Việt Nam (Lai tạo)',
      'Đặc điểm': 'Lớn nhanh, thịt chắc',
      'Trọng lượng': '2.2kg - 3.2kg',
      'Thời gian nuôi': '3.5 - 4.5 tháng'
    }
  },
};


const ChickenDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const breed = breedData[id || ''];

  if (!breed) {
    return (
      <div className="landing-container error-page">
        <h2>Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </div>
    );
  }

  return (
    <div className="chicken-detail-page">
      <div className="landing-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Quay lại
        </button>

        <div className="detail-grid">
          <div className="detail-image">
            <img src={breed.image} alt={breed.name} />
          </div>
          
          <div className="detail-content">
            <span className="detail-category">Gà giống chất lượng cao</span>
            <h1>{breed.fullName}</h1>
            <p className="detail-desc">{breed.description}</p>
            
            <div className="detail-features">
              <h3>Đặc điểm nổi bật:</h3>
              <ul>
                {breed.features.map((feature: string, idx: number) => (
                  <li key={idx}>
                    <CheckCircle2 size={18} className="icon" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-actions">
              <a href="tel:0974095244" className="btn-call">
                <Phone size={20} /> Gọi tư vấn ngay
              </a>
              <button className="btn-zalo">
                <MessageSquare size={20} /> Chat Zalo
              </button>
            </div>
          </div>
        </div>

        <div className="specs-section">
          <div className="specs-header">
            <Info size={24} />
            <h2>Thông số kỹ thuật</h2>
          </div>
          <div className="specs-grid">
            {Object.entries(breed.specs).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-label">{key}</span>
                <span className="spec-value">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChickenDetail;

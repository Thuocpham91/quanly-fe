import { 
  Home, 
  Users, 
  UserSquare2, 
  Box, 
  CheckSquare, 
  ShoppingBag, 
  ListTodo, 
  Truck, 
  DollarSign, 
  Target, 
  BarChart2, 
  CreditCard, 
  TrendingUp, 
  Share2,
  QrCode,
  type LucideIcon
} from 'lucide-react';

export type ActionType = 'view' | 'add' | 'edit' | 'delete';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  availableActions?: ActionType[];
}

// Hàm hỗ trợ để tạo danh sách actions chuẩn
const fullActions: ActionType[] = ['view', 'add', 'edit', 'delete'];
const viewOnly: ActionType[] = ['view'];

export const allNavItems: NavItem[] = [
  { path: '/admin', label: 'Trang chủ', icon: Home, availableActions: viewOnly },
  { path: '/admin/users', label: 'Quản lý User', icon: Users, availableActions: fullActions },
  { path: '/admin/customers', label: 'Quản lý Khách hàng', icon: UserSquare2, availableActions: fullActions },
  { path: '/admin/objects', label: 'Quản Object', icon: Box, availableActions: fullActions },
  { path: '/admin/works', label: 'Quản lý Công việc', icon: CheckSquare, availableActions: fullActions },
  { path: '/admin/tasks/schedule', label: 'Lịch trình công việc', icon: ListTodo, availableActions: ['view', 'edit'] },
  { path: '/admin/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag, availableActions: fullActions },
  { path: '/admin/orders/schedule', label: 'Lịch trình giao hàng', icon: Truck, availableActions: ['view', 'edit'] },
  { path: '/admin/revenue', label: 'Quản lý Doanh thu', icon: DollarSign, availableActions: viewOnly },
  { path: '/admin/milestones', label: 'Cài đặt Mốc Thưởng', icon: Target, availableActions: fullActions },
  { path: '/admin/chicken-prices', label: 'Giá Gà Hôm Nay', icon: BarChart2, availableActions: fullActions },
  { path: '/admin/expenses', label: 'Quản lý Thu & Chi', icon: CreditCard, availableActions: fullActions },
  { path: '/admin/sales', label: 'Theo dõi Khách mua', icon: TrendingUp, availableActions: viewOnly },
  { path: '/admin/social/assistant', label: 'Trợ lý Facebook', icon: Share2, availableActions: fullActions },
  { path: '/admin/qr-management', label: 'Cấu hình QR Chuyển Khoản', icon: QrCode, availableActions: fullActions },
];

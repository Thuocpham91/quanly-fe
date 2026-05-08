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
  type LucideIcon
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const allNavItems: NavItem[] = [
  { path: '/admin', label: 'Trang chủ', icon: Home },
  { path: '/admin/users', label: 'Quản lý User', icon: Users },
  { path: '/admin/customers', label: 'Quản lý Khách hàng', icon: UserSquare2 },
  { path: '/admin/objects', label: 'Quản Object', icon: Box },
  { path: '/admin/works', label: 'Quản lý Công việc', icon: CheckSquare },
  { path: '/admin/tasks/schedule', label: 'Lịch trình công việc', icon: ListTodo },
  { path: '/admin/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag },
  { path: '/admin/orders/schedule', label: 'Lịch trình giao hàng', icon: Truck },
  { path: '/admin/revenue', label: 'Quản lý Doanh thu', icon: DollarSign },
  { path: '/admin/milestones', label: 'Cài đặt Mốc Thưởng', icon: Target },
  { path: '/admin/chicken-prices', label: 'Giá Gà Hôm Nay', icon: BarChart2 },
  { path: '/admin/expenses', label: 'Quản lý Thu & Chi', icon: CreditCard },
  { path: '/admin/sales', label: 'Theo dõi Khách mua', icon: TrendingUp },
  { path: '/admin/social/assistant', label: 'Trợ lý Facebook', icon: Share2 },
];

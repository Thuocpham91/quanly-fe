import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Users/UserManagement';
import ObjectManagement from './pages/Objects/ObjectManagement';
import ObjectDetail from './pages/Objects/ObjectDetail';
import WorkManagement from './pages/Work/WorkManagement';
import WorkDetail from './pages/Work/WorkDetail';
import OrderManagement from './pages/Orders/OrderManagement';
import OrderDetail from './pages/Orders/OrderDetail';
import CustomerManagement from './pages/Customers/CustomerManagement';
import TaskSchedule from './pages/Tasks/TaskSchedule';
import OrderSchedule from './pages/Orders/OrderSchedule';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './pages/Settings/Settings';
import RevenueManagement from './pages/Revenue/RevenueManagement';
import MilestoneManagement from './pages/Revenue/MilestoneManagement';
import ChickenPriceManagement from './pages/ChickenPrice/ChickenPriceManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: 'users',
            element: <UserManagement />,
          },
          {
            path: 'customers',
            element: <CustomerManagement />,
          },
          {
            index: true,
            element: <Dashboard />,
          },

          {
            path: 'objects',
            element: <ObjectManagement />,
          },
          {
            path: 'objects/:id',
            element: <ObjectDetail />,
          },
          {
            path: 'works',
            element: <WorkManagement />,
          },
          {
            path: 'works/:id',
            element: <WorkDetail />,
          },
          {
            path: 'orders',
            element: <OrderManagement />,
          },
          {
            path: 'orders/:id',
            element: <OrderDetail />,
          },
          {
            path: 'tasks/schedule',
            element: <TaskSchedule />,
          },
          {
            path: 'orders/schedule',
            element: <OrderSchedule />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
          {
            path: 'revenue',
            element: <RevenueManagement />,
          },
          {
            path: 'milestones',
            element: <MilestoneManagement />,
          },
          {
            path: 'chicken-prices',
            element: <ChickenPriceManagement />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

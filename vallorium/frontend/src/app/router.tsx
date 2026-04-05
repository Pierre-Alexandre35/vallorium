import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from '@/components/layouts/app-shell';
import { LoginPage } from '@/features/auth/pages/login-page';

function DashboardPage() {
  return <AppShell title="Dashboard">You are logged in.</AppShell>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <DashboardPage />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

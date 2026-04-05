import { Navigate, useRoutes } from 'react-router-dom';
import {
  inventoryRoutes,
  mainRoutes,
  systemsRoutes,
  // authRoutes,
  // adminRoutes,
  // userRoutes,
} from './sections';
import { paths } from './paths';

export function Router() {
  return useRoutes([
    {
      path: '/',
      index: true,
      element: <Navigate to={paths.systems.root} replace />,
    },

    // Dashboard
    ...systemsRoutes,
    ...inventoryRoutes,

    // User
    // ...userRoutes,

    // Auth routes
    // ...authRoutes,

    // Admin routes
    // ...adminRoutes,

    // Main routes
    ...mainRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}

import { lazy, Suspense } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { paths } from '../paths';
import { DashboardLayout } from 'src/layouts/dashboard';
import { SplashScreen } from 'src/components/loading';
import { AuthGuard, RoleGuard } from 'src/guards';

const InventoryPage = lazy(() =>
  import('src/pages/inventory').then((module) => ({
    default: module.InventoryPage,
  })),
);

export const inventoryRoutes: RouteObject[] = [
  {
    path: paths.inventory.root,
    element: (
      <AuthGuard>
        <RoleGuard
          oneOf={['admin', 'rtpi']}
          mode="resource"
          resource="web-client"
        >
          <DashboardLayout>
            <Suspense fallback={<SplashScreen />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </RoleGuard>
      </AuthGuard>
    ),
    children: [{ element: <InventoryPage />, index: true }],
  },
];

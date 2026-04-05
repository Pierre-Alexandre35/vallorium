import { lazy, Suspense } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { paths } from '../paths';
import { DashboardLayout } from 'src/layouts/dashboard';
import { SplashScreen } from 'src/components/loading';
import { AuthGuard, RoleGuard } from 'src/guards';

const SystemsPage = lazy(() =>
  import('src/pages/dashboard').then((module) => ({
    default: module.SystemsPage,
  })),
);

const SystemPage = lazy(() =>
  import('src/pages/dashboard').then((module) => ({
    default: module.SystemPage,
  })),
);

export const systemsRoutes: RouteObject[] = [
  {
    path: paths.systems.root,
    element: (
      <AuthGuard>
        <RoleGuard
          oneOf={['admin', 'inge_system']}
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
    children: [
      { element: <SystemsPage />, index: true },
      {
        path: paths.systems.system,
        element: <SystemPage />,
      },
    ],
  },
];

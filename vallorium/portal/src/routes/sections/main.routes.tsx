import { lazy, Suspense } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';
import { SplashScreen } from 'src/components/loading';
import { CompactLayout } from 'src/layouts/compact';

const Page403 = lazy(() =>
  import('src/pages/main/errors').then((module) => ({
    default: module.Page403,
  })),
);
const Page404 = lazy(() =>
  import('src/pages/main/errors').then((module) => ({
    default: module.Page404,
  })),
);
const Page500 = lazy(() =>
  import('src/pages/main/errors').then((module) => ({
    default: module.Page500,
  })),
);

export const mainRoutes: RouteObject[] = [
  {
    element: (
      <CompactLayout>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </CompactLayout>
    ),
    children: [
      { path: '500', element: <Page500 /> },
      { path: '404', element: <Page404 /> },
      { path: '403', element: <Page403 /> },
    ],
  },
];

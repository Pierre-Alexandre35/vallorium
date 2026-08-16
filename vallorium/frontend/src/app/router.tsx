import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { GameShell } from "@/components/layouts/game-shell";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { LoginPage } from "@/features/auth/pages/login-page";
import { SignupPage } from "@/features/auth/pages/signup-page";
import { HomePage } from "@/features/villages/pages/home-page";
import { ProtectedRoute } from "@/routes/protected-route";

const WorldMapPage = lazy(() =>
  import("@/features/world-map/pages/world-map-page").then((module) => ({
    default: module.WorldMapPage,
  })),
);

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <GameShell />,
        children: [
          { path: "/app", element: <HomePage /> },
          {
            path: "/app/map",
            element: (
              <Suspense fallback={<FullPageLoader />}>
                <WorldMapPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/app" replace /> },
]);

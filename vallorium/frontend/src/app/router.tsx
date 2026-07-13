import { Box, CircularProgress } from "@mui/material";
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

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
    path: "/app",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/app/map",
    element: (
      <ProtectedRoute>
        <Suspense
          fallback={
            <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          }
        >
          <WorldMapPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate to="/app" replace /> },
]);

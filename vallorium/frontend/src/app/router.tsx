import { Navigate, createBrowserRouter } from "react-router-dom";

import { HomePage } from "@/features/villages/pages/home-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { ProtectedRoute } from "@/routes/protected-route";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/app" replace />,
  },
]);

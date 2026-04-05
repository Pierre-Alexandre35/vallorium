import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { storage } from "@/lib/storage";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation();
  const token = storage.getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboard from "@/pages/AdminDashboard";
import { useAuth } from "@/context/AuthContext";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-foreground">
        <p className="text-lg font-semibold">Cargando sesión...</p>
      </div>
    );
  }

  if (!currentUser && location.pathname !== "/auth") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <ProtectedRoute allowedRoles={["admin", "user"]}>
            <Index />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/browse"
        element={(
          <ProtectedRoute allowedRoles={["admin", "user"]}>
            <Index />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />
      <Route path="/auth" element={<Auth />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

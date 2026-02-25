import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import IDCard from "./pages/IDCard";
import Certificate from "./pages/Certificate";
import Notices from "./pages/Notices";
import Settings from "./pages/Settings";
import ParentPortal from "./pages/ParentPortal";
import RegisterForm from "./pages/RegisterForm";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Parents can only access parent portal
  if (role === "parent" && adminOnly) {
    return <Navigate to="/parent-portal" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect logged-in parents to parent portal
  const defaultRoute = role === "parent" ? "/parent-portal" : "/";

  return (
    <Routes>
      {/* Public */}
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/auth" element={user ? <Navigate to={defaultRoute} replace /> : <Auth />} />

      {/* Admin routes */}
      <Route path="/" element={<ProtectedRoute adminOnly><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute adminOnly><Layout><Leads /></Layout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute adminOnly><Layout><Students /></Layout></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute adminOnly><Layout><StudentProfile /></Layout></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute adminOnly><Layout><Attendance /></Layout></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute adminOnly><Layout><Payments /></Layout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute adminOnly><Layout><Expenses /></Layout></ProtectedRoute>} />
      <Route path="/id-card" element={<ProtectedRoute adminOnly><Layout><IDCard /></Layout></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute adminOnly><Layout><Certificate /></Layout></ProtectedRoute>} />
      <Route path="/notices" element={<ProtectedRoute adminOnly><Layout><Notices /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><Layout><Settings /></Layout></ProtectedRoute>} />

      {/* Parent portal - accessible by both */}
      <Route path="/parent-portal" element={<ProtectedRoute><Layout><ParentPortal /></Layout></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from '@/lib/router-compat';
import LogoSpinner from "@/components/LogoSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isSubadmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin && !isSubadmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;

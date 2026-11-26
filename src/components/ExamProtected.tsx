import { useEffect, type ReactNode } from "react";
import { Navigate } from "@/lib/router-compat";
import { useAuth as useExamAuth } from "@/exam/contexts/ExamAuthContext";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";

export default function ExamProtected({ children, role }: { children: ReactNode; role?: "admin" | "student" }) {
  const { user: examUser, isLoading, bridgeAdmin } = useExamAuth();
  const { user, isAdmin, isSubadmin, loading: jpLoading } = useAuth();
  const realAdmin = isAdmin || isSubadmin;
  const needsBridge = role === "admin" && realAdmin && examUser?.role !== "admin";

  // A signed-in Job Portal admin/sub-admin enters the exam admin area without a page reload.
  useEffect(() => {
    if (needsBridge) bridgeAdmin(user?.email || "admin");
  }, [needsBridge, bridgeAdmin, user?.email]);

  if (isLoading || jpLoading || needsBridge) return <PageLoader />;

  // Exam admin pages need a real admin account; a saved browser value is never enough.
  if (role === "admin") return realAdmin ? <>{children}</> : <Navigate to="/login" replace />;

  if (!examUser) return <Navigate to="/exam-login" replace />;
  if (role && examUser.role !== role) return <Navigate to="/exam-login" replace />;
  return <>{children}</>;
}

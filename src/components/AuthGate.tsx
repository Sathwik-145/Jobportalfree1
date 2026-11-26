import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SiteLoader from "@/components/SiteLoader";

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { loading } = useAuth();
  if (loading) return <SiteLoader text="Starting JobPortalFree..." />;
  return <>{children}</>;
};

export default AuthGate;

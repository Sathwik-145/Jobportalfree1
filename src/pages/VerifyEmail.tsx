import { useEffect, useState } from "react";
import { Link, useSearchParams } from '@/lib/router-compat';
import { supabase } from "@/lib/db-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import LogoSpinner from "@/components/LogoSpinner";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    const token = params.get("token") || "";
    supabase.rpc("verify_email_token", { _token: token }).then(({ data }) => setState(data ? "ok" : "bad"));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {state === "loading" && <LogoSpinner size="md" text="Verifying..." />}
          {state === "ok" && (<>
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-1">Email verified!</h1>
            <p className="text-sm text-muted-foreground mb-6">You can log in now.</p>
            <Link to="/login"><Button className="w-full">Go to Login</Button></Link>
          </>)}
          {state === "bad" && (<>
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-1">Link invalid or already used</h1>
            <p className="text-sm text-muted-foreground mb-6">If you already verified, just log in.</p>
            <Link to="/login"><Button className="w-full">Go to Login</Button></Link>
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}

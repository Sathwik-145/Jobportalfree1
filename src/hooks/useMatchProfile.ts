import { useEffect, useState } from "react";
import { supabase } from "@/lib/db-client";
import { useAuth } from "@/contexts/AuthContext";
import type { MatchProfile } from "@/lib/jobMatch";

/** Loads the signed-in user's skills and job preferences for smart matching (null when signed out). */
export function useMatchProfile(): MatchProfile | null {
  const { user, profile } = useAuth();
  const [prefs, setPrefs] = useState<{ skills: string[]; types: string[]; locations: string[] } | null>(null);

  useEffect(() => {
    if (!user) { setPrefs(null); return; }
    let cancelled = false;
    supabase.from("job_preferences").select("preferred_skills, preferred_job_types, preferred_locations").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setPrefs({
          skills: (data as any)?.preferred_skills || [],
          types: (data as any)?.preferred_job_types || [],
          locations: (data as any)?.preferred_locations || [],
        });
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user) return null;
  return {
    skills: (profile as any)?.skills || [],
    preferredSkills: prefs?.skills || [],
    preferredJobTypes: prefs?.types || [],
    preferredLocations: prefs?.locations || [],
  };
}

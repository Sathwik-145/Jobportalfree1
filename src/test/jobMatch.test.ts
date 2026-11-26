import { describe, expect, it } from "vitest";
import { computeMatch, normalizeSkill, type MatchProfile } from "@/lib/jobMatch";

const empty: MatchProfile = { skills: [], preferredSkills: [], preferredJobTypes: [], preferredLocations: [] };

describe("jobMatch", () => {
  it("normalizes aliases", () => {
    expect(normalizeSkill("ReactJS")).toBe("react");
    expect(normalizeSkill(" JS ")).toBe("javascript");
    expect(normalizeSkill("Node.js")).toBe("nodejs");
  });

  it("returns null with no signed-in profile or no data", () => {
    expect(computeMatch({ title: "x" }, null)).toBeNull();
    expect(computeMatch({ skills_required: ["React"] }, empty)).toBeNull();
  });

  it("scores skill overlap", () => {
    const r = computeMatch({ skills_required: ["React", "TypeScript", "SQL", "Docker"] }, { ...empty, skills: ["reactjs", "ts"] })!;
    expect(r.score).toBe(50);
    expect(r.matchedSkills).toEqual(["React", "TypeScript"]);
    expect(r.missingSkills).toEqual(["SQL", "Docker"]);
  });

  it("combines skills, job type and location", () => {
    const p: MatchProfile = { skills: ["python"], preferredSkills: [], preferredJobTypes: ["internship"], preferredLocations: ["bangalore"] };
    expect(computeMatch({ skills_required: ["Python"], job_type: "Internship", location: "Bangalore, India" }, p)!.score).toBe(100);
    expect(computeMatch({ skills_required: ["Python"], job_type: "Full-time", location: "Delhi" }, p)!.score).toBe(60 / 100 * 100);
  });

  it("redistributes weight when a dimension has no data", () => {
    const p: MatchProfile = { ...empty, preferredLocations: ["pune"] };
    expect(computeMatch({ location: "Pune" }, p)!.score).toBe(100);
    expect(computeMatch({ location: "Mumbai" }, p)!.score).toBe(0);
  });

  it("treats remote jobs as a location match", () => {
    const p: MatchProfile = { ...empty, preferredLocations: ["pune"] };
    expect(computeMatch({ location: "Remote" }, p)!.locationMatch).toBe(true);
  });
});

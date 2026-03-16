import { describe, expect, it } from "vitest";
import { defaultResume, sampleResume } from "@/types/resume";
import { runResumeAudit } from "@/lib/resume-audit";

describe("runResumeAudit", () => {
  it("flags missing ATS essentials on empty resumes", () => {
    const result = runResumeAudit(defaultResume, "creative");

    expect(result.score).toBeLessThan(45);
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.templateMeta.parseRisk).toBe("high");
    expect(result.recommendedTemplate).not.toBe("creative");
  });

  it("scores strong data as ready and parser-safe on ATS templates", () => {
    const result = runResumeAudit(sampleResume, "professional");

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.blockers.length).toBe(0);
    expect(result.templateMeta.parseRisk).toBe("low");
  });
});

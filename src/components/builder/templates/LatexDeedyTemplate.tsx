import { ResumeData } from "@/types/resume";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);

function Section({ title, children, color = "#2b6cb0" }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div data-resume-section style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color, borderBottom: `1px solid ${color}`, paddingBottom: "2px", marginBottom: "5px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * Inspired by Deedy-Resume LaTeX template — two-column layout,
 * compact, information-dense, bold section headers with accent color.
 */
export function LatexDeedyTemplate({ data: d }: { data: ResumeData }) {
  const accent = "#2b6cb0";

  return (
    <div style={{ padding: "18px 44px", fontFamily: "'Lato', 'Helvetica Neue', sans-serif", fontSize: "10px", lineHeight: "1.4", color: "#222" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 300, margin: 0, color: "#111", letterSpacing: "2px", textTransform: "uppercase" }}>
          {d.contact.name || "Your Name"}
        </h1>
        <div style={{ fontSize: "9px", color: "#666", marginTop: "5px", letterSpacing: "0.5px" }}>
          {[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio].filter(Boolean).join("  ◦  ")}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left column — 35% */}
        <div style={{ width: "35%", flexShrink: 0 }}>
          {hasEdu(d) && (
            <Section title="Education" color={accent}>
              {d.education.filter(e => e.institution).map((e, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontWeight: 700, fontSize: "10.5px" }}>{e.institution}</div>
                  <div style={{ fontStyle: "italic", fontSize: "9.5px" }}>{[e.degree, e.field].filter(Boolean).join(" in ")}</div>
                  <div style={{ fontSize: "9px", color: "#888" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</div>
                  {e.gpa && <div style={{ fontSize: "9px" }}>GPA: {e.gpa}</div>}
                </div>
              ))}
            </Section>
          )}

          {hasSkills(d) && (
            <Section title="Skills" color={accent}>
              {d.skills.filter(s => s.items.trim()).map((s, i) => (
                <div key={i} style={{ marginBottom: "4px" }}>
                  <div style={{ fontWeight: 700, fontSize: "9.5px", color: accent }}>{s.category}</div>
                  <div style={{ fontSize: "9.5px", color: "#444" }}>{s.items}</div>
                </div>
              ))}
            </Section>
          )}

          {hasCerts(d) && (
            <Section title="Certifications" color={accent}>
              {d.certifications.filter(c => c.name).map((c, i) => (
                <div key={i} style={{ marginBottom: "3px", fontSize: "9.5px" }}>
                  <strong>{c.name}</strong>
                  {c.issuer && <div style={{ color: "#666", fontSize: "9px" }}>{c.issuer}</div>}
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Right column — 65% */}
        <div style={{ flex: 1 }}>
          {d.summary && (
            <Section title="Summary" color={accent}>
              <p style={{ color: "#444", fontSize: "10px" }}>{d.summary}</p>
            </Section>
          )}

          {hasExp(d) && (
            <Section title="Experience" color={accent}>
              {d.experience.filter(e => e.company || e.title).map((e, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "10.5px" }}>{e.title}</span>
                    <span style={{ fontSize: "9px", color: "#888" }}>{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")}</span>
                  </div>
                  <div style={{ color: accent, fontSize: "9.5px", fontWeight: 600 }}>{e.company}{e.location ? ` | ${e.location}` : ""}</div>
                  <ul style={{ margin: "2px 0 0 12px", paddingLeft: 0, listStyleType: "disc", fontSize: "9.5px", color: "#333" }}>
                    {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "1px" }}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </Section>
          )}

          {hasProjects(d) && (
            <Section title="Projects" color={accent}>
              {d.projects.filter(p => p.name).map((p, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <div style={{ fontWeight: 700, fontSize: "10px" }}>
                    {p.name}{p.technologies ? <span style={{ fontWeight: 400, color: "#666" }}> | {p.technologies}</span> : ""}
                  </div>
                  {p.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ margin: "2px 0 0 12px", paddingLeft: 0, listStyleType: "disc", fontSize: "9.5px", color: "#333" }}>
                      {p.bullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

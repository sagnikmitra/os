import { ResumeData } from "@/types/resume";
import { LinkText } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-resume-section style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #000", paddingBottom: "1px", marginBottom: "5px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * Inspired by Jake's Resume LaTeX template — single column, extremely compact,
 * bold headers with thick rules, no frills, maximum content density.
 * The most popular LaTeX resume template on GitHub.
 */
export function LatexJakeTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{ padding: "18px 40px", fontFamily: "'Libertinus Serif', 'Times New Roman', serif", fontSize: "10px", lineHeight: "1.35", color: "#000" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
          {d.contact.name || "Your Name"}
        </h1>
        <div style={{ fontSize: "9px", marginTop: "3px" }}>
          {[d.contact.phone, d.contact.email, d.contact.linkedin, d.contact.portfolio, d.contact.location]
            .filter(Boolean)
            .map((item, i, arr) => (
              <span key={i}>
                {item}{i < arr.length - 1 ? " · " : ""}
              </span>
            ))}
        </div>
      </div>

      {hasEdu(d) && (
        <Section title="Education">
          {d.education.filter(e => e.institution).map((e, i) => (
            <div key={i} style={{ marginBottom: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.institution}</LinkText> : e.institution}</strong></span>
                <span style={{ fontSize: "9px" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "italic", fontSize: "9.5px" }}>
                <span>{[e.degree, e.field].filter(Boolean).join(" in ")}{e.honors ? ` — ${e.honors}` : ""}</span>
                {e.gpa && <span>GPA: {e.gpa}</span>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {hasExp(d) && (
        <Section title="Experience">
          {d.experience.filter(e => e.company || e.title).map((e, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</LinkText> : e.title}</strong> — {e.company}</span>
                <span style={{ fontSize: "9px" }}>{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              {e.location && <div style={{ fontSize: "9px", fontStyle: "italic" }}>{e.location}</div>}
              <ul style={{ margin: "2px 0 0 14px", paddingLeft: 0, listStyleType: "disc" }}>
                {e.bullets.filter(Boolean).map((b, bi) => (
                  <li key={bi} style={{ marginBottom: "0.5px" }}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {hasProjects(d) && (
        <Section title="Projects">
          {d.projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <div>
                <strong>{p.url ? <LinkText value={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</LinkText> : p.name}</strong>
                {p.technologies && <span style={{ fontSize: "9px", color: "#444" }}> | {p.technologies}</span>}
              </div>
              {p.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: "1px 0 0 14px", paddingLeft: 0, listStyleType: "disc" }}>
                  {p.bullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {hasSkills(d) && (
        <Section title="Technical Skills">
          {d.skills.filter(s => s.items.trim()).map((s, i) => (
            <div key={i} style={{ marginBottom: "1px" }}>
              <strong>{s.category}:</strong> {s.items}
            </div>
          ))}
        </Section>
      )}

      {hasCerts(d) && (
        <Section title="Certifications">
          {d.certifications.filter(c => c.name).map((c, i) => (
            <div key={i} style={{ marginBottom: "1px" }}>
              <strong>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

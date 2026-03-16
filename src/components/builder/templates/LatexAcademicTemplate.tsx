import { ResumeData } from "@/types/resume";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution || e.degree);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasPubs = (d: ResumeData) => d.publications.some(p => p.title);

const contactLine = (d: ResumeData) =>
  [d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio].filter(Boolean).join(" | ");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div data-resume-section style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1.5px solid #000", paddingBottom: "2px", marginBottom: "6px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function LatexAcademicTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{ padding: "18px 52px", fontFamily: "'CMU Serif', 'Times New Roman', serif", fontSize: "10.5px", lineHeight: "1.45", color: "#000" }}>
      {/* Header — centered, LaTeX-style */}
      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "0.5px" }}>
          {d.contact.name || "Your Name"}
        </h1>
        {contactLine(d) && (
          <p style={{ fontSize: "9px", color: "#333", marginTop: "4px", letterSpacing: "0.3px" }}>{contactLine(d)}</p>
        )}
      </div>

      {d.summary && (
        <Section title="Summary">
          <p style={{ textAlign: "justify", hyphens: "auto" as const }}>{d.summary}</p>
        </Section>
      )}

      {hasEdu(d) && (
        <Section title="Education">
          {d.education.filter(e => e.institution).map((e, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>{e.institution}</strong></span>
                <span style={{ fontSize: "9.5px" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              <div style={{ fontStyle: "italic", fontSize: "10px" }}>
                {[e.degree, e.field].filter(Boolean).join(" in ")}
                {e.gpa ? ` — GPA: ${e.gpa}` : ""}
                {e.honors ? ` — ${e.honors}` : ""}
              </div>
            </div>
          ))}
        </Section>
      )}

      {hasExp(d) && (
        <Section title="Experience">
          {d.experience.filter(e => e.company || e.title).map((e, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>{e.title}</strong>{e.company ? ` — ${e.company}` : ""}</span>
                <span style={{ fontSize: "9.5px" }}>{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              {e.location && <div style={{ fontSize: "9.5px", fontStyle: "italic" }}>{e.location}</div>}
              <ul style={{ margin: "3px 0 0 14px", paddingLeft: 0, listStyleType: "disc" }}>
                {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "1px" }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {hasProjects(d) && (
        <Section title="Projects">
          {d.projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>{p.name}</strong>{p.technologies ? ` | ${p.technologies}` : ""}</span>
                {p.url && <span style={{ fontSize: "9px", color: "#555" }}>{p.url}</span>}
              </div>
              {p.description && <p style={{ fontSize: "10px", color: "#333" }}>{p.description}</p>}
              {p.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: "2px 0 0 14px", paddingLeft: 0, listStyleType: "disc" }}>
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
            <div key={i} style={{ marginBottom: "2px" }}>
              <strong>{s.category}:</strong> {s.items}
            </div>
          ))}
        </Section>
      )}

      {hasCerts(d) && (
        <Section title="Certifications">
          {d.certifications.filter(c => c.name).map((c, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>
              <strong>{c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
            </div>
          ))}
        </Section>
      )}

      {hasPubs(d) && (
        <Section title="Publications">
          {d.publications.filter(p => p.title).map((p, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>
              {p.title}{p.publisher ? `, ${p.publisher}` : ""}{p.date ? `, ${p.date}` : ""}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

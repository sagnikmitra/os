import { ResumeData } from "@/types/resume";
import { LinkText, ContactLine } from "@/lib/resume-utils";
const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);

const baseStyle: React.CSSProperties = {
  padding: "34px 64px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: "10.5px",
  lineHeight: "1.6",
  color: "#333",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

export function MinimalTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={baseStyle}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 300, margin: 0, color: "#111", letterSpacing: "-0.5px", lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "12px", color: "#999", fontWeight: 400, marginTop: "4px" }}>{d.contact.title}</p>}
        <div style={{ fontSize: "9.5px", color: "#bbb", marginTop: "8px", letterSpacing: "0.5px", lineHeight: 1.6 }}>
          <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio]} />
        </div>
      </div>

      {d.summary && <Sec title="About"><p style={{ color: "#666", margin: 0 }}>{d.summary}</p></Sec>}

      {hasExp(d) && (
        <Sec title="Experience">
          {d.experience.filter(e => e.company || e.title).map((e, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontWeight: 600, color: "#111" }}>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}{e.company ? `, ${e.company}` : ""}</LinkText> : <>{e.title}{e.company ? `, ${e.company}` : ""}</>}</span>
                <span style={{ fontSize: "9.5px", color: "#bbb", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              <ul style={{ margin: "4px 0 0 0", padding: "0 0 0 14px", listStyleType: "none", color: "#666" }}>
                {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "2px" }}>— {b}</li>)}
              </ul>
            </div>
          ))}
        </Sec>
      )}

      {hasEdu(d) && (
        <Sec title="Education">
          {d.education.filter(e => e.institution).map((e, i) => (
            <p key={i} style={{ color: "#666", margin: "4px 0" }}>
              <span style={{ fontWeight: 600, color: "#111" }}>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? ` in ${e.field}` : ""}</>}</span> — {e.institution}{e.gpa ? `, ${e.gpa}` : ""} <span style={{ color: "#bbb" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
            </p>
          ))}
        </Sec>
      )}

      {hasSkills(d) && <Sec title="Skills"><p style={{ color: "#666", margin: 0 }}>{d.skills.filter(s => s.items.trim()).map(s => s.items).join(", ")}</p></Sec>}
      {hasProjects(d) && <Sec title="Projects">{d.projects.filter(p => p.name).map((p, i) => <p key={i} style={{ color: "#666", margin: "4px 0" }}><span style={{ fontWeight: 600, color: "#111" }}>{p.url ? <LinkText value={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</LinkText> : p.name}</span>{p.description ? ` — ${p.description}` : ""}</p>)}</Sec>}
      {hasCerts(d) && <Sec title="Certifications">{d.certifications.filter(c => c.name).map((c, i) => <p key={i} style={{ color: "#666", margin: "4px 0" }}>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}{c.issuer ? ` · ${c.issuer}` : ""}</p>)}</Sec>}
      {hasLangs(d) && <Sec title="Languages"><p style={{ color: "#666", margin: 0 }}>{d.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(", ")}</p></Sec>}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "4px", color: "#bbb", marginBottom: "8px", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: "8px" }}>{children}</div>
    </div>
  );
}

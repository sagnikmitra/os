import { ResumeData } from "@/types/resume";
import { LinkText } from "@/lib/resume-utils";

const cl = (d: ResumeData) => [d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin].filter(Boolean).join("  |  ");
const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasAwards = (d: ResumeData) => d.awards.some(a => a.title);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);

export function ExecutiveTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "11px", lineHeight: "1.55", color: "#222", wordBreak: "break-word", overflowWrap: "anywhere", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#111", color: "#fff", padding: "18px 56px", textAlign: "center" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 400, margin: 0, letterSpacing: "3px", textTransform: "uppercase", lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "12px", color: "#aaa", marginTop: "6px", letterSpacing: "1.5px" }}>{d.contact.title}</p>}
        {cl(d) && <p style={{ fontSize: "9.5px", color: "#888", marginTop: "10px", letterSpacing: "0.5px", lineHeight: 1.6 }}>{cl(d)}</p>}
      </div>

      <div style={{ padding: "18px 56px" }}>
        {d.summary && (
          <div style={{ marginBottom: "20px", padding: "16px 0", borderBottom: "1px solid #ddd" }}>
            <p style={{ color: "#555", fontStyle: "italic", textAlign: "center", margin: 0 }}>{d.summary}</p>
          </div>
        )}

        {hasExp(d) && (
          <Sec title="Professional Experience">
            {d.experience.filter(e => e.company || e.title).map((e, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{ fontWeight: 700, fontSize: "12px" }}>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</LinkText> : e.title}</span>
                  <span style={{ fontSize: "10px", color: "#999", fontStyle: "italic", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
                </div>
                <p style={{ color: "#555", margin: "1px 0 0" }}>{e.company}{e.location ? `, ${e.location}` : ""}</p>
                <ul style={{ margin: "6px 0 0 16px", padding: 0, listStyleType: "disc", color: "#444" }}>
                  {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "2px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Sec>
        )}

        {hasEdu(d) && (
          <Sec title="Education">
            {d.education.filter(e => e.institution).map((e, i) => (
              <div key={i} style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ minWidth: 0 }}><strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? `, ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? `, ${e.field}` : ""}</>}</strong> — {e.institution}{e.honors ? ` · ${e.honors}` : ""}</div>
                <span style={{ fontSize: "10px", color: "#999", fontStyle: "italic", whiteSpace: "nowrap", flexShrink: 0 }}>{e.endDate || e.startDate}</span>
              </div>
            ))}
          </Sec>
        )}

        <div style={{ display: "flex", gap: "40px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasSkills(d) && <Sec title="Core Competencies">{d.skills.filter(s => s.items.trim()).map((s, i) => <p key={i} style={{ color: "#444", margin: "2px 0" }}>{s.category ? `${s.category}: ` : ""}{s.items}</p>)}</Sec>}
            {hasProjects(d) && <Sec title="Key Projects">{d.projects.filter(p => p.name).map((p, i) => <p key={i} style={{ color: "#444", margin: "2px 0" }}><strong>{p.url ? <LinkText value={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</LinkText> : p.name}</strong>{p.description ? ` — ${p.description}` : ""}</p>)}</Sec>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasCerts(d) && <Sec title="Certifications">{d.certifications.filter(c => c.name).map((c, i) => <p key={i} style={{ color: "#444", margin: "2px 0" }}>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}{c.date ? ` (${c.date})` : ""}</p>)}</Sec>}
            {hasAwards(d) && <Sec title="Honors & Awards">{d.awards.filter(a => a.title).map((a, i) => <p key={i} style={{ color: "#444", margin: "2px 0" }}>{a.title}{a.date ? ` (${a.date})` : ""}</p>)}</Sec>}
            {hasLangs(d) && <Sec title="Languages"><p style={{ color: "#444", margin: 0 }}>{d.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(", ")}</p></Sec>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h2 style={{ fontSize: "10px", fontWeight: 400, textTransform: "uppercase", letterSpacing: "3px", color: "#888", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #ddd", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: "8px" }}>{children}</div>
    </div>
  );
}

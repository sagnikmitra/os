import { ResumeData } from "@/types/resume";
import { LinkText, ContactLine } from "@/lib/resume-utils";
const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasAwards = (d: ResumeData) => d.awards.some(a => a.title);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);

export function ProfessionalTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{ fontFamily: "'Work Sans', 'Segoe UI', sans-serif", fontSize: "11px", lineHeight: "1.5", color: "#1a1a1a", wordBreak: "break-word", overflowWrap: "anywhere", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#4F46E5", color: "#fff", padding: "18px 52px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>{d.contact.title}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px", fontSize: "10px", opacity: 0.85, lineHeight: 1.6 }}>
          <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio]} separator="  ·  " />
        </div>
      </div>

      <div style={{ padding: "18px 52px" }}>
        {d.summary && <Sec title="Professional Summary"><p style={{ color: "#444", margin: 0 }}>{d.summary}</p></Sec>}

        {hasExp(d) && (
          <Sec title="Work Experience">
            {d.experience.filter(e => e.company || e.title).map((e, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <div style={{ minWidth: 0 }}><strong style={{ fontSize: "12px" }}>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</LinkText> : e.title}</strong>{e.company && <span style={{ color: "#4F46E5", fontWeight: 600 }}> · {e.company}</span>}</div>
                  <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
                </div>
                {e.location && <p style={{ color: "#888", fontSize: "10px", margin: "1px 0 0" }}>{e.location}</p>}
                <ul style={{ margin: "4px 0 0 14px", padding: 0, listStyleType: "disc", color: "#444" }}>
                  {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "1px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Sec>
        )}

        {hasEdu(d) && (
          <Sec title="Education">
            {d.education.filter(e => e.institution).map((e, i) => (
              <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <div style={{ minWidth: 0 }}><strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? ` in ${e.field}` : ""}</>}</strong> — {e.institution}{e.gpa ? ` · GPA: ${e.gpa}` : ""}</div>
                <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
            ))}
          </Sec>
        )}

        {hasSkills(d) && (
          <Sec title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {d.skills.filter(s => s.items.trim()).map(s => s.items.split(",").map(i => i.trim()).filter(Boolean)).flat().map((s, i) => (
                <span key={i} style={{ padding: "2px 8px", borderRadius: "4px", backgroundColor: "#F0EFFF", color: "#4F46E5", fontSize: "10px", fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </Sec>
        )}

        {hasProjects(d) && <Sec title="Projects">{d.projects.filter(p => p.name).map((p, i) => <div key={i} style={{ marginBottom: "8px" }}><strong>{p.url ? <LinkText value={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</LinkText> : p.name}</strong>{p.technologies && <span style={{ color: "#888", fontSize: "10px" }}> · {p.technologies}</span>}{p.description && <p style={{ color: "#444", margin: "2px 0 0" }}>{p.description}</p>}</div>)}</Sec>}
        {hasCerts(d) && <Sec title="Certifications">{d.certifications.filter(c => c.name).map((c, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}</p>)}</Sec>}
        {hasAwards(d) && <Sec title="Awards">{d.awards.filter(a => a.title).map((a, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{a.url ? <LinkText value={a.url} style={{ color: "inherit", textDecoration: "none" }}>{a.title}</LinkText> : a.title}</strong>{a.issuer ? ` — ${a.issuer}` : ""}</p>)}</Sec>}
        {hasLangs(d) && <Sec title="Languages"><p style={{ margin: 0 }}>{d.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(" · ")}</p></Sec>}
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#1a1a1a", marginBottom: "6px", paddingBottom: "4px", borderBottom: "1px solid #e5e5e5", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: "6px" }}>{children}</div>
    </div>
  );
}

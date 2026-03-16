import { ResumeData } from "@/types/resume";
import { LinkText, ContactLine } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasAwards = (d: ResumeData) => d.awards.some(a => a.title);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);
const hasVol = (d: ResumeData) => d.volunteer.some(v => v.organization);
const hasPubs = (d: ResumeData) => d.publications.some(p => p.title);

const baseStyle: React.CSSProperties = {
  padding: "18px 56px",
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  fontSize: "11px",
  lineHeight: "1.55",
  color: "#1a1a1a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

export function ModernTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={baseStyle}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "#111", lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "13px", color: "#4F46E5", fontWeight: 600, marginTop: "2px" }}>{d.contact.title}</p>}
        <div style={{ fontSize: "10px", color: "#888", marginTop: "6px", lineHeight: 1.6 }}>
          <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio]} />
        </div>
      </div>

      {d.summary && <Sec title="Summary"><p style={{ color: "#444", margin: 0 }}>{d.summary}</p></Sec>}

      {hasExp(d) && (
        <Sec title="Experience">
          {d.experience.filter(e => e.company || e.title).map((e, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "4px" }}>
                <span style={{ fontWeight: 700 }}>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</LinkText> : e.title}</span>
                <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              <p style={{ color: "#4F46E5", fontWeight: 500, fontSize: "10.5px", margin: "1px 0 0" }}>{e.company}{e.location ? ` · ${e.location}` : ""}</p>
              <ul style={{ margin: "4px 0 0 14px", padding: 0, listStyleType: "disc", color: "#444" }}>
                {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "2px" }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Sec>
      )}

      {hasEdu(d) && (
        <Sec title="Education">
          {d.education.filter(e => e.institution).map((e, i) => (
            <div key={i} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
              <div style={{ minWidth: 0 }}><strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? ` in ${e.field}` : ""}</>}</strong> — {e.institution}{e.gpa ? ` (${e.gpa})` : ""}{e.honors ? ` · ${e.honors}` : ""}</div>
              <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
            </div>
          ))}
        </Sec>
      )}

      {hasSkills(d) && <Sec title="Skills">{d.skills.filter(s => s.items.trim()).map((s, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{s.category}:</strong> <span style={{ color: "#444" }}>{s.items}</span></p>)}</Sec>}
      
      {hasProjects(d) && (
        <Sec title="Projects">
          {d.projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                <strong>{p.name}</strong>
                {p.technologies && <span style={{ color: "#888", fontSize: "10px" }}> · {p.technologies}</span>}
                {p.url && <LinkText value={p.url} style={{ fontSize: "10px" }} />}
              </div>
              {p.description && <p style={{ color: "#444", margin: "2px 0 0" }}>{p.description}</p>}
              <ul style={{ margin: "2px 0 0 14px", listStyleType: "disc", color: "#444" }}>
                {p.bullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Sec>
      )}

      {hasCerts(d) && <Sec title="Certifications">{d.certifications.filter(c => c.name).map((c, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}</p>)}</Sec>}
      {hasAwards(d) && <Sec title="Awards">{d.awards.filter(a => a.title).map((a, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{a.url ? <LinkText value={a.url} style={{ color: "inherit", textDecoration: "none" }}>{a.title}</LinkText> : a.title}</strong>{a.issuer ? ` — ${a.issuer}` : ""}{a.date ? ` (${a.date})` : ""}</p>)}</Sec>}
      {hasLangs(d) && <Sec title="Languages"><p style={{ margin: 0 }}>{d.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(" · ")}</p></Sec>}
      {hasVol(d) && <Sec title="Volunteer">{d.volunteer.filter(v => v.organization).map((v, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{v.url ? <LinkText value={v.url} style={{ color: "inherit", textDecoration: "none" }}>{v.role}</LinkText> : v.role}</strong> at {v.organization}{v.description ? ` — ${v.description}` : ""}</p>)}</Sec>}
      {hasPubs(d) && <Sec title="Publications">{d.publications.filter(p => p.title).map((p, i) => <p key={i} style={{ margin: "2px 0" }}>{p.title}{p.publisher ? `, ${p.publisher}` : ""}{p.date ? ` (${p.date})` : ""}{p.url && <> · <LinkText value={p.url} /></>}</p>)}</Sec>}
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#4F46E5", marginBottom: "6px", paddingBottom: "4px", borderBottom: "2px solid #4F46E5", margin: 0, marginTop: 0 }}>{title}</h2>
      <div style={{ marginTop: "6px" }}>{children}</div>
    </div>
  );
}

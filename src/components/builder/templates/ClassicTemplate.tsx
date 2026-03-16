import { ResumeData } from "@/types/resume";
import { LinkText, ContactLine } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution || e.degree);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasAwards = (d: ResumeData) => d.awards.some(a => a.title);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);
const hasVol = (d: ResumeData) => d.volunteer.some(v => v.organization);
const hasPubs = (d: ResumeData) => d.publications.some(p => p.title);

const baseStyle: React.CSSProperties = {
  padding: "18px 56px",
  fontFamily: "'Merriweather', Georgia, serif",
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#1a1a1a",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  boxSizing: "border-box",
};

export function ClassicTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={baseStyle}>
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "1px", lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>{d.contact.title}</p>}
        <div style={{ fontSize: "10px", color: "#777", marginTop: "4px", lineHeight: 1.6 }}>
          <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio]} />
        </div>
      </div>

      {d.summary && <Section title="PROFESSIONAL SUMMARY"><p style={{ margin: 0 }}>{d.summary}</p></Section>}

      {hasExp(d) && (
        <Section title="EXPERIENCE">
          {d.experience.filter(e => e.company || e.title).map((e, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}{e.company ? ` — ${e.company}` : ""}</LinkText> : <>{e.title}{e.company ? ` — ${e.company}` : ""}</>}</strong>
                <span style={{ color: "#777", fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              {e.location && <p style={{ color: "#777", fontSize: "10px", margin: "1px 0 0" }}>{e.location}</p>}
              <ul style={{ margin: "4px 0 0 16px", paddingLeft: 0, listStyleType: "disc" }}>
                {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "1px" }}>{b}</li>)}
              </ul>
            </div>
          ))}
        </Section>
      )}

      {hasEdu(d) && (
        <Section title="EDUCATION">
          {d.education.filter(e => e.institution || e.degree).map((e, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                <strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? ` in ${e.field}` : ""}</>}</strong>
                <span style={{ color: "#777", fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
              <p style={{ color: "#555", margin: "1px 0 0" }}>{e.institution}{e.gpa ? ` · GPA: ${e.gpa}` : ""}{e.honors ? ` · ${e.honors}` : ""}</p>
            </div>
          ))}
        </Section>
      )}

      {hasSkills(d) && (
        <Section title="SKILLS">
          {d.skills.filter(s => s.items.trim()).map((s, i) => (
            <p key={i} style={{ margin: "2px 0" }}><strong>{s.category}:</strong> {s.items}</p>
          ))}
        </Section>
      )}

      {hasProjects(d) && (
        <Section title="PROJECTS">
          {d.projects.filter(p => p.name).map((p, i) => (
            <div key={i} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                <strong>{p.name}</strong>
                {p.technologies && <span style={{ color: "#777" }}> — {p.technologies}</span>}
                {p.url && <LinkText value={p.url} style={{ fontSize: "10px" }} />}
              </div>
              {p.description && <p style={{ margin: "2px 0 0" }}>{p.description}</p>}
              {p.bullets.filter(Boolean).length > 0 && (
                <ul style={{ margin: "2px 0 0 16px", listStyleType: "disc" }}>
                  {p.bullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {hasCerts(d) && <Section title="CERTIFICATIONS">{d.certifications.filter(c => c.name).map((c, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}</strong>{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}</p>)}</Section>}
      {hasAwards(d) && <Section title="AWARDS">{d.awards.filter(a => a.title).map((a, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{a.url ? <LinkText value={a.url} style={{ color: "inherit", textDecoration: "none" }}>{a.title}</LinkText> : a.title}</strong>{a.issuer ? ` — ${a.issuer}` : ""}{a.date ? ` (${a.date})` : ""}{a.description ? ` · ${a.description}` : ""}</p>)}</Section>}
      {hasLangs(d) && <Section title="LANGUAGES"><p style={{ margin: 0 }}>{d.languages.filter(l => l.language).map(l => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ""}`).join(" · ")}</p></Section>}
      {hasVol(d) && <Section title="VOLUNTEER">{d.volunteer.filter(v => v.organization).map((v, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{v.url ? <LinkText value={v.url} style={{ color: "inherit", textDecoration: "none" }}>{v.role}</LinkText> : v.role}</strong> — {v.organization}{v.startDate ? ` (${v.startDate}–${v.endDate || "Present"})` : ""}{v.description ? ` · ${v.description}` : ""}</p>)}</Section>}
      {hasPubs(d) && <Section title="PUBLICATIONS">{d.publications.filter(p => p.title).map((p, i) => <p key={i} style={{ margin: "2px 0" }}><strong>{p.title}</strong>{p.publisher ? ` — ${p.publisher}` : ""}{p.date ? ` (${p.date})` : ""}{p.url && <> · <LinkText value={p.url} /></>}</p>)}</Section>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h2 style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", borderBottom: "1px solid #333", paddingBottom: "2px", marginBottom: "6px", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: "6px" }}>{children}</div>
    </div>
  );
}

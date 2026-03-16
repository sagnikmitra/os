import { ResumeData } from "@/types/resume";
import { LinkText } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasLangs = (d: ResumeData) => d.languages.some(l => l.language);

export function CreativeTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{ display: "flex", fontFamily: "'Poppins', 'Segoe UI', sans-serif", fontSize: "11px", lineHeight: "1.5", color: "#1a1a1a", minHeight: "1123px", wordBreak: "break-word", overflowWrap: "anywhere", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <div style={{ width: "220px", backgroundColor: "#1a1a2e", color: "#fff", padding: "18px 24px", flexShrink: 0, overflow: "hidden", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ fontSize: "11px", color: "#a5b4fc", marginTop: "4px", fontWeight: 500 }}>{d.contact.title}</p>}

        <div style={{ marginTop: "24px" }}>
          <SideHead>Contact</SideHead>
          {d.contact.email && <SideItem>{d.contact.email}</SideItem>}
          {d.contact.phone && <SideItem>{d.contact.phone}</SideItem>}
          {d.contact.location && <SideItem>{d.contact.location}</SideItem>}
          {d.contact.linkedin && <SideItem>{d.contact.linkedin}</SideItem>}
          {d.contact.portfolio && <SideItem>{d.contact.portfolio}</SideItem>}
        </div>

        {hasSkills(d) && (
          <div style={{ marginTop: "20px" }}>
            <SideHead>Skills</SideHead>
            {d.skills.filter(s => s.items.trim()).map((s, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                {s.category && <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#a5b4fc", fontWeight: 600, marginBottom: "2px", margin: 0 }}>{s.category}</p>}
                <p style={{ color: "#ccc", fontSize: "10px", margin: "2px 0 0" }}>{s.items}</p>
              </div>
            ))}
          </div>
        )}

        {hasLangs(d) && (
          <div style={{ marginTop: "20px" }}>
            <SideHead>Languages</SideHead>
            {d.languages.filter(l => l.language).map((l, i) => <SideItem key={i}>{l.language} — {l.proficiency}</SideItem>)}
          </div>
        )}

        {hasCerts(d) && (
          <div style={{ marginTop: "20px" }}>
            <SideHead>Certifications</SideHead>
            {d.certifications.filter(c => c.name).map((c, i) => <SideItem key={i}>{c.url ? <LinkText value={c.url} style={{ color: "inherit", textDecoration: "none" }}>{c.name}</LinkText> : c.name}</SideItem>)}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "18px 40px", minWidth: 0, overflow: "hidden" }}>
        {d.summary && <Sec title="About Me"><p style={{ color: "#555", margin: 0 }}>{d.summary}</p></Sec>}

        {hasExp(d) && (
          <Sec title="Experience">
            {d.experience.filter(e => e.company || e.title).map((e, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                  <strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.title}</LinkText> : e.title}</strong>
                  <span style={{ fontSize: "10px", color: "#999", whiteSpace: "nowrap", flexShrink: 0 }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
                </div>
                <p style={{ color: "#4F46E5", fontWeight: 600, fontSize: "10.5px", margin: "1px 0 0" }}>{e.company}{e.location ? ` · ${e.location}` : ""}</p>
                <ul style={{ margin: "4px 0 0 14px", padding: 0, listStyleType: "disc", color: "#555" }}>
                  {e.bullets.filter(Boolean).map((b, bi) => <li key={bi} style={{ marginBottom: "1px" }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </Sec>
        )}

        {hasEdu(d) && (
          <Sec title="Education">
            {d.education.filter(e => e.institution).map((e, i) => (
              <div key={i} style={{ marginBottom: "6px" }}>
                <strong>{e.url ? <LinkText value={e.url} style={{ color: "inherit", textDecoration: "none" }}>{e.degree}{e.field ? ` in ${e.field}` : ""}</LinkText> : <>{e.degree}{e.field ? ` in ${e.field}` : ""}</>}</strong> — {e.institution}
                <span style={{ fontSize: "10px", color: "#999", marginLeft: "8px" }}>{[e.startDate, e.endDate].filter(Boolean).join(" – ")}</span>
              </div>
            ))}
          </Sec>
        )}

        {hasProjects(d) && <Sec title="Projects">{d.projects.filter(p => p.name).map((p, i) => <div key={i} style={{ marginBottom: "8px" }}><strong>{p.url ? <LinkText value={p.url} style={{ color: "inherit", textDecoration: "none" }}>{p.name}</LinkText> : p.name}</strong>{p.technologies && <span style={{ color: "#888", fontSize: "10px" }}> · {p.technologies}</span>}{p.description && <p style={{ color: "#555", margin: "2px 0 0" }}>{p.description}</p>}</div>)}</Sec>}
      </div>
    </div>
  );
}

function SideHead({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "2.5px", color: "#a5b4fc", fontWeight: 700, marginBottom: "6px", paddingBottom: "4px", borderBottom: "1px solid #333", margin: 0 }}>{children}</h3>;
}

function SideItem({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "10px", color: "#ccc", marginBottom: "3px", margin: "3px 0" }}>{children}</p>;
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h2 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "#4F46E5", marginBottom: "8px", margin: 0 }}>{title}</h2>
      <div style={{ marginTop: "8px" }}>{children}</div>
    </div>
  );
}

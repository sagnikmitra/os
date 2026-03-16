import { ResumeData } from "@/types/resume";

const hasExp = (d: ResumeData) => d.experience.some(e => e.company || e.title);
const hasEdu = (d: ResumeData) => d.education.some(e => e.institution);
const hasSkills = (d: ResumeData) => d.skills.some(s => s.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some(p => p.name);
const hasCerts = (d: ResumeData) => d.certifications.some(c => c.name);
const hasSummary = (d: ResumeData) => !!d.summary.trim();

const font = "'Source Serif 4', 'Times New Roman', serif";

function SectionHeader({ title }: { title: string }) {
  return (
    <div data-resume-section style={{ marginTop: "9px", marginBottom: "6px" }}>
      <div style={{
        fontSize: "9.5px",
        fontWeight: 400,
        fontVariant: "small-caps",
        letterSpacing: "1.5px",
        color: "#333",
        borderBottom: "0.8px solid #999",
        paddingBottom: "2px",
        textTransform: "uppercase",
      }}>
        {title}
      </div>
    </div>
  );
}

/**
 * SB LaTeX Template — Inspired by the uploaded resumes.
 * Classic LaTeX aesthetic: small-caps section headers with thin horizontal rules,
 * serif font, skills as bold label/value table, experience with title|company
 * and right-aligned dates, italic technologies line, bullet points.
 * Clean single-column, ATS-friendly.
 */
export function LatexSBTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div style={{
      padding: "18px 44px",
      fontFamily: font,
      fontSize: "10px",
      lineHeight: "1.4",
      color: "#000",
    }}>
      {/* Header — Name centered, large serif small-caps */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: 400,
          fontVariant: "small-caps",
          letterSpacing: "3px",
          margin: 0,
          lineHeight: 1.2,
        }}>
          {d.contact.name || "Your Name"}
        </h1>
        {d.contact.title && (
          <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>
            {d.contact.title}
          </div>
        )}
      </div>

      {/* Contact row */}
      <div style={{
        textAlign: "center",
        fontSize: "9px",
        color: "#333",
        marginBottom: "10px",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "4px 14px",
      }}>
        {d.contact.email && <span>✉ {d.contact.email}</span>}
        {d.contact.phone && <span>✆ {d.contact.phone}</span>}
        {d.contact.linkedin && <span>🔗 LinkedIn</span>}
        {d.contact.portfolio && <span>🌐 Portfolio</span>}
        {d.contact.location && <span>📍 {d.contact.location}</span>}
      </div>

      {/* Summary / Profile */}
      {hasSummary(d) && (
        <>
          <SectionHeader title="Professional Summary" />
          <div style={{
            fontSize: "9.5px",
            color: "#222",
            lineHeight: "1.5",
            paddingLeft: "12px",
            marginBottom: "4px",
          }}>
            {d.summary}
          </div>
        </>
      )}

      {/* Skills as key-value table */}
      {hasSkills(d) && (
        <>
          <SectionHeader title="Technical Skills & Expertise" />
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "9.5px",
            marginLeft: "12px",
          }}>
            <tbody>
              {d.skills.map((sk) => (
                <tr key={sk.id}>
                  <td style={{
                    fontWeight: 700,
                    paddingRight: "16px",
                    paddingTop: "1.5px",
                    paddingBottom: "1.5px",
                    verticalAlign: "top",
                    whiteSpace: "nowrap",
                    width: "1%",
                  }}>
                    {sk.category}:
                  </td>
                  <td style={{ paddingTop: "1.5px", paddingBottom: "1.5px", color: "#222" }}>
                    {sk.items}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Education */}
      {hasEdu(d) && (
        <>
          <SectionHeader title="Education" />
          {d.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: "5px", paddingLeft: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "10px" }}>{edu.institution}</span>
                  {edu.field && <span style={{ color: "#444" }}> — {edu.degree}{edu.field ? `, ${edu.field}` : ""}</span>}
                </div>
                <div style={{ fontSize: "9px", color: "#444", whiteSpace: "nowrap", textAlign: "right" }}>
                  {edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : edu.endDate || edu.startDate}
                </div>
              </div>
              {edu.gpa && <div style={{ fontSize: "9px", color: "#555" }}>CGPA: {edu.gpa}{edu.honors ? ` | ${edu.honors}` : ""}</div>}
            </div>
          ))}
        </>
      )}

      {/* Experience */}
      {hasExp(d) && (
        <>
          <SectionHeader title="Work Experience" />
          {d.experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: "8px", paddingLeft: "12px" }}>
              {/* Title | Company  ——  Location | Date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: "10px" }}>
                  <span style={{ fontWeight: 700 }}>{exp.title}</span>
                  {exp.company && (
                    <span style={{ color: "#222" }}> | {exp.company}</span>
                  )}
                </div>
                <div style={{ fontSize: "9px", color: "#444", whiteSpace: "nowrap", textAlign: "right" }}>
                  {exp.location && `${exp.location} | `}{exp.startDate} - {exp.current ? "Present" : exp.endDate}
                </div>
              </div>

              {/* Bullets */}
              {exp.bullets.length > 0 && (
                <ul style={{
                  margin: "3px 0 0 0",
                  paddingLeft: "14px",
                  listStyleType: "disc",
                }}>
                  {exp.bullets.filter(b => b.trim()).map((b, i) => (
                    <li key={i} style={{ marginBottom: "1.5px", fontSize: "9.5px", lineHeight: "1.45", color: "#111" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {/* Projects */}
      {hasProjects(d) && (
        <>
          <SectionHeader title="Projects" />
          {d.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: "6px", paddingLeft: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: "10px" }}>{proj.name}</span>
                {proj.technologies && (
                  <span style={{ fontSize: "8.5px", fontStyle: "italic", color: "#555" }}>
                    {proj.technologies}
                  </span>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: "9px", color: "#333", marginTop: "1px" }}>{proj.description}</div>
              )}
              {proj.bullets.length > 0 && (
                <ul style={{ margin: "2px 0 0 0", paddingLeft: "14px", listStyleType: "disc" }}>
                  {proj.bullets.filter(b => b.trim()).map((b, i) => (
                    <li key={i} style={{ marginBottom: "1px", fontSize: "9.5px", lineHeight: "1.45", color: "#111" }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {/* Certifications */}
      {hasCerts(d) && (
        <>
          <SectionHeader title="Certifications" />
          {d.certifications.map((c) => (
            <div key={c.id} style={{ paddingLeft: "12px", marginBottom: "2px", fontSize: "9.5px" }}>
              <span style={{ fontWeight: 700 }}>{c.name}</span>
              {c.issuer && <span style={{ color: "#444" }}> — {c.issuer}</span>}
              {c.date && <span style={{ color: "#666", marginLeft: "8px" }}>{c.date}</span>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

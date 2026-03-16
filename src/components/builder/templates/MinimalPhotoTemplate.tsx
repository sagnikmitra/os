import { ResumeData } from "@/types/resume";
import { LinkText } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some((entry) => entry.company || entry.title);
const hasEdu = (d: ResumeData) => d.education.some((entry) => entry.institution);
const hasSkills = (d: ResumeData) => d.skills.some((entry) => entry.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some((entry) => entry.name);
const hasCerts = (d: ResumeData) => d.certifications.some((entry) => entry.name);
const hasLangs = (d: ResumeData) => d.languages.some((entry) => entry.language);

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CV";

export function MinimalPhotoTemplate({ data: d }: { data: ResumeData }) {
  const photo = d.contact.photoUrl?.trim();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "190px 1fr",
        minHeight: "1123px",
        background: "linear-gradient(90deg, #f8fafc 0 190px, #e2e8f0 190px 191px, #ffffff 191px 100%)",
        fontFamily: "'Lato', 'Segoe UI', sans-serif",
        fontSize: "11px",
        lineHeight: "1.55",
        color: "#16202a",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        boxSizing: "border-box",
      }}
    >
      <aside style={{ padding: "18px 18px", boxSizing: "border-box" }}>
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "999px",
            overflow: "hidden",
            margin: "0 auto 14px",
            border: "2px solid #dbeafe",
            backgroundColor: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "28px",
            color: "#1d4ed8",
          }}
        >
          {photo ? (
            <img src={photo} alt={d.contact.name || "Profile"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <span>{initials(d.contact.name)}</span>
          )}
        </div>

        <h1 style={{ margin: 0, textAlign: "center", fontSize: "18px", lineHeight: 1.2, fontWeight: 800 }}>{d.contact.name || "Your Name"}</h1>
        {d.contact.title && <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: "10px", color: "#1d4ed8", fontWeight: 700 }}>{d.contact.title}</p>}

        <SideSection title="Contact">
          {d.contact.email && <p style={{ margin: "0 0 4px", fontSize: "10px" }}>{d.contact.email}</p>}
          {d.contact.phone && <p style={{ margin: "0 0 4px", fontSize: "10px" }}>{d.contact.phone}</p>}
          {d.contact.location && <p style={{ margin: "0 0 4px", fontSize: "10px" }}>{d.contact.location}</p>}
          {d.contact.linkedin && <p style={{ margin: "0 0 4px", fontSize: "10px" }}><LinkText value={d.contact.linkedin} /></p>}
          {d.contact.portfolio && <p style={{ margin: "0 0 4px", fontSize: "10px" }}><LinkText value={d.contact.portfolio} /></p>}
        </SideSection>

        {hasSkills(d) && (
          <SideSection title="Skills">
            {d.skills
              .filter((entry) => entry.items.trim())
              .flatMap((entry) => entry.items.split(","))
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item, index) => (
                <p key={index} style={{ margin: "0 0 4px", fontSize: "10px", color: "#334155" }}>
                  {item}
                </p>
              ))}
          </SideSection>
        )}

        {hasLangs(d) && (
          <SideSection title="Languages">
            {d.languages
              .filter((entry) => entry.language)
              .map((entry, index) => (
                <p key={index} style={{ margin: "0 0 4px", fontSize: "10px", color: "#334155" }}>
                  {entry.language}
                  {entry.proficiency ? ` (${entry.proficiency})` : ""}
                </p>
              ))}
          </SideSection>
        )}
      </aside>

      <main style={{ padding: "18px 44px", minWidth: 0, boxSizing: "border-box" }}>
        {d.summary && (
          <Section title="Summary">
            <p style={{ margin: 0, color: "#334155" }}>{d.summary}</p>
          </Section>
        )}

        {hasExp(d) && (
          <Section title="Experience">
            {d.experience
              .filter((entry) => entry.company || entry.title)
              .map((entry, index) => (
                <div key={index} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", flexWrap: "wrap", alignItems: "baseline" }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: "11.8px" }}>
                        {entry.url ? (
                          <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                            {entry.title}
                          </LinkText>
                        ) : (
                          entry.title
                        )}
                      </strong>
                      {entry.company && <span style={{ color: "#1d4ed8", fontWeight: 700 }}> - {entry.company}</span>}
                    </div>
                    <span style={{ fontSize: "10px", color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                  {entry.location && <p style={{ margin: "1px 0 0", color: "#64748b", fontSize: "10px" }}>{entry.location}</p>}
                  <ul style={{ margin: "5px 0 0 14px", padding: 0, listStyleType: "disc", color: "#334155" }}>
                    {entry.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </Section>
        )}

        {hasProjects(d) && (
          <Section title="Projects">
            {d.projects
              .filter((entry) => entry.name)
              .map((entry, index) => (
                <div key={index} style={{ marginBottom: "9px" }}>
                  <strong>
                    {entry.url ? (
                      <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                        {entry.name}
                      </LinkText>
                    ) : (
                      entry.name
                    )}
                  </strong>
                  {entry.technologies && <span style={{ color: "#64748b", fontSize: "10px" }}> - {entry.technologies}</span>}
                  {entry.description && <p style={{ margin: "2px 0 0", color: "#334155" }}>{entry.description}</p>}
                </div>
              ))}
          </Section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ minWidth: 0 }}>
            {hasEdu(d) && (
              <Section title="Education">
                {d.education
                  .filter((entry) => entry.institution)
                  .map((entry, index) => (
                    <p key={index} style={{ margin: "2px 0", color: "#334155" }}>
                      <strong>
                        {entry.degree}
                        {entry.field ? ` in ${entry.field}` : ""}
                      </strong>
                      {" - "}
                      {entry.institution}
                    </p>
                  ))}
              </Section>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            {hasCerts(d) && (
              <Section title="Certifications">
                {d.certifications
                  .filter((entry) => entry.name)
                  .map((entry, index) => (
                    <p key={index} style={{ margin: "2px 0", color: "#334155" }}>
                      {entry.url ? (
                        <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                          {entry.name}
                        </LinkText>
                      ) : (
                        entry.name
                      )}
                      {entry.date ? ` (${entry.date})` : ""}
                    </p>
                  ))}
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "16px" }}>
      <h3
        style={{
          margin: "0 0 7px",
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "1.8px",
          fontWeight: 800,
          color: "#1d4ed8",
        }}
      >
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "15px" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "1.8px",
          fontWeight: 800,
          color: "#1d4ed8",
          borderBottom: "1px solid #dbeafe",
          paddingBottom: "5px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "7px" }}>{children}</div>
    </section>
  );
}

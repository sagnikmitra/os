import { ResumeData } from "@/types/resume";
import { ContactLine, LinkText } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some((entry) => entry.company || entry.title);
const hasEdu = (d: ResumeData) => d.education.some((entry) => entry.institution);
const hasSkills = (d: ResumeData) => d.skills.some((entry) => entry.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some((entry) => entry.name);
const hasCerts = (d: ResumeData) => d.certifications.some((entry) => entry.name);

export function DesignerProTemplate({ data: d }: { data: ResumeData }) {
  return (
    <div
      style={{
        fontFamily: "'Manrope', 'Segoe UI', sans-serif",
        fontSize: "11px",
        lineHeight: "1.55",
        color: "#1b2230",
        padding: "18px 56px",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", lineHeight: 1.15, fontWeight: 800 }}>{d.contact.name || "Your Name"}</h1>
            {d.contact.title && (
              <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#0f766e", fontWeight: 700 }}>{d.contact.title}</p>
            )}
          </div>
          {(d.contact.portfolio || d.contact.linkedin) && (
            <div style={{ textAlign: "right", minWidth: 0 }}>
              {d.contact.portfolio && (
                <p style={{ margin: 0, fontSize: "10px", color: "#0f766e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px" }}>
                  Portfolio
                </p>
              )}
              {d.contact.portfolio && (
                <p style={{ margin: "2px 0 0", fontSize: "10.5px" }}>
                  <LinkText value={d.contact.portfolio} />
                </p>
              )}
              {d.contact.linkedin && (
                <p style={{ margin: "2px 0 0", fontSize: "10.5px" }}>
                  <LinkText value={d.contact.linkedin} />
                </p>
              )}
            </div>
          )}
        </div>
        <div style={{ marginTop: "10px", fontSize: "10.2px", color: "#5c6678", lineHeight: 1.6 }}>
          <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location]} />
        </div>
      </header>

      {d.summary && (
        <Section title="Profile">
          <p style={{ margin: 0, color: "#3f4a5f" }}>{d.summary}</p>
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
                    <strong style={{ fontSize: "12px", fontWeight: 700 }}>
                      {entry.url ? (
                        <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                          {entry.title}
                        </LinkText>
                      ) : (
                        entry.title
                      )}
                    </strong>
                    {entry.company && <span style={{ color: "#0f766e", fontWeight: 700 }}>  -  {entry.company}</span>}
                  </div>
                  <span style={{ fontSize: "10px", color: "#8792a5", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {entry.location && <p style={{ margin: "1px 0 0", color: "#667085", fontSize: "10.2px" }}>{entry.location}</p>}
                <ul style={{ margin: "5px 0 0 14px", padding: 0, listStyleType: "disc", color: "#3f4a5f" }}>
                  {entry.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                    <li key={bulletIndex} style={{ marginBottom: "2px" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </Section>
      )}

      {hasProjects(d) && (
        <Section title="Case Studies">
          {d.projects
            .filter((entry) => entry.name)
            .map((entry, index) => (
              <div key={index} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "baseline", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: "11.5px" }}>
                    {entry.url ? (
                      <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                        {entry.name}
                      </LinkText>
                    ) : (
                      entry.name
                    )}
                  </strong>
                  {entry.technologies && <span style={{ fontSize: "10px", color: "#667085" }}>- {entry.technologies}</span>}
                </div>
                {entry.description && <p style={{ margin: "2px 0 0", color: "#3f4a5f" }}>{entry.description}</p>}
                {entry.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ margin: "4px 0 0 14px", padding: 0, listStyleType: "disc", color: "#3f4a5f" }}>
                    {entry.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </Section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "26px" }}>
        <div style={{ minWidth: 0 }}>
          {hasEdu(d) && (
            <Section title="Education">
              {d.education
                .filter((entry) => entry.institution)
                .map((entry, index) => (
                  <div key={index} style={{ marginBottom: "7px", display: "flex", justifyContent: "space-between", gap: "6px", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <strong>
                        {entry.url ? (
                          <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                            {entry.degree}
                            {entry.field ? ` in ${entry.field}` : ""}
                          </LinkText>
                        ) : (
                          <>
                            {entry.degree}
                            {entry.field ? ` in ${entry.field}` : ""}
                          </>
                        )}
                      </strong>
                      <span style={{ color: "#3f4a5f" }}> - {entry.institution}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#8792a5", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                ))}
            </Section>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          {hasSkills(d) && (
            <Section title="Tools & Skills">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {d.skills
                  .filter((entry) => entry.items.trim())
                  .flatMap((entry) => entry.items.split(","))
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item, index) => (
                    <span
                      key={index}
                      style={{
                        border: "1px solid #a7f3d0",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        borderRadius: "999px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      {item}
                    </span>
                  ))}
              </div>
            </Section>
          )}
          {hasCerts(d) && (
            <Section title="Credentials">
              {d.certifications
                .filter((entry) => entry.name)
                .map((entry, index) => (
                  <p key={index} style={{ margin: "2px 0", color: "#3f4a5f" }}>
                    <strong>
                      {entry.url ? (
                        <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                          {entry.name}
                        </LinkText>
                      ) : (
                        entry.name
                      )}
                    </strong>
                    {entry.issuer ? ` - ${entry.issuer}` : ""}
                    {entry.date ? ` (${entry.date})` : ""}
                  </p>
                ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "16px" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 800,
          color: "#0f766e",
          borderBottom: "1px solid #99f6e4",
          paddingBottom: "5px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "7px" }}>{children}</div>
    </section>
  );
}

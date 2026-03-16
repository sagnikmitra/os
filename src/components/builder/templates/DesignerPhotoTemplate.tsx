import { ResumeData } from "@/types/resume";
import { ContactLine, LinkText } from "@/lib/resume-utils";

const hasExp = (d: ResumeData) => d.experience.some((entry) => entry.company || entry.title);
const hasEdu = (d: ResumeData) => d.education.some((entry) => entry.institution);
const hasSkills = (d: ResumeData) => d.skills.some((entry) => entry.items.trim());
const hasProjects = (d: ResumeData) => d.projects.some((entry) => entry.name);

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "CV";

export function DesignerPhotoTemplate({ data: d }: { data: ResumeData }) {
  const photo = d.contact.photoUrl?.trim();

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        fontSize: "11px",
        lineHeight: "1.54",
        color: "#111827",
        padding: "18px 54px",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        boxSizing: "border-box",
      }}
    >
      <header style={{ marginBottom: "18px", paddingBottom: "16px", borderBottom: "2px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "27px", lineHeight: 1.16, fontWeight: 800 }}>{d.contact.name || "Your Name"}</h1>
            {d.contact.title && <p style={{ margin: "3px 0 0", color: "#7c3aed", fontSize: "13px", fontWeight: 700 }}>{d.contact.title}</p>}
            <div style={{ marginTop: "9px", color: "#667085", fontSize: "10.2px", lineHeight: 1.6 }}>
              <ContactLine items={[d.contact.email, d.contact.phone, d.contact.location, d.contact.linkedin, d.contact.portfolio]} />
            </div>
          </div>
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              background: "linear-gradient(160deg, #f5f3ff 0%, #eef2ff 100%)",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6d28d9",
              fontWeight: 800,
              fontSize: "24px",
            }}
          >
            {photo ? (
              <img
                src={photo}
                alt={d.contact.name || "Profile"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span>{initials(d.contact.name)}</span>
            )}
          </div>
        </div>
      </header>

      {d.summary && (
        <Section title="Design Narrative">
          <p style={{ margin: 0, color: "#374151" }}>{d.summary}</p>
        </Section>
      )}

      {hasExp(d) && (
        <Section title="Experience">
          {d.experience
            .filter((entry) => entry.company || entry.title)
            .map((entry, index) => (
              <div key={index} style={{ marginBottom: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", flexWrap: "wrap", alignItems: "baseline" }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: "12px" }}>
                      {entry.url ? (
                        <LinkText value={entry.url} style={{ color: "inherit", textDecoration: "none" }}>
                          {entry.title}
                        </LinkText>
                      ) : (
                        entry.title
                      )}
                    </strong>
                    {entry.company && <span style={{ color: "#7c3aed", fontWeight: 700 }}>  -  {entry.company}</span>}
                  </div>
                  <span style={{ fontSize: "10px", color: "#98a2b3", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                  </span>
                </div>
                {entry.location && <p style={{ margin: "1px 0 0", color: "#6b7280", fontSize: "10px" }}>{entry.location}</p>}
                <ul style={{ margin: "5px 0 0 14px", padding: 0, listStyleType: "disc", color: "#374151" }}>
                  {entry.bullets.filter(Boolean).map((bullet, bulletIndex) => (
                    <li key={bulletIndex} style={{ marginBottom: "1px" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </Section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "24px" }}>
        <div style={{ minWidth: 0 }}>
          {hasProjects(d) && (
            <Section title="Featured Work">
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
                      {entry.technologies && <span style={{ color: "#6b7280", fontSize: "10px" }}>{entry.technologies}</span>}
                    </div>
                    {entry.description && <p style={{ margin: "2px 0 0", color: "#374151" }}>{entry.description}</p>}
                  </div>
                ))}
            </Section>
          )}

          {hasEdu(d) && (
            <Section title="Education">
              {d.education
                .filter((entry) => entry.institution)
                .map((entry, index) => (
                  <div key={index} style={{ marginBottom: "7px", display: "flex", justifyContent: "space-between", gap: "6px", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <strong>
                        {entry.degree}
                        {entry.field ? ` in ${entry.field}` : ""}
                      </strong>
                      <span style={{ color: "#374151" }}> - {entry.institution}</span>
                    </div>
                    <span style={{ fontSize: "10px", color: "#98a2b3", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                ))}
            </Section>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {hasSkills(d) && (
            <Section title="Craft">
              {d.skills
                .filter((entry) => entry.items.trim())
                .map((entry, index) => (
                  <div key={index} style={{ marginBottom: "8px" }}>
                    {entry.category && (
                      <p
                        style={{
                          margin: 0,
                          color: "#7c3aed",
                          fontSize: "9.5px",
                          textTransform: "uppercase",
                          letterSpacing: "1.4px",
                          fontWeight: 700,
                        }}
                      >
                        {entry.category}
                      </p>
                    )}
                    <p style={{ margin: "2px 0 0", color: "#374151" }}>{entry.items}</p>
                  </div>
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
          fontWeight: 700,
          color: "#7c3aed",
          borderBottom: "1px solid #e9d5ff",
          paddingBottom: "5px",
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: "7px" }}>{children}</div>
    </section>
  );
}

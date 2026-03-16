import { PortfolioData } from "@/types/portfolio";
import { Mail, MapPin, ExternalLink, ArrowRight } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function MinimalEditorialTemplate({ data }: Props) {
  const visibleSections = data.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,99%)] text-[hsl(240,10%,8%)]" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-24 pb-16 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                  {data.hero.headline || "Your Name"}
                </h1>
                <p className="mt-4 text-lg text-[hsl(240,4%,46%)] leading-relaxed max-w-xl">
                  {data.hero.subheadline || "A brief introduction about yourself and what you do."}
                </p>
                {data.hero.ctaText && (
                  <a href={data.hero.ctaUrl} className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[hsl(243,75%,59%)] hover:underline">
                    {data.hero.ctaText} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </section>
            );
          case "about":
            return (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(240,4%,46%)] mb-6">{data.about.title || "About"}</h2>
                <p className="text-base leading-relaxed text-[hsl(240,6%,25%)]">
                  {data.about.bio || "Tell your story here."}
                </p>
                {data.about.highlights.length > 0 && (
                  <ul className="mt-6 space-y-2">
                    {data.about.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-[hsl(240,4%,46%)] flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-[hsl(243,75%,59%)] mt-2 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(240,4%,46%)] mb-8">Experience</h2>
                <div className="space-y-10">
                  {data.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-base font-semibold">{exp.role}</h3>
                        <span className="text-xs text-[hsl(240,4%,46%)]">{exp.period}</span>
                      </div>
                      <p className="text-sm text-[hsl(243,75%,59%)] mt-0.5">{exp.company}</p>
                      <p className="text-sm text-[hsl(240,6%,35%)] mt-2 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(240,4%,46%)] mb-8">Selected Work</h2>
                <div className="space-y-8">
                  {data.projects.map((p) => (
                    <div key={p.id} className="group">
                      <h3 className="text-base font-semibold group-hover:text-[hsl(243,75%,59%)] transition-colors">{p.title}</h3>
                      <p className="text-sm text-[hsl(240,6%,35%)] mt-1 leading-relaxed">{p.description}</p>
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {p.tags.map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(240,5%,96%)] text-[hsl(240,4%,46%)]">{t}</span>
                          ))}
                        </div>
                      )}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 mt-2 text-xs text-[hsl(243,75%,59%)] hover:underline">
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(240,4%,46%)] mb-8">Capabilities</h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  {data.skills.map((s) => (
                    <div key={s.id}>
                      <h3 className="text-sm font-semibold mb-2">{s.category}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {s.items.map((item, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(240,5%,96%)] text-[hsl(240,6%,25%)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(240,4%,46%)] mb-6">Contact</h2>
                <div className="space-y-2 text-sm">
                  {data.contact.email && (
                    <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 text-[hsl(240,6%,25%)] hover:text-[hsl(243,75%,59%)]">
                      <Mail className="h-3.5 w-3.5" /> {data.contact.email}
                    </a>
                  )}
                  {data.contact.location && (
                    <p className="flex items-center gap-2 text-[hsl(240,4%,46%)]">
                      <MapPin className="h-3.5 w-3.5" /> {data.contact.location}
                    </p>
                  )}
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

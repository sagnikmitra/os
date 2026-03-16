import { PortfolioData } from "@/types/portfolio";
import { ArrowRight, Mail, MapPin, ExternalLink } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function HybridProfessionalTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,100%)] text-[hsl(240,10%,8%)]" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-20 pb-16 max-w-4xl mx-auto grid md:grid-cols-5 gap-12 items-center">
                <div className="md:col-span-3">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">
                    {data.hero.headline || "Your Name"}
                  </h1>
                  <p className="mt-4 text-base text-[hsl(240,4%,46%)] leading-relaxed">
                    {data.hero.subheadline || "Professional with a passion for creating impact."}
                  </p>
                  {data.hero.ctaText && (
                    <a href={data.hero.ctaUrl} className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-[hsl(243,75%,59%)] text-white text-sm font-medium hover:opacity-90 transition">
                      {data.hero.ctaText} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-center">
                  {data.hero.showPhoto && data.hero.photoUrl ? (
                    <img
                      src={data.hero.photoUrl}
                      alt="Profile"
                      loading="lazy"
                      decoding="async"
                      className="w-48 h-48 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-2xl bg-[hsl(240,5%,96%)] flex items-center justify-center text-xs text-[hsl(240,4%,46%)]">Photo</div>
                  )}
                </div>
              </section>
            );
          case "about":
            return (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(240,4%,46%)]">About</h2>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-base leading-relaxed text-[hsl(240,6%,25%)]">{data.about.bio || "Your professional narrative."}</p>
                    {data.about.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {data.about.highlights.map((h, i) => (
                          <span key={i} className="text-xs px-3 py-1 rounded-full bg-[hsl(243,75%,59%)/0.08] text-[hsl(243,75%,59%)] font-medium">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <div className="grid md:grid-cols-3 gap-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(240,4%,46%)]">Experience</h2>
                  <div className="md:col-span-2 space-y-8">
                    {data.experience.map((exp) => (
                      <div key={exp.id}>
                        <h3 className="text-base font-semibold">{exp.role}</h3>
                        <p className="text-sm text-[hsl(243,75%,59%)]">{exp.company} · {exp.period}</p>
                        <p className="text-sm text-[hsl(240,6%,35%)] mt-2 leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null;
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <div className="grid md:grid-cols-3 gap-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(240,4%,46%)]">Selected Work</h2>
                  <div className="md:col-span-2 space-y-6">
                    {data.projects.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-[hsl(240,6%,92%)] hover:border-[hsl(243,75%,59%)/0.3] transition-all">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold">{p.title}</h3>
                          {p.url && <a href={p.url} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5 text-[hsl(240,4%,46%)]" /></a>}
                        </div>
                        <p className="text-xs text-[hsl(240,4%,46%)] mt-1">{p.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {p.tags.map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(240,5%,96%)] text-[hsl(240,4%,46%)]">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null;
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <div className="grid md:grid-cols-3 gap-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(240,4%,46%)]">Skills</h2>
                  <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                    {data.skills.map((s) => (
                      <div key={s.id}>
                        <h3 className="text-xs font-bold mb-2">{s.category}</h3>
                        <p className="text-sm text-[hsl(240,4%,46%)]">{s.items.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-20 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <div className="grid md:grid-cols-3 gap-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[hsl(240,4%,46%)]">Contact</h2>
                  <div className="md:col-span-2 space-y-3">
                    {data.contact.email && (
                      <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 text-sm hover:text-[hsl(243,75%,59%)]">
                        <Mail className="h-3.5 w-3.5" /> {data.contact.email}
                      </a>
                    )}
                    {data.contact.location && (
                      <p className="flex items-center gap-2 text-sm text-[hsl(240,4%,46%)]">
                        <MapPin className="h-3.5 w-3.5" /> {data.contact.location}
                      </p>
                    )}
                  </div>
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

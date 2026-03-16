import { PortfolioData } from "@/types/portfolio";
import { Terminal, ExternalLink, Mail, Github, Linkedin } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function TechnicalProTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(220,13%,5%)] text-[hsl(220,9%,85%)]" style={{ fontFamily: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-24 pb-16 max-w-4xl mx-auto">
                <div className="flex items-center gap-2 text-[hsl(160,60%,50%)] text-xs mb-4">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>~/portfolio</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[hsl(0,0%,95%)]">
                  {data.hero.headline || "Engineering Excellence."}
                </h1>
                <p className="mt-4 text-base text-[hsl(220,9%,55%)] max-w-xl leading-relaxed">
                  {data.hero.subheadline || "Building scalable systems and elegant solutions."}
                </p>
                <div className="flex gap-3 mt-6">
                  {data.contact.github && (
                    <a href={data.contact.github} className="p-2 rounded-lg bg-[hsl(220,12%,10%)] hover:bg-[hsl(220,12%,15%)] transition">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {data.contact.linkedin && (
                    <a href={data.contact.linkedin} className="p-2 rounded-lg bg-[hsl(220,12%,10%)] hover:bg-[hsl(220,12%,15%)] transition">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </section>
            );
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(220,10%,12%)]">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(160,60%,50%)] mb-8">// Tech Stack</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {data.skills.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-[hsl(220,12%,8%)] border border-[hsl(220,10%,12%)]">
                      <h3 className="text-xs font-bold text-[hsl(0,0%,95%)] mb-3">{s.category}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {s.items.map((item, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-[hsl(160,60%,50%)/0.08] text-[hsl(160,60%,60%)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(220,10%,12%)]">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(160,60%,50%)] mb-8">// Projects</h2>
                <div className="space-y-4">
                  {data.projects.map((p) => (
                    <div key={p.id} className="p-5 rounded-xl bg-[hsl(220,12%,8%)] border border-[hsl(220,10%,12%)] hover:border-[hsl(160,60%,50%)/0.3] transition-all">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-[hsl(0,0%,95%)]">{p.title}</h3>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener" className="text-[hsl(160,60%,50%)]">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[hsl(220,9%,55%)] mt-1.5">{p.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.tags.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[hsl(220,12%,12%)] text-[hsl(220,9%,55%)]">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(220,10%,12%)]">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(160,60%,50%)] mb-8">// Experience</h2>
                <div className="space-y-6">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="flex gap-6">
                      <span className="text-[11px] text-[hsl(220,9%,40%)] w-24 shrink-0 pt-0.5">{exp.period}</span>
                      <div>
                        <h3 className="text-sm font-bold text-[hsl(0,0%,95%)]">{exp.role}</h3>
                        <p className="text-xs text-[hsl(160,60%,50%)]">{exp.company}</p>
                        <p className="text-xs text-[hsl(220,9%,55%)] mt-1">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(220,10%,12%)]">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(160,60%,50%)] mb-6">// Contact</h2>
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="inline-flex items-center gap-2 text-sm text-[hsl(0,0%,95%)] hover:text-[hsl(160,60%,50%)] transition">
                    <Mail className="h-3.5 w-3.5" /> {data.contact.email}
                  </a>
                )}
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

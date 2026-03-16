import { PortfolioData } from "@/types/portfolio";
import { ArrowUpRight, Mail } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function ProductDesignerTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,100%)] text-[hsl(240,10%,8%)]" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-20 pb-12 max-w-5xl mx-auto">
                <p className="text-sm font-medium text-[hsl(243,75%,59%)] mb-3">Product Designer</p>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                  {data.hero.headline || "Design with purpose."}
                </h1>
                <p className="mt-5 text-lg text-[hsl(240,4%,46%)] max-w-2xl leading-relaxed">
                  {data.hero.subheadline || "Crafting human-centered digital experiences."}
                </p>
              </section>
            );
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-5xl mx-auto">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[hsl(240,4%,46%)] mb-10">Case Studies</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {data.projects.map((p) => (
                    <div key={p.id} className="group rounded-2xl border border-[hsl(240,6%,92%)] overflow-hidden hover:border-[hsl(243,75%,59%)/0.3] transition-all">
                      <div className="aspect-[16/10] bg-[hsl(240,5%,96%)] flex items-center justify-center">
                        <span className="text-xs text-[hsl(240,4%,46%)]">Project Visual</span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-semibold">{p.title}</h3>
                        <p className="text-sm text-[hsl(240,4%,46%)] mt-1.5 line-clamp-2">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {p.tags.map((t, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(243,75%,59%)/0.08] text-[hsl(243,75%,59%)]">{t}</span>
                          ))}
                        </div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[hsl(243,75%,59%)]">
                            View Case Study <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "about":
            return (
              <section key={section.id} className="px-8 py-16 max-w-5xl mx-auto bg-[hsl(240,5%,97%)] -mx-8 px-16 rounded-none">
                <div className="max-w-2xl">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[hsl(240,4%,46%)] mb-5">About</h2>
                  <p className="text-base leading-relaxed">{data.about.bio || "Your design philosophy and approach."}</p>
                </div>
              </section>
            );
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-5xl mx-auto">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[hsl(240,4%,46%)] mb-8">Experience</h2>
                <div className="space-y-6">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="flex gap-8 items-baseline">
                      <span className="text-xs text-[hsl(240,4%,46%)] w-28 shrink-0">{exp.period}</span>
                      <div>
                        <h3 className="text-sm font-semibold">{exp.role}</h3>
                        <p className="text-sm text-[hsl(243,75%,59%)]">{exp.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-5xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[hsl(240,4%,46%)] mb-8">Design Skills</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {data.skills.map((s) => (
                    <div key={s.id}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[hsl(240,10%,8%)] mb-2">{s.category}</h3>
                      <p className="text-sm text-[hsl(240,4%,46%)]">{s.items.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-20 max-w-5xl mx-auto text-center">
                <h2 className="text-3xl font-bold">Let's work together</h2>
                <p className="text-[hsl(240,4%,46%)] mt-2 text-sm">Open to new opportunities and collaborations.</p>
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-full bg-[hsl(243,75%,59%)] text-white text-sm font-medium hover:opacity-90 transition">
                    <Mail className="h-4 w-4" /> {data.contact.email}
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

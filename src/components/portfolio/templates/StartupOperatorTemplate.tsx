import { PortfolioData } from "@/types/portfolio";
import { Zap, ArrowUpRight, Mail } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function StartupOperatorTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,100%)] text-[hsl(240,10%,8%)]" style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-20 pb-12 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(38,92%,50%)/0.1] text-[hsl(38,92%,40%)] text-xs font-medium mb-5">
                  <Zap className="h-3 w-3" /> Builder · Operator · Maker
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">
                  {data.hero.headline || "Ship fast.\nScale smart."}
                </h1>
                <p className="mt-4 text-base text-[hsl(240,4%,46%)] max-w-lg leading-relaxed">
                  {data.hero.subheadline || "From 0→1 and beyond. Operator with a builder's mindset."}
                </p>
              </section>
            );
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto">
                <h2 className="text-sm font-bold mb-8">Things I've Built</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data.projects.map((p) => (
                    <div key={p.id} className="p-5 rounded-2xl border border-[hsl(240,6%,90%)] hover:border-[hsl(38,92%,50%)/0.4] transition-all group">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold">{p.title}</h3>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener" className="opacity-0 group-hover:opacity-100 transition">
                            <ArrowUpRight className="h-4 w-4 text-[hsl(38,92%,40%)]" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-[hsl(240,4%,46%)] mt-1.5 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {p.tags.map((t, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(38,92%,50%)/0.08] text-[hsl(38,80%,35%)]">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-sm font-bold mb-8">Operator Track</h2>
                <div className="space-y-6">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(38,92%,50%)] mt-2 shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold">{exp.role} @ {exp.company}</h3>
                        <p className="text-[11px] text-[hsl(240,4%,46%)]">{exp.period}</p>
                        <p className="text-xs text-[hsl(240,6%,35%)] mt-1">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-sm font-bold mb-6">Capabilities</h2>
                <div className="flex flex-wrap gap-2">
                  {data.skills.flatMap(s => s.items).map((item, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-[hsl(240,5%,96%)] text-[hsl(240,6%,25%)] font-medium">{item}</span>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-20 max-w-4xl mx-auto border-t border-[hsl(240,6%,92%)]">
                <h2 className="text-2xl font-bold">Let's build something.</h2>
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[hsl(38,92%,40%)] hover:underline">
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

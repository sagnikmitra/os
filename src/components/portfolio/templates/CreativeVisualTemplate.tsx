import { PortfolioData } from "@/types/portfolio";
import { ExternalLink, Mail, MapPin } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function CreativeVisualTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(240,10%,4%)] text-[hsl(0,0%,95%)]" style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-28 pb-20 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-end">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[hsl(243,75%,70%)] mb-4">Creative Portfolio</p>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
                      {data.hero.headline || "Creative\nMind."}
                    </h1>
                  </div>
                  <p className="text-base text-[hsl(240,5%,55%)] leading-relaxed">
                    {data.hero.subheadline || "Pushing boundaries through visual storytelling and bold design."}
                  </p>
                </div>
              </section>
            );
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-20 max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {data.projects.map((p, i) => (
                    <div
                      key={p.id}
                      className={`group rounded-2xl overflow-hidden bg-[hsl(240,8%,10%)] border border-[hsl(240,6%,15%)] hover:border-[hsl(243,75%,59%)/0.4] transition-all ${
                        i === 0 ? "md:col-span-2" : ""
                      }`}
                    >
                      <div className={`${i === 0 ? "aspect-[21/9]" : "aspect-[16/10]"} bg-[hsl(240,6%,12%)] flex items-center justify-center`}>
                        <span className="text-xs text-[hsl(240,5%,35%)]">Visual</span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold">{p.title}</h3>
                        <p className="text-sm text-[hsl(240,5%,55%)] mt-1">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {p.tags.map((t, ti) => (
                            <span key={ti} className="text-[10px] px-2 py-0.5 rounded-full border border-[hsl(240,6%,20%)] text-[hsl(240,5%,55%)]">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "about":
            return (
              <section key={section.id} className="px-8 py-20 max-w-6xl mx-auto border-t border-[hsl(240,6%,15%)]">
                <div className="grid md:grid-cols-3 gap-12">
                  <div>
                    <h2 className="text-xs uppercase tracking-[0.3em] text-[hsl(243,75%,70%)]">About</h2>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-base leading-relaxed text-[hsl(0,0%,80%)]">{data.about.bio || "Your creative story."}</p>
                  </div>
                </div>
              </section>
            );
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-20 max-w-6xl mx-auto border-t border-[hsl(240,6%,15%)]">
                <h2 className="text-xs uppercase tracking-[0.3em] text-[hsl(243,75%,70%)] mb-10">Toolkit</h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {data.skills.map((s) => (
                    <div key={s.id}>
                      <h3 className="text-sm font-bold mb-3">{s.category}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {s.items.map((item, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-[hsl(240,8%,12%)] text-[hsl(0,0%,70%)]">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-24 max-w-6xl mx-auto border-t border-[hsl(240,6%,15%)] text-center">
                <h2 className="text-4xl font-bold">Let's create.</h2>
                <p className="text-[hsl(240,5%,55%)] text-sm mt-3">Ready for the next big thing.</p>
                {data.contact.email && (
                  <a href={`mailto:${data.contact.email}`} className="inline-flex items-center gap-2 mt-8 text-[hsl(243,75%,70%)] hover:text-[hsl(243,75%,80%)] text-sm font-medium">
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

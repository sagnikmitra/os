import { PortfolioData } from "@/types/portfolio";
import { Mail, Linkedin, MapPin } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function ExecutiveTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(40,20%,97%)] text-[hsl(220,15%,15%)]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-24 pb-16 max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                  {data.hero.headline || "Executive Leader."}
                </h1>
                <p className="mt-4 text-base text-[hsl(220,8%,45%)] max-w-lg mx-auto leading-relaxed">
                  {data.hero.subheadline || "Driving strategic outcomes across global organizations."}
                </p>
                <div className="w-16 h-px bg-[hsl(220,15%,15%)] mx-auto mt-8" />
              </section>
            );
          case "about":
            return (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto">
                <p className="text-base leading-[1.8] text-[hsl(220,10%,30%)]">
                  {data.about.bio || "Your executive narrative."}
                </p>
              </section>
            );
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(220,8%,45%)] mb-10 text-center">Leadership Track</h2>
                <div className="space-y-10">
                  {data.experience.map((exp) => (
                    <div key={exp.id} className="text-center">
                      <h3 className="text-lg font-bold">{exp.role}</h3>
                      <p className="text-sm text-[hsl(220,8%,45%)] mt-0.5">{exp.company} · {exp.period}</p>
                      <p className="text-sm text-[hsl(220,10%,30%)] mt-3 max-w-lg mx-auto leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "skills":
            return data.skills.length > 0 ? (
              <section key={section.id} className="px-8 py-16 max-w-3xl mx-auto border-t border-[hsl(220,10%,88%)]">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[hsl(220,8%,45%)] mb-8 text-center">Competencies</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {data.skills.flatMap((s) => s.items).map((item, i) => (
                    <span key={i} className="text-xs px-4 py-2 rounded-full border border-[hsl(220,10%,85%)] text-[hsl(220,10%,30%)]">{item}</span>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-20 max-w-3xl mx-auto text-center border-t border-[hsl(220,10%,88%)]">
                <div className="w-16 h-px bg-[hsl(220,15%,15%)] mx-auto mb-8" />
                <div className="flex justify-center gap-6 text-sm text-[hsl(220,8%,45%)]">
                  {data.contact.email && (
                    <a href={`mailto:${data.contact.email}`} className="flex items-center gap-1.5 hover:text-[hsl(220,15%,15%)]">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                  {data.contact.linkedin && (
                    <a href={data.contact.linkedin} className="flex items-center gap-1.5 hover:text-[hsl(220,15%,15%)]">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  )}
                  {data.contact.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {data.contact.location}
                    </span>
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

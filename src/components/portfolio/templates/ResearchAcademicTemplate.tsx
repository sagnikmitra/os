import { PortfolioData } from "@/types/portfolio";
import { BookOpen, ExternalLink, Mail } from "lucide-react";

interface Props {
  data: PortfolioData;
}

export default function ResearchAcademicTemplate({ data }: Props) {
  const visibleSections = data.sections.filter((s) => s.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,100%)] text-[hsl(220,15%,15%)]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
      {visibleSections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <section key={section.id} className="px-8 pt-20 pb-12 max-w-3xl mx-auto border-b-2 border-[hsl(220,15%,15%)]">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {data.hero.headline || "Dr. Your Name"}
                </h1>
                <p className="mt-3 text-base text-[hsl(220,8%,45%)] leading-relaxed">
                  {data.hero.subheadline || "Researcher in computational linguistics and machine learning."}
                </p>
              </section>
            );
          case "about":
            return (
              <section key={section.id} className="px-8 py-12 max-w-3xl mx-auto">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] mb-4">Research Interests</h2>
                <p className="text-[15px] leading-[1.8]">{data.about.bio || "Your research focus and interests."}</p>
              </section>
            );
          case "publications":
            return data.publications.length > 0 ? (
              <section key={section.id} className="px-8 py-12 max-w-3xl mx-auto border-t border-[hsl(220,10%,88%)]">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Publications
                </h2>
                <ol className="space-y-4 list-decimal list-inside">
                  {data.publications.map((pub) => (
                    <li key={pub.id} className="text-[14px] leading-relaxed">
                      <span className="font-semibold">{pub.title}</span>
                      <br />
                      <span className="text-[hsl(220,8%,45%)] text-[13px]">{pub.publisher}, {pub.date}</span>
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noopener" className="inline-flex items-center gap-0.5 ml-2 text-[hsl(243,75%,59%)] text-xs">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null;
          case "experience":
            return data.experience.length > 0 ? (
              <section key={section.id} className="px-8 py-12 max-w-3xl mx-auto border-t border-[hsl(220,10%,88%)]">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] mb-6">Academic Positions</h2>
                <div className="space-y-6">
                  {data.experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex justify-between">
                        <h3 className="text-[15px] font-bold">{exp.role}</h3>
                        <span className="text-xs text-[hsl(220,8%,45%)]">{exp.period}</span>
                      </div>
                      <p className="text-sm text-[hsl(220,8%,45%)] italic">{exp.company}</p>
                      <p className="text-[14px] mt-2 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "projects":
            return data.projects.length > 0 ? (
              <section key={section.id} className="px-8 py-12 max-w-3xl mx-auto border-t border-[hsl(220,10%,88%)]">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] mb-6">Research Projects</h2>
                <div className="space-y-5">
                  {data.projects.map((p) => (
                    <div key={p.id}>
                      <h3 className="text-[15px] font-bold">{p.title}</h3>
                      <p className="text-[14px] text-[hsl(220,8%,45%)] mt-1 leading-relaxed">{p.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null;
          case "contact":
            return (
              <section key={section.id} className="px-8 py-12 max-w-3xl mx-auto border-t-2 border-[hsl(220,15%,15%)]">
                <div className="flex gap-6 text-sm">
                  {data.contact.email && (
                    <a href={`mailto:${data.contact.email}`} className="flex items-center gap-1.5 hover:text-[hsl(243,75%,59%)]">
                      <Mail className="h-3.5 w-3.5" /> {data.contact.email}
                    </a>
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

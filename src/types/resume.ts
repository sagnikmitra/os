export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  location: string;
  title: string;
  photoUrl: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  url?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
  url?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  items: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  technologies: string;
  bullets: string[];
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
  url?: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

export interface VolunteerEntry {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  url?: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  awards: AwardEntry[];
  languages: LanguageEntry[];
  volunteer: VolunteerEntry[];
  publications: PublicationEntry[];
}

export const defaultResume: ResumeData = {
  contact: { name: "", email: "", phone: "", linkedin: "", portfolio: "", location: "", title: "", photoUrl: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  awards: [],
  languages: [],
  volunteer: [],
  publications: [],
};

/** Rich sample resume for template previews / thumbnails */
export const sampleResume: ResumeData = {
  contact: {
    name: "Alex Morgan",
    email: "alex.morgan@email.com",
    phone: "(555) 123-4567",
    linkedin: "linkedin.com/in/alexmorgan",
    portfolio: "alexmorgan.dev",
    location: "San Francisco, CA",
    title: "Senior Software Engineer",
    photoUrl: "",
  },
  summary:
    "Results-driven senior software engineer with 7+ years of experience building scalable web applications and leading cross-functional teams. Proven track record of delivering high-impact products that drive revenue growth and improve user engagement. Passionate about clean architecture, performance optimization, and mentoring junior developers.",
  experience: [
    {
      id: "exp-1",
      company: "TechCorp Inc.",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      bullets: [
        "Led migration of monolithic architecture to microservices, reducing deployment time by 75% and improving system reliability to 99.9% uptime",
        "Architected and shipped a real-time collaboration feature used by 50K+ daily active users, increasing user retention by 23%",
        "Mentored a team of 5 junior engineers, conducting weekly code reviews and establishing coding standards adopted company-wide",
        "Optimized database queries and implemented caching strategies, reducing API response times by 60%",
      ],
    },
    {
      id: "exp-2",
      company: "StartupXYZ",
      title: "Full Stack Developer",
      location: "Austin, TX",
      startDate: "Mar 2018",
      endDate: "Dec 2020",
      current: false,
      bullets: [
        "Built and launched the company's flagship SaaS product from scratch, growing to $2M ARR within 18 months",
        "Designed RESTful APIs serving 10M+ requests per day with sub-100ms response times",
        "Implemented CI/CD pipelines using GitHub Actions, reducing release cycles from 2 weeks to same-day deployments",
      ],
    },
    {
      id: "exp-3",
      company: "Digital Agency Co.",
      title: "Frontend Developer",
      location: "Remote",
      startDate: "Jun 2016",
      endDate: "Feb 2018",
      current: false,
      bullets: [
        "Developed responsive web applications for Fortune 500 clients using React and TypeScript",
        "Improved Core Web Vitals scores by 40% through performance audits and lazy-loading strategies",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      startDate: "2012",
      endDate: "2016",
      gpa: "3.8",
      honors: "Magna Cum Laude, Dean's List",
    },
  ],
  skills: [
    { id: "sk-1", category: "Languages", items: "TypeScript, JavaScript, Python, Go, SQL" },
    { id: "sk-2", category: "Frontend", items: "React, Next.js, Vue.js, Tailwind CSS, GraphQL" },
    { id: "sk-3", category: "Backend", items: "Node.js, PostgreSQL, Redis, Docker, AWS, Kubernetes" },
    { id: "sk-4", category: "Tools", items: "Git, CI/CD, Figma, Datadog, Terraform" },
  ],
  certifications: [
    { id: "cert-1", name: "AWS Solutions Architect – Associate", issuer: "Amazon Web Services", date: "2023" },
    { id: "cert-2", name: "Google Cloud Professional Developer", issuer: "Google", date: "2022" },
  ],
  projects: [
    {
      id: "proj-1",
      name: "OpenMetrics Dashboard",
      description: "Open-source real-time metrics visualization platform with 2K+ GitHub stars",
      url: "github.com/alexmorgan/openmetrics",
      technologies: "React, D3.js, Go, InfluxDB",
      bullets: ["Built plugin architecture enabling community contributions of 30+ data source integrations"],
    },
  ],
  awards: [
    { id: "aw-1", title: "Innovation Award", issuer: "TechCorp Inc.", date: "2023", description: "For leading the microservices migration initiative" },
  ],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Native" },
    { id: "lang-2", language: "Spanish", proficiency: "Professional" },
  ],
  volunteer: [],
  publications: [],
};

export type TemplateName =
  | "classic"
  | "modern"
  | "minimal"
  | "professional"
  | "creative"
  | "executive"
  | "designer-pro"
  | "designer-photo"
  | "minimal-photo"
  | "latex-academic"
  | "latex-deedy"
  | "latex-jake"
  | "latex-sb";

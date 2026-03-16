export interface PortfolioHero {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  showPhoto: boolean;
  photoUrl: string;
}

export interface PortfolioAbout {
  title: string;
  bio: string;
  highlights: string[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  url: string;
  featured: boolean;
}

export interface PortfolioExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  highlights: string[];
}

export interface PortfolioSkill {
  id: string;
  category: string;
  items: string[];
}

export interface PortfolioTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface PortfolioContact {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  twitter: string;
  website: string;
  calendlyUrl: string;
  showContactForm: boolean;
}

export interface PortfolioSection {
  id: string;
  type: PortfolioSectionType;
  visible: boolean;
  order: number;
}

export type PortfolioSectionType =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "testimonials"
  | "certifications"
  | "awards"
  | "publications"
  | "contact"
  | "resume-download"
  | "writing";

export type PortfolioTemplateName =
  | "minimal-editorial"
  | "product-designer"
  | "creative-visual"
  | "technical-pro"
  | "executive"
  | "startup-operator"
  | "research-academic"
  | "hybrid-professional";

export interface PortfolioCertification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface PortfolioAward {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface PortfolioPublication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
}

export interface PortfolioData {
  hero: PortfolioHero;
  about: PortfolioAbout;
  projects: PortfolioProject[];
  experience: PortfolioExperience[];
  skills: PortfolioSkill[];
  testimonials: PortfolioTestimonial[];
  certifications: PortfolioCertification[];
  awards: PortfolioAward[];
  publications: PortfolioPublication[];
  contact: PortfolioContact;
  sections: PortfolioSection[];
  template: PortfolioTemplateName;
  colorScheme: string;
  fontFamily: string;
}

export const defaultPortfolioSections: PortfolioSection[] = [
  { id: "hero", type: "hero", visible: true, order: 0 },
  { id: "about", type: "about", visible: true, order: 1 },
  { id: "experience", type: "experience", visible: true, order: 2 },
  { id: "projects", type: "projects", visible: true, order: 3 },
  { id: "skills", type: "skills", visible: true, order: 4 },
  { id: "testimonials", type: "testimonials", visible: false, order: 5 },
  { id: "certifications", type: "certifications", visible: false, order: 6 },
  { id: "awards", type: "awards", visible: false, order: 7 },
  { id: "publications", type: "publications", visible: false, order: 8 },
  { id: "contact", type: "contact", visible: true, order: 9 },
];

export const defaultPortfolioData: PortfolioData = {
  hero: {
    headline: "",
    subheadline: "",
    ctaText: "Get in touch",
    ctaUrl: "#contact",
    showPhoto: false,
    photoUrl: "",
  },
  about: {
    title: "About Me",
    bio: "",
    highlights: [],
  },
  projects: [],
  experience: [],
  skills: [],
  testimonials: [],
  certifications: [],
  awards: [],
  publications: [],
  contact: {
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    twitter: "",
    website: "",
    calendlyUrl: "",
    showContactForm: true,
  },
  sections: defaultPortfolioSections,
  template: "minimal-editorial",
  colorScheme: "default",
  fontFamily: "Plus Jakarta Sans",
};

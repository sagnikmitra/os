import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { motion } from "@/lib/motion-stub";
import {
  Target, CheckCircle2, XCircle, MessageSquare, Zap, Star, Users,
  Mail, LinkedinIcon, Clock, TrendingUp, AlertTriangle, BookOpen,
  ArrowRight, ChevronDown, ChevronUp, Flame, Shield, Award,
  Calendar, DollarSign, Phone, Globe, Lightbulb, BarChart3, Heart,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05 },
});

interface PhaseStep {
  icon: any;
  title: string;
  description: string;
  tips?: string[];
}

interface Phase {
  week: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  steps: PhaseStep[];
}

const phases: Phase[] = [
  {
    week: "Week 1–2",
    label: "Foundation",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    steps: [
      {
        icon: Target,
        title: "Define your target role with precision",
        description: "Pick 1–3 exact role titles. Not 'something in tech.' Know the level (IC4, Senior, Director) you're targeting at specific companies.",
        tips: ["Use LinkedIn job titles, not your imagination", "Map companies by tier: Dream (5), Realistic (15), Safety (10)", "Identify decision-makers at each company"]
      },
      {
        icon: BookOpen,
        title: "Craft a master resume (1 page for <10 yrs)",
        description: "Write a single master resume with every bullet, project, and achievement. You'll tailor versions from this.",
        tips: ["Every bullet: Verb + What + Result + Scale", "Quantify: revenue, users, %, $, time saved", "Remove anything older than 10 years unless extraordinary"]
      },
      {
        icon: Globe,
        title: "Harden your LinkedIn & online presence",
        description: "LinkedIn must match your resume. Recruiters check it first — it's your persistent brand.",
        tips: ["Open to Work visible to recruiters only", "Headline = role you want, not role you have", "Write a 3-line About that answers: who you are, what you do, what you want"]
      },
    ],
  },
  {
    week: "Week 3–6",
    label: "Active Search",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    steps: [
      {
        icon: Flame,
        title: "Apply with precision, not volume",
        description: "20 tailored applications beat 200 generic ones. Spend 30–45 minutes per application to customize for the JD.",
        tips: ["Mirror JD language in your resume", "Apply within 48 hours of posting — recency matters", "Track everything: company, date, contact, status"]
      },
      {
        icon: MessageSquare,
        title: "Run a structured outreach campaign",
        description: "70% of jobs are filled before they're posted. Outreach unlocks the hidden market.",
        tips: ["Find 3 people at each target company", "First message: 1 compliment + 1 specific question, never ask for a job directly", "Follow up once after 7 days — not more"]
      },
      {
        icon: Users,
        title: "Request informational interviews",
        description: "These convert to referrals, which convert to hires. A referral gives you 4x higher interview probability.",
        tips: ["Ask current employees in your target role", "Prepare 5 smart questions — never waste their 30 minutes", "Always send a thank-you note within 24 hours"]
      },
    ],
  },
  {
    week: "Week 7–12",
    label: "Interviews & Closing",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    steps: [
      {
        icon: Award,
        title: "Prepare 10 STAR stories cold",
        description: "Every behavioral question maps to 10 core competencies. Prepare one story per competency that you can tell perfectly.",
        tips: ["Competencies: leadership, conflict, failure, ambiguity, influence, impact, collaboration, speed, ownership, prioritization", "Practice out loud — not in your head", "Time each story: 90–120 seconds max"]
      },
      {
        icon: BarChart3,
        title: "Nail the technical / case round",
        description: "Know what each company tests. FAANG LC mediums, startups system design, PMs product cases.",
        tips: ["Solve 2 problems a day for 3 weeks", "Use IDEO / structured approach for product cases", "Ask clarifying questions before diving — interviewers evaluate your process"]
      },
      {
        icon: DollarSign,
        title: "Negotiate — always, every time",
        description: "Most candidates leave 10–20% of comp on the table by not negotiating. It's always expected.",
        tips: ["Never give the first number — 'What's your budget?'", "Use competing offers for leverage — even if you don't want that job", "Negotiate signing bonus, equity cliff, remote policy — not just salary"]
      },
    ],
  },
];

const dos = [
  { icon: CheckCircle2, text: "Tailor every resume to the specific job description — keyword matching is literal" },
  { icon: CheckCircle2, text: "Quantify everything: $2M, 40%, 3x faster, 10K users" },
  { icon: CheckCircle2, text: "Build relationships before you need them — warm > cold" },
  { icon: CheckCircle2, text: "Follow up after every interview within 24 hours" },
  { icon: CheckCircle2, text: "Track your pipeline in a spreadsheet like a sales CRM" },
  { icon: CheckCircle2, text: "Ask for referrals — employees get bonuses for referring hires" },
  { icon: CheckCircle2, text: "Research the interviewer on LinkedIn the night before" },
  { icon: CheckCircle2, text: "Apply to roles where you meet 70% of requirements" },
  { icon: CheckCircle2, text: "Have 3 concrete questions ready for every interview" },
  { icon: CheckCircle2, text: "Keep your email subject lines specific: 'Re: PM role — referred by [Name]'" },
];

const donts = [
  { icon: XCircle, text: "Don't send the same resume to 50 companies — volume without customization fails" },
  { icon: XCircle, text: "Don't use an objective statement — it screams 'I haven't updated this since 2010'" },
  { icon: XCircle, text: "Don't apply for roles you're massively underqualified for" },
  { icon: XCircle, text: "Don't ghost recruiters — job market is smaller than it feels, people remember" },
  { icon: XCircle, text: "Don't put a headshot on your resume (unless you're in a country that expects it)" },
  { icon: XCircle, text: "Don't list skills you can't defend in a technical interview" },
  { icon: XCircle, text: "Don't use passive language: 'was responsible for' → 'led', 'managed', 'built'" },
  { icon: XCircle, text: "Don't mention salary expectations first in any negotiation" },
  { icon: XCircle, text: "Don't write a generic cover letter — it signals you don't care" },
  { icon: XCircle, text: "Don't stop applying after 3 interviews are scheduled — the pipeline dries up fast" },
];

const outreachTemplates = [
  {
    type: "Cold LinkedIn DM",
    icon: LinkedinIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    subject: null,
    template: `Hi [Name],

I noticed you're a [Title] at [Company] — your work on [specific project/post] caught my attention.

I'm exploring [role type] opportunities and would love to hear your perspective on [specific thing about their work or company].

Would you have 15 minutes for a quick call in the next week or two?

[Your Name]`,
    notes: "Keep it under 100 words. Be specific about why them, not just their company.",
  },
  {
    type: "Referral Request Email",
    icon: Mail,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    subject: "Quick ask — [Company] referral",
    template: `Hey [Name],

Hope you're doing well! I saw [Company] is hiring for a [Role] and I'm genuinely excited about the opportunity — [one specific reason].

I've been [brief 1-line background]. I know your referral comes with real weight there.

Would you be comfortable referring me? I've attached my resume. Happy to chat briefly so you can represent me confidently.

No worries at all if it's not a fit — appreciate you either way.

[Your Name]`,
    notes: "Only ask people who know your work. Give them the words to advocate for you.",
  },
  {
    type: "Post-Interview Thank You",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
    subject: "Thank you — [Role] conversation",
    template: `Hi [Name],

Thank you for taking the time today. I really enjoyed our conversation about [specific topic from interview].

Your point about [something they said] stuck with me — it reinforced why [Company]'s approach to [thing] resonates with how I think about this space.

I'm excited about this opportunity and confident I can [specific value you'd add]. Looking forward to next steps.

[Your Name]`,
    notes: "Send within 2 hours of the interview. Reference something specific — generic notes are obvious.",
  },
  {
    type: "Recruiter Cold Email",
    icon: Phone,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    subject: "[Role Title] — [Your Name], [Short Credential]",
    template: `Hi [Recruiter Name],

I'm a [Title] with [X years] experience in [specific domain]. I saw your open [Role] at [Company] and wanted to reach out directly.

My most relevant background:
• [Achievement with metric]
• [Achievement with metric]
• [Specific skill that matches JD]

I'd love to connect. Are you the right person for this role, or can you point me to who is?

[Your Name] | [LinkedIn URL]`,
    notes: "Recruiters get hundreds of emails. Subject line, first line, and bullet points are all they read.",
  },
];

const redFlags = [
  { flag: "Gaps longer than 6 months unexplained", fix: "Add a 1-line explanation: consulting, caregiving, self-education" },
  { flag: "Job hopping: 3 jobs in 2 years without growth", fix: "Cluster contract/freelance work under one heading" },
  { flag: "Resume looks designed, not parsed", fix: "Test with an ATS parser tool — tables and columns get mangled" },
  { flag: "Email address from 2005 (coolhacker99@hotmail.com)", fix: "firstname.lastname@gmail.com — no exceptions" },
  { flag: "No LinkedIn or broken LinkedIn URL", fix: "Include and verify. Custom URL: linkedin.com/in/firstname-lastname" },
  { flag: "Skills section lists 'Microsoft Word'", fix: "Remove any skill everyone has. List only differentiating skills" },
  { flag: "Resume longer than 2 pages for <15 years experience", fix: "Cut ruthlessly — each extra page reduces read probability by 50%" },
  { flag: "Vague summary: 'Results-driven professional who...'", fix: "Specific summary: 'Senior PM who shipped 4 products to 2M users at Series B startups'" },
];

const weeklyRoutine = [
  { day: "Monday", action: "Review pipeline, follow up on outstanding applications", time: "45 min" },
  { day: "Tuesday", action: "Apply to 3–5 tailored roles, research new companies", time: "2–3 hrs" },
  { day: "Wednesday", action: "LinkedIn outreach to 5 new contacts", time: "1 hr" },
  { day: "Thursday", action: "Interview prep: 2 STAR stories + 1 technical problem", time: "1.5 hrs" },
  { day: "Friday", action: "Network: attend virtual events or reach warm contacts", time: "1 hr" },
  { day: "Weekend", action: "Skills upgrade: course, side project, or portfolio work", time: "2–3 hrs" },
];

function CollapsibleSection({ title, icon: Icon, color, children, defaultOpen = false }: { title: string; icon: any; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-secondary/40 transition-colors">
          <div className="flex items-center gap-3">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="font-semibold text-sm">{title}</span>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function JobGettingRoadmap() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  return (
    <AppLayout title="Job Getting Roadmap">
      <div className="p-6 max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <motion.div {...fade(0)}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Job Getting Framework</h1>
              <p className="text-sm text-muted-foreground">A complete system from resume to signed offer letter.</p>
            </div>
          </div>
        </motion.div>

        {/* Success Stats */}
        <motion.div {...fade(1)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "70%", label: "Jobs filled via network", icon: Users, color: "text-blue-600 dark:text-blue-400" },
            { value: "4×", label: "Referral interview rate", icon: Star, color: "text-emerald-600 dark:text-emerald-400" },
            { value: "6 sec", label: "Recruiter first scan", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
            { value: "15%", label: "Avg salary increase (negotiate)", icon: DollarSign, color: "text-purple-600 dark:text-purple-400" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 text-center">
              <stat.icon className={`h-4 w-4 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Phase Roadmap */}
        <motion.div {...fade(2)} className="space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> 12-Week Job Search Roadmap
          </h2>
          {phases.map((phase, pi) => (
            <div key={pi} className={`rounded-xl border ${phase.borderColor} bg-card overflow-hidden`}>
              <button
                className={`w-full flex items-center justify-between p-4 text-left ${phase.bgColor} hover:opacity-90 transition-opacity`}
                onClick={() => setExpandedPhase(expandedPhase === pi ? null : pi)}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${phase.color} px-2 py-0.5 rounded-full border ${phase.borderColor}`}>{phase.week}</span>
                  <span className={`font-bold text-sm ${phase.color}`}>{phase.label}</span>
                </div>
                {expandedPhase === pi ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {expandedPhase === pi && (
                <div className="p-4 space-y-4">
                  {phase.steps.map((step, si) => (
                    <div key={si} className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg ${phase.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <step.icon className={`h-4 w-4 ${phase.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                        {step.tips && (
                          <ul className="mt-2 space-y-1">
                            {step.tips.map((tip, ti) => (
                              <li key={ti} className="flex items-start gap-2 text-xs">
                                <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                <span className="text-muted-foreground">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Weekly Routine */}
        <motion.div {...fade(3)} className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Winning Weekly Routine
          </h2>
          <div className="space-y-2">
            {weeklyRoutine.map((day, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-[11px] font-bold w-16 shrink-0 text-muted-foreground">{day.day}</span>
                <span className="text-xs flex-1">{day.action}</span>
                <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />{day.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dos and Don'ts */}
        <motion.div {...fade(4)} className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Do These
            </h2>
            <ul className="space-y-2.5">
              {dos.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <item.icon className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" /> Never Do These
            </h2>
            <ul className="space-y-2.5">
              {donts.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <item.icon className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Outreach Templates */}
        <motion.div {...fade(5)} className="space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Proven Outreach Templates
          </h2>
          {outreachTemplates.map((t, i) => (
            <CollapsibleSection key={i} title={t.type} icon={t.icon} color={t.color}>
              <div className={`rounded-xl border p-5 ${t.bgColor}`}>
                {t.subject && (
                  <div className="mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Subject Line</span>
                    <p className="text-sm font-medium mt-1">{t.subject}</p>
                  </div>
                )}
                <div className="mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Message</span>
                  <pre className="text-xs mt-1 leading-relaxed whitespace-pre-wrap font-sans bg-background/70 rounded-lg p-3 border">{t.template}</pre>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background/50">
                  <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">{t.notes}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(t.template); }}
                  className={`mt-3 text-xs font-medium ${t.color} hover:underline flex items-center gap-1`}
                >
                  Copy template →
                </button>
              </div>
            </CollapsibleSection>
          ))}
        </motion.div>

        {/* Red Flags */}
        <motion.div {...fade(6)} className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Resume Red Flags That Kill Applications
          </h2>
          <div className="space-y-3">
            {redFlags.map((item, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/30">
                <div className="flex items-start gap-2">
                  <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.flag}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mindset Section */}
        <motion.div {...fade(7)} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" /> The Mental Framework
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Rejection is data, not judgment", desc: "Every rejection narrows the target. Most rejections are ATS filters, not assessments of you." },
              { title: "You are selling, they are buying", desc: "Treat your job search like a sales pipeline. Track conversion rates. Improve each stage systematically." },
              { title: "One strong offer > ten mediocre interviews", desc: "Quality pipeline management beats spray-and-pray volume. 15 targeted applications > 200 generic ones." },
              { title: "Your value is fixed. Your positioning is not.", desc: "Often you aren't bad — you're unclear. The resume and narrative fix that, not gaining more skills." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Zap className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </AppLayout>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a LinkedIn PDF resume parser. LinkedIn exports PDFs with a very specific layout. Extract ALL structured data and return ONLY valid JSON.

LinkedIn PDF characteristics you should know:
- The name is always at the top, large font
- Below the name is usually a headline/title
- "Contact" section has email, phone, LinkedIn URL, website, address
- "Experience" section lists jobs with company, title, date range (e.g. "Jan 2020 - Present · 3 yrs 2 mos"), location, and description bullets
- "Education" section lists schools with degree, field, dates, activities/societies, GPA
- "Skills" section lists skills, sometimes grouped or with endorsement counts (ignore counts)
- "Certifications" / "Licenses & Certifications" section
- "Projects" section
- "Languages" section
- "Volunteer Experience" section
- "Honors & Awards" section
- "Publications" section
- "Summary" or "About" section contains the professional summary
- Dates often include duration like "· 2 yrs 5 mos" — extract only the start/end dates, ignore duration strings
- Multiple positions at the same company appear nested — treat each as a separate experience entry with the same company name

Return this exact JSON structure:
{
  "contact": {
    "name": "<full name>",
    "email": "<email or empty>",
    "phone": "<phone or empty>",
    "linkedin": "<linkedin url>",
    "portfolio": "<website url or empty>",
    "location": "<location>",
    "title": "<headline / most recent title>"
  },
  "summary": "<about/summary section text, or empty string>",
  "experience": [
    {
      "id": "<unique id like exp-1>",
      "company": "<company name>",
      "title": "<job title>",
      "location": "<location or empty>",
      "startDate": "<Mon YYYY>",
      "endDate": "<Mon YYYY or Present>",
      "current": <true if Present>,
      "bullets": ["<description bullet 1>", "<description bullet 2>"]
    }
  ],
  "education": [
    {
      "id": "<unique id like edu-1>",
      "institution": "<school name>",
      "degree": "<degree type>",
      "field": "<field of study>",
      "startDate": "<year or Mon YYYY>",
      "endDate": "<year or Mon YYYY>",
      "gpa": "<gpa or empty>",
      "honors": "<activities, societies, honors or empty>"
    }
  ],
  "skills": [
    {
      "id": "<unique id like skill-1>",
      "category": "<inferred category like Programming, Leadership, Tools>",
      "items": "<comma-separated skills>"
    }
  ],
  "certifications": [
    {
      "id": "<unique id>",
      "name": "<cert name>",
      "issuer": "<issuing org>",
      "date": "<date issued>"
    }
  ],
  "projects": [
    {
      "id": "<unique id>",
      "name": "<project name>",
      "description": "<description>",
      "url": "<url or empty>",
      "technologies": "<tech used or empty>",
      "bullets": ["<bullet>"]
    }
  ],
  "awards": [
    {
      "id": "<unique id>",
      "name": "<award name>",
      "issuer": "<issuer>",
      "date": "<date>"
    }
  ],
  "languages": [
    {
      "id": "<unique id>",
      "name": "<language>",
      "proficiency": "<proficiency level>"
    }
  ],
  "volunteer": [
    {
      "id": "<unique id>",
      "organization": "<org name>",
      "role": "<role>",
      "startDate": "<start>",
      "endDate": "<end>",
      "description": "<description>"
    }
  ],
  "publications": []
}

Rules:
- Extract EVERY section from the LinkedIn PDF
- If a section doesn't exist, return an empty array
- Generate unique IDs for each entry (exp-1, exp-2, edu-1, skill-1, etc.)
- For skills, group them into logical categories (Programming Languages, Frameworks, Soft Skills, Tools, etc.) — LinkedIn often lists them flat, so infer categories
- Clean up bullet points: remove leading dashes/dots, trim whitespace
- If the description is a paragraph rather than bullets, split into logical bullet points
- For multiple roles at the same company, create separate experience entries
- Return ONLY valid JSON, no markdown or extra text`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: "Parse this LinkedIn PDF export and extract all structured resume data. Pay special attention to LinkedIn's formatting patterns:" },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType || "application/pdf"};base64,${fileBase64}` },
          },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Failed to parse LinkedIn PDF");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed;
    try {
      let cleaned = content.trim();
      if (cleaned.includes("```")) {
        cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      }
      const jsonStart = cleaned.indexOf("{");
      const jsonEnd = cleaned.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Parse error:", content.substring(0, 500));
      throw new Error("Failed to parse LinkedIn data. Please ensure you uploaded a LinkedIn PDF export.");
    }

    // Post-process: ensure all arrays exist
    const defaults = { experience: [], education: [], skills: [], certifications: [], projects: [], awards: [], languages: [], volunteer: [], publications: [] };
    for (const [key, val] of Object.entries(defaults)) {
      if (!parsed[key]) parsed[key] = val;
    }

    return new Response(JSON.stringify({ resumeData: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-linkedin-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

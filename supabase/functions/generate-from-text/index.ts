import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, section } = await req.json();
    if (!text || !section) {
      return new Response(JSON.stringify({ error: "text and section are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sectionPrompts: Record<string, string> = {
      contact: `Extract contact information from the following text. Return structured data with fields: name, title (job title), email, phone, location, linkedin, portfolio. Only include fields that are clearly present in the text.`,
      summary: `From the following text, generate a professional resume summary (2-3 sentences). Focus on key achievements, skills, and career highlights. Make it compelling and ATS-friendly.`,
      experience: `From the following text, extract work experience entries. For each entry, identify: title (job title), company, location, startDate, endDate, and generate 3-5 strong bullet points using the XYZ format (Accomplished X by doing Y resulting in Z). Include metrics where possible.`,
      education: `From the following text, extract education entries. For each entry, identify: institution, degree, field of study, startDate, endDate, gpa, and honors.`,
      skills: `From the following text, extract skills and organize them into categories. Each category should have a name and a comma-separated list of skills. Common categories: Programming Languages, Frameworks, Tools, Soft Skills, etc.`,
      projects: `From the following text, extract project entries. For each project, identify: name, description, url, technologies used, and generate 2-3 bullet points highlighting achievements.`,
      certifications: `From the following text, extract certifications. For each, identify: name, issuer, and date.`,
      awards: `From the following text, extract awards/achievements. For each, identify: title, issuer, date, and brief description.`,
      languages: `From the following text, extract languages and proficiency levels. For each, identify: language and proficiency (e.g., Native, Fluent, Intermediate, Basic).`,
      volunteer: `From the following text, extract volunteer experience. For each, identify: organization, role, startDate, endDate, and description.`,
      publications: `From the following text, extract publications. For each, identify: title, publisher, date, and url.`,
    };

    const systemPrompt = sectionPrompts[section] || `Extract relevant resume information for the "${section}" section from the following text.`;

    const toolSchemas: Record<string, any> = {
      contact: {
        name: "extract_contact",
        description: "Extract contact information",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            location: { type: "string" },
            linkedin: { type: "string" },
            portfolio: { type: "string" },
          },
          required: ["name"],
          additionalProperties: false,
        },
      },
      summary: {
        name: "extract_summary",
        description: "Generate professional summary",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
          },
          required: ["summary"],
          additionalProperties: false,
        },
      },
      experience: {
        name: "extract_experience",
        description: "Extract work experience entries",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  company: { type: "string" },
                  location: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  current: { type: "boolean" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["title", "company", "bullets"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      education: {
        name: "extract_education",
        description: "Extract education entries",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  institution: { type: "string" },
                  degree: { type: "string" },
                  field: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  gpa: { type: "string" },
                  honors: { type: "string" },
                },
                required: ["institution", "degree"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      skills: {
        name: "extract_skills",
        description: "Extract and categorize skills",
        parameters: {
          type: "object",
          properties: {
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  items: { type: "string" },
                },
                required: ["category", "items"],
                additionalProperties: false,
              },
            },
          },
          required: ["categories"],
          additionalProperties: false,
        },
      },
      projects: {
        name: "extract_projects",
        description: "Extract project entries",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  url: { type: "string" },
                  technologies: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["name", "description"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      certifications: {
        name: "extract_certifications",
        description: "Extract certifications",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  issuer: { type: "string" },
                  date: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      awards: {
        name: "extract_awards",
        description: "Extract awards",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  issuer: { type: "string" },
                  date: { type: "string" },
                  description: { type: "string" },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      languages: {
        name: "extract_languages",
        description: "Extract languages",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  language: { type: "string" },
                  proficiency: { type: "string" },
                },
                required: ["language"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      volunteer: {
        name: "extract_volunteer",
        description: "Extract volunteer experience",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  organization: { type: "string" },
                  role: { type: "string" },
                  startDate: { type: "string" },
                  endDate: { type: "string" },
                  description: { type: "string" },
                },
                required: ["organization", "role"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
      publications: {
        name: "extract_publications",
        description: "Extract publications",
        parameters: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  publisher: { type: "string" },
                  date: { type: "string" },
                  url: { type: "string" },
                },
                required: ["title"],
                additionalProperties: false,
              },
            },
          },
          required: ["entries"],
          additionalProperties: false,
        },
      },
    };

    const tool = toolSchemas[section];
    if (!tool) {
      return new Response(JSON.stringify({ error: `Unknown section: ${section}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: any = {
      model: "google/gemini-2.0-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      tools: [{ type: "function", function: tool }],
      tool_choice: { type: "function", function: { name: tool.name } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ section, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-from-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

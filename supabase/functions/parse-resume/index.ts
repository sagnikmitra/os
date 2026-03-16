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

    const systemPrompt = `You are a resume parser. Extract structured data from the resume document and return ONLY valid JSON with this exact structure:

{
  "contact": {
    "name": "<full name>",
    "email": "<email>",
    "phone": "<phone>",
    "linkedin": "<linkedin url or empty>",
    "portfolio": "<portfolio url or empty>",
    "location": "<city, state or location>",
    "title": "<most recent job title or professional title>"
  },
  "summary": "<professional summary or objective text, or empty string>",
  "experience": [
    {
      "id": "<unique id>",
      "company": "<company name>",
      "title": "<job title>",
      "location": "<location>",
      "url": "<company website or project link if found>",
      "startDate": "<start date>",
      "endDate": "<end date>",
      "current": <boolean>,
      "bullets": ["<bullet point>"]
    }
  ],
  "education": [
    {
      "id": "<unique id>",
      "institution": "<school name>",
      "url": "<institution website if found>",
      "degree": "<degree>",
      "field": "<field>",
      "startDate": "<start>",
      "endDate": "<end>",
      "gpa": "<gpa>",
      "honors": "<honors>"
    }
  ],
  "skills": [
    {
      "id": "<unique id>",
      "category": "<category>",
      "items": "<items>"
    }
  ],
  "certifications": [
    {
      "id": "<unique id>",
      "name": "<cert name>",
      "issuer": "<issuer>",
      "date": "<date>",
      "url": "<verification link if found>"
    }
  ],
  "projects": [
    {
      "id": "<unique id>",
      "name": "<project name>",
      "description": "<description>",
      "url": "<project link>",
      "technologies": "<tech>",
      "bullets": ["<bullet>"]
    }
  ],
  "awards": [
    {
      "id": "<unique id>",
      "title": "<title>",
      "issuer": "<issuer>",
      "date": "<date>",
      "url": "<link if found>",
      "description": "<description>"
    }
  ],
  "languages": [],
  "volunteer": [
    {
      "id": "<unique id>",
      "organization": "<org>",
      "role": "<role>",
      "url": "<link if found>",
      "startDate": "<start>",
      "endDate": "<end>",
      "description": "<description>"
    }
  ],
  "publications": [
    {
      "id": "<unique id>",
      "title": "<title>",
      "publisher": "<publisher>",
      "url": "<link if found>",
      "date": "<date>"
    }
  ]
}

Rules:
- Extract ALL information from the resume
- If a section doesn't exist, return an empty array
- Generate unique IDs for each entry
- Keep bullet points as-is from the resume
- Return ONLY valid JSON, no markdown or extra text`;

    const isPdf = mimeType === "application/pdf" || fileName.endsWith(".pdf");
    const isDocx = mimeType?.includes("wordprocessing") || fileName.endsWith(".docx");

    let messages: any[];

    if (isPdf) {
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse this resume document and extract all structured data:" },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType || "application/pdf"};base64,${fileBase64}` },
            },
          ],
        },
      ];
    } else {
      // For text/docx, decode and send as text
      let textContent: string;
      try {
        const bytes = new Uint8Array(Array.from(atob(fileBase64), (c) => c.charCodeAt(0)));
        textContent = new TextDecoder().decode(bytes);
      } catch {
        textContent = atob(fileBase64);
      }
      // Strip non-printable chars for DOCX (binary XML remnants)
      if (isDocx) {
        textContent = textContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/ {3,}/g, ' ').trim();
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this resume text and extract all structured data:\n\n${textContent}` },
      ];
    }

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
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
      throw new Error("Failed to parse resume");
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
      throw new Error("Failed to parse resume data");
    }

    return new Response(JSON.stringify({ resumeData: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

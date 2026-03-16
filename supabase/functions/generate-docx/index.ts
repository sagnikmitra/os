const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData } = await req.json();
    if (!resumeData) {
      return new Response(JSON.stringify({ error: "No resume data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contact = resumeData.contact || {};
    const experience = resumeData.experience || [];
    const education = resumeData.education || [];
    const skills = resumeData.skills || [];
    const summary = resumeData.summary || "";
    const projects = resumeData.projects || [];
    const certifications = resumeData.certifications || [];

    // Generate DOCX XML (Office Open XML minimal format)
    const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const paragraphs: string[] = [];

    const addHeading = (text: string) => {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>${escXml(text)}</w:t></w:r></w:p>`);
    };

    const addSubheading = (text: string) => {
      paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>${escXml(text)}</w:t></w:r></w:p>`);
    };

    const addPara = (text: string, bold = false) => {
      const rpr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
      paragraphs.push(`<w:p><w:r>${rpr}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`);
    };

    const addBullet = (text: string) => {
      paragraphs.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`);
    };

    const addSpacer = () => {
      paragraphs.push(`<w:p><w:r><w:t></w:t></w:r></w:p>`);
    };

    // Header - Name
    if (contact.name) {
      paragraphs.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escXml(contact.name)}</w:t></w:r></w:p>`);
    }
    // Contact line
    const contactParts = [contact.title, contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean);
    if (contactParts.length > 0) {
      paragraphs.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${escXml(contactParts.join(" | "))}</w:t></w:r></w:p>`);
    }
    addSpacer();

    // Summary
    if (summary) {
      addHeading("Professional Summary");
      addPara(summary);
      addSpacer();
    }

    // Experience
    if (experience.length > 0) {
      addHeading("Experience");
      for (const exp of experience) {
        const dateRange = exp.current ? `${exp.startDate} – Present` : `${exp.startDate} – ${exp.endDate}`;
        addSubheading(`${exp.title} at ${exp.company}`);
        addPara(`${exp.location} | ${dateRange}`);
        for (const bullet of (exp.bullets || []).filter((b: string) => b.trim())) {
          addBullet(bullet);
        }
        addSpacer();
      }
    }

    // Education
    if (education.length > 0) {
      addHeading("Education");
      for (const edu of education) {
        addSubheading(`${edu.degree} in ${edu.field}`);
        addPara(`${edu.institution} | ${edu.startDate} – ${edu.endDate}${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}`);
        if (edu.honors) addPara(`Honors: ${edu.honors}`);
      }
      addSpacer();
    }

    // Skills
    if (skills.length > 0) {
      addHeading("Skills");
      for (const sk of skills) {
        addPara(`${sk.category}: ${sk.items}`, true);
      }
      addSpacer();
    }

    // Projects
    if (projects.length > 0) {
      addHeading("Projects");
      for (const proj of projects) {
        addSubheading(proj.name);
        if (proj.description) addPara(proj.description);
        if (proj.technologies) addPara(`Technologies: ${proj.technologies}`);
        for (const bullet of (proj.bullets || []).filter((b: string) => b.trim())) {
          addBullet(bullet);
        }
      }
      addSpacer();
    }

    // Certifications
    if (certifications.length > 0) {
      addHeading("Certifications");
      for (const cert of certifications) {
        addPara(`${cert.name} — ${cert.issuer} (${cert.date})`);
      }
    }

    // Build the DOCX (minimal OOXML)
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphs.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1">
    <w:abstractNumId w:val="0"/>
  </w:num>
</w:numbering>`;

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`;

    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

    // Use the built-in CompressionStream isn't available in Deno for ZIP, 
    // so we'll return the XML parts as a JSON response and let the client build the DOCX
    return new Response(
      JSON.stringify({
        documentXml,
        numberingXml,
        contentTypesXml,
        relsXml,
        wordRelsXml,
        fileName: contact.name ? `${contact.name.replace(/\s+/g, "_")}_Resume.docx` : "Resume.docx",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

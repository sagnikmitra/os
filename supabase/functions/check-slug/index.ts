import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, portfolio_id } = await req.json();

    if (!slug || typeof slug !== "string") {
      return new Response(
        JSON.stringify({ error: "Slug is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      return new Response(
        JSON.stringify({ available: false, reason: "Invalid format. Use lowercase letters, numbers, and hyphens (3-50 chars)." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reserved slugs
    const reserved = ["admin", "api", "www", "app", "help", "support", "blog", "docs", "careers", "about", "contact", "pricing", "login", "signup", "settings", "dashboard"];
    if (reserved.includes(slug)) {
      return new Response(
        JSON.stringify({ available: false, reason: "This slug is reserved." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = supabase
      .from("portfolios")
      .select("id")
      .eq("slug", slug);

    // Exclude current portfolio from check
    if (portfolio_id) {
      query = query.neq("id", portfolio_id);
    }

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to check slug" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const available = !data || data.length === 0;

    return new Response(
      JSON.stringify({ available, reason: available ? null : "This slug is already taken." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

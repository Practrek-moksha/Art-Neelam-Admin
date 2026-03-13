import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, phone, email, course, source, notes } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Name is required (min 2 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Valid phone number is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cleanPhone = phone.replace(/[\s\-()]/g, "").replace(/^\+91/, "");

    // Rate limit: 1 lead per phone per 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", cleanPhone)
      .gte("created_at", oneDayAgo);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "An enquiry with this number was already submitted recently" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      course: course || "Basic",
      source: source || "Website",
      notes: notes?.trim() || null,
      status: "new",
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to submit enquiry" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, lead: data }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

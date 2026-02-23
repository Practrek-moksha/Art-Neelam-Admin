import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indian phone number validation: 10 digits, optionally prefixed with +91
function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, phone, email, course, notes } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Valid name is required (2-100 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone || !isValidIndianPhone(phone)) {
      return new Response(JSON.stringify({ error: "Valid Indian phone number is required (10 digits starting with 6-9)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validCourses = ["Basic", "Advanced", "Professional"];
    const safeCourse = validCourses.includes(course) ? course : "Basic";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for duplicate phone in last 24 hours (rate limiting)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone.replace(/[\s\-()]/g, "").replace(/^\+91/, ""))
      .gte("created_at", oneDayAgo);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "A registration with this number was already submitted recently" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, "").replace(/^\+91/, "");

    const { data, error } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      course: safeCourse,
      source: "Registration Form",
      notes: typeof notes === "string" ? notes.substring(0, 500) : null,
      status: "new",
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to submit registration" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const {
      name, phone, email, course, batch, notes,
      dob, school_name, address, emergency_contact,
      father_name, father_contact, mother_name, mother_contact,
      guardian_name, terms_accepted, payment_plan,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100) {
      return new Response(JSON.stringify({ error: "Valid name is required (2-100 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone || !isValidIndianPhone(phone)) {
      return new Response(JSON.stringify({ error: "Valid Indian phone number is required" }), {
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

    const cleanPhone = phone.replace(/[\s\-()]/g, "").replace(/^\+91/, "");

    // Rate limit: check registrations in last 24h from same phone
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentReg } = await supabase
      .from("registrations")
      .select("id")
      .eq("whatsapp", cleanPhone)
      .gte("created_at", oneDayAgo);

    if (recentReg && recentReg.length > 0) {
      return new Response(JSON.stringify({ error: "A registration with this number was already submitted recently. Please wait 24 hours." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into registrations table (pending approval)
    const { data: regData, error: regError } = await supabase.from("registrations").insert({
      name: name.trim(),
      whatsapp: cleanPhone,
      email: email?.trim() || null,
      course: safeCourse,
      batch: batch || "Basic 1 (1:00 PM - 2:30 PM)",
      dob: dob || null,
      school_name: school_name || null,
      address: address || null,
      emergency_contact: emergency_contact || null,
      father_name: father_name || null,
      father_contact: father_contact || null,
      mother_name: mother_name || null,
      mother_contact: mother_contact || null,
      guardian_name: guardian_name || null,
      terms_accepted: terms_accepted || false,
      payment_plan: payment_plan || "Full Payment",
      notes: notes || null,
      status: "pending",
    }).select("id").single();

    if (regError) {
      console.error("Registration insert error:", regError);
      return new Response(JSON.stringify({ error: "Failed to submit registration. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also insert into leads for CRM tracking
    const { data: leadData } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      course: safeCourse,
      source: "Registration Form",
      notes: notes || null,
      status: "new",
    }).select("id").single();

    // Link registration to lead
    if (leadData) {
      await supabase.from("registrations").update({ lead_id: leadData.id }).eq("id", regData.id);
    }

    return new Response(JSON.stringify({
      success: true,
      id: regData.id,
      message: "Registration submitted! The academy will review and confirm your enrollment.",
    }), {
      status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

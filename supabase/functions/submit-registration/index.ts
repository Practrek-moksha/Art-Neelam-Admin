import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
}

// Updated fee structure
const COURSE_CONFIG: Record<string, { fee: number; sessions: number; ages: string }> = {
  "Basic": { fee: 9000, sessions: 36, ages: "4–7" },
  "Advanced": { fee: 15000, sessions: 36, ages: "8–12" },
  "Professional": { fee: 30000, sessions: 36, ages: "13+" },
};

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
      guardian_name, terms_accepted,
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
    const config = COURSE_CONFIG[safeCourse];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cleanPhone = phone.replace(/[\s\-()]/g, "").replace(/^\+91/, "");

    // Check duplicate by phone
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id, name")
      .eq("whatsapp", cleanPhone)
      .maybeSingle();

    if (existingStudent) {
      return new Response(JSON.stringify({ error: `A student (${existingStudent.name}) with this WhatsApp number is already enrolled.` }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: check leads in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", cleanPhone)
      .gte("created_at", oneDayAgo);

    if (existingLead && existingLead.length > 0) {
      return new Response(JSON.stringify({ error: "A registration with this number was already submitted recently. Please wait 24 hours." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate validity dates
    const validityStart = new Date().toISOString().slice(0, 10);
    const weeks = Math.ceil(config.sessions / 4);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + weeks * 7);
    const validityEnd = endDate.toISOString().slice(0, 10);

    // Insert student — roll_number set to TEMP, trigger auto-generates NAS-####
    const { data: studentData, error: studentError } = await supabase.from("students").insert({
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
      roll_number: "TEMP",
      fee_amount: config.fee,
      total_sessions: config.sessions,
      validity_start: validityStart,
      validity_end: validityEnd,
      enrollment_date: validityStart,
      terms_accepted: terms_accepted || false,
      status: "active",
    }).select("id, roll_number").single();

    if (studentError) {
      console.error("Student insert error:", studentError);
      if (studentError.code === "23505") {
        return new Response(JSON.stringify({ error: "A student with this phone number is already enrolled." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to register student. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also insert into leads for CRM tracking
    await supabase.from("leads").insert({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      course: safeCourse,
      source: "Registration Form",
      notes: notes || null,
      status: "converted",
    });

    return new Response(JSON.stringify({
      success: true,
      id: studentData.id,
      roll_number: studentData.roll_number,
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

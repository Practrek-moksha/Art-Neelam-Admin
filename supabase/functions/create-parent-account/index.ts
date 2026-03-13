import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate a 4-character alphanumeric password
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(): string {
  let pass = "";
  for (let i = 0; i < 4; i++) {
    pass += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return pass;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { student_id } = await req.json();
    if (!student_id) {
      return new Response(JSON.stringify({ error: "student_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, name, roll_number, whatsapp, email, father_contact, mother_contact, father_name, mother_name")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate email from roll number: nas0001@artneelam.academy
    const rollNum = student.roll_number.replace(/[^0-9]/g, "");
    const parentEmail = `parent${rollNum}@artneelam.academy`;
    const password = generatePassword();
    const parentName = student.father_name || student.mother_name || "Parent";

    // Check if account already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === parentEmail);

    let userId: string;

    if (existingUser) {
      // Update password for existing user
      await supabase.auth.admin.updateUserById(existingUser.id, { password });
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: parentEmail,
        password,
        email_confirm: true,
        user_metadata: { display_name: parentName },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: "Failed to create account: " + createError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;

      // Assign parent role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "parent",
      }).onConflict("user_id,role").ignoreDuplicates;
    }

    // Create parent-student link if not exists
    const { data: existingLink } = await supabase
      .from("student_parent_link")
      .select("id")
      .eq("parent_user_id", userId)
      .eq("student_id", student_id)
      .maybeSingle();

    if (!existingLink) {
      await supabase.from("student_parent_link").insert({
        parent_user_id: userId,
        student_id,
      });
    }

    // Update student record
    await supabase.from("students").update({
      parent_email: parentEmail,
      parent_account_created: true,
    }).eq("id", student_id);

    return new Response(JSON.stringify({
      success: true,
      email: parentEmail,
      password,
      parent_name: parentName,
      student_name: student.name,
      whatsapp: student.father_contact || student.mother_contact || student.whatsapp,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

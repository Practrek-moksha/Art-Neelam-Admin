import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: string[] = [];

    // 1. Create admin user
    const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@artneelam.academy",
      password: "Admin@123",
      email_confirm: true,
      user_metadata: { display_name: "Neelam Suthar" },
    });
    if (adminErr && !adminErr.message.includes("already been registered")) {
      results.push(`Admin error: ${adminErr.message}`);
    } else {
      const adminId = adminData?.user?.id;
      if (adminId) {
        // Ensure admin role
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: adminId, role: "admin" },
          { onConflict: "user_id,role" }
        );
        // Ensure profile
        await supabaseAdmin.from("profiles").upsert(
          { user_id: adminId, display_name: "Neelam Suthar" },
          { onConflict: "user_id" }
        );
        results.push("Admin created: admin@artneelam.academy / Admin@123");
      }
    }

    // 2. Create parent user
    const { data: parentData, error: parentErr } = await supabaseAdmin.auth.admin.createUser({
      email: "parent@artneelam.academy",
      password: "Parent@123",
      email_confirm: true,
      user_metadata: { display_name: "Rajesh Kumar (Parent)" },
    });
    if (parentErr && !parentErr.message.includes("already been registered")) {
      results.push(`Parent error: ${parentErr.message}`);
    } else {
      const parentId = parentData?.user?.id;
      if (parentId) {
        // Assign parent role
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: parentId, role: "parent" },
          { onConflict: "user_id,role" }
        );
        // Ensure profile
        await supabaseAdmin.from("profiles").upsert(
          { user_id: parentId, display_name: "Rajesh Kumar (Parent)" },
          { onConflict: "user_id" }
        );

        // Link parent to first student (dummy student 1)
        const { data: firstStudent } = await supabaseAdmin
          .from("students")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (firstStudent) {
          await supabaseAdmin.from("student_parent_link").upsert(
            { parent_user_id: parentId, student_id: firstStudent.id },
            { onConflict: "parent_user_id,student_id" }
          );
          results.push(`Parent linked to student ${firstStudent.id}`);
        }
        results.push("Parent created: parent@artneelam.academy / Parent@123");
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

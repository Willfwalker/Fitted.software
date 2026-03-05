"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function setupOrganization(formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const orgName = (formData.get("orgName") as string)?.trim()

  if (!fullName || !email || !password || !orgName) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const admin = createAdminClient()

  // Guard: no org should exist yet
  const { count } = await admin
    .from("organizations")
    .select("id", { count: "exact", head: true })

  if (count && count > 0) {
    return { error: "Organization already exists" }
  }

  // Create user via admin (auto-confirms email)
  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (userError || !userData.user) {
    return { error: userError?.message ?? "Failed to create user" }
  }

  const userId = userData.user.id

  // Create slug from org name
  let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!slug) slug = "org"

  // Create organization
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name: orgName, slug, owner_id: userId })
    .select("id")
    .single()

  if (orgError || !org) {
    // Rollback: delete user
    await admin.auth.admin.deleteUser(userId)
    return { error: orgError?.message ?? "Failed to create organization" }
  }

  // Add as OWNER member
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({ org_id: org.id, user_id: userId, role: "OWNER" })

  if (memberError) {
    await admin.from("organizations").delete().eq("id", org.id)
    await admin.auth.admin.deleteUser(userId)
    return { error: memberError.message }
  }

  // Sign in the new user
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: "Account created but sign-in failed. Please log in manually." }
  }

  redirect("/dashboard")
}

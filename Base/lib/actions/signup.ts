"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signupWithInvite(formData: FormData) {
  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string
  const inviteCode = (formData.get("inviteCode") as string)?.trim().toUpperCase()

  if (!fullName || !email || !password || !inviteCode) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const admin = createAdminClient()

  // Validate invite code
  const { data: invite, error: inviteError } = await admin
    .from("invite_codes")
    .select("*")
    .eq("code", inviteCode)
    .single()

  if (inviteError || !invite) {
    return { error: "Invalid invite code" }
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "Invite code has expired" }
  }

  if (invite.use_count >= invite.max_uses) {
    return { error: "Invite code has reached its usage limit" }
  }

  // Create user via signUp (client-side compatible)
  const supabase = await createClient()
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message ?? "Failed to create account" }
  }

  const userId = signUpData.user.id

  // Add to org as MEMBER (admin client to bypass RLS)
  const { error: memberError } = await admin
    .from("organization_members")
    .insert({ org_id: invite.org_id, user_id: userId, role: "MEMBER" })

  if (memberError) {
    return { error: memberError.message }
  }

  // Increment use_count
  await admin
    .from("invite_codes")
    .update({ use_count: invite.use_count + 1 })
    .eq("id", invite.id)

  // Sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: "Account created but sign-in failed. Please log in manually." }
  }

  redirect("/dashboard")
}

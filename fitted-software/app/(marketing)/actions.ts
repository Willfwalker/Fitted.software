"use server";

import { Resend } from "resend";

export async function joinWaitlist(
  _prev: { success: boolean; message: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, message: "Waitlist is not configured yet." };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Fitted <onboarding@resend.dev>",
      to: "willfwalker@gmail.com",
      subject: `New quote request: ${email}`,
      text: `New quote request!\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });

    return { success: true, message: "You're on the list!" };
  } catch {
    return { success: false, message: "Something went wrong. Try again." };
  }
}

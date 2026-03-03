"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function joinWaitlist(
  _prev: { success: boolean; message: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email." };
  }

  try {
    await resend.emails.send({
      from: "Fitted Waitlist <onboarding@resend.dev>",
      to: "willfwalker@gmail.com",
      subject: `New waitlist signup: ${email}`,
      text: `New waitlist signup!\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });

    return { success: true, message: "You're on the list!" };
  } catch {
    return { success: false, message: "Something went wrong. Try again." };
  }
}

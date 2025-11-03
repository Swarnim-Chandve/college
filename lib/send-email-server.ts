// Server-only email sending utility
import nodemailer from "nodemailer"

export type SendEmailPayload = {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmailServer(payload: SendEmailPayload): Promise<{ ok: boolean }> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASS

  if (!gmailUser || !gmailPass) {
    throw new Error("Gmail credentials not configured")
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    await transporter.sendMail({
      from: `"GHRCE Portal" <${gmailUser}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    })

    return { ok: true }
  } catch (error) {
    console.error("Email send error:", error)
    throw error
  }
}


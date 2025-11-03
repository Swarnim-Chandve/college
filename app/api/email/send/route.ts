import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  const { to, subject, text, html } = await req.json()
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASS
  
  // Try Gmail first (new implementation)
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      })

      const info = await transporter.sendMail({
        from: `"GHRCE Portal" <${gmailUser}>`,
        to,
        subject,
        text,
        html,
      })

      return NextResponse.json({ ok: true, id: info.messageId })
    } catch (e) {
      // Fallback to Resend if Gmail fails
      console.error('Gmail error:', e)
    }
  }

  // Fallback to Resend (existing implementation)
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM || ""
  if (!apiKey) return NextResponse.json({ error: "Missing email credentials" }, { status: 500 })
  if (!fromAddress) return NextResponse.json({ error: "Missing RESEND_FROM" }, { status: 500 })

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromAddress, to, subject, text, html }),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}



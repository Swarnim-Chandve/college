import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { to, subject, text, html } = await req.json()
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = process.env.RESEND_FROM || ""
  if (!apiKey) return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 })
  if (!fromAddress) return NextResponse.json({ error: "Missing RESEND_FROM (verified sender/domain)" }, { status: 500 })

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



export type SendEmailPayload = {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(payload: SendEmailPayload): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}



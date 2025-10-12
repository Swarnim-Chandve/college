import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(params.id)
    const row = await prisma.rollList.findFirst({ where: { regno: id } })
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 })
    return NextResponse.json({ ok: true, row })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "query_failed" }, { status: 500 })
  }
}



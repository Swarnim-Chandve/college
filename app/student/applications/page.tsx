"use client"

import { useEffect, useState } from "react"
import { getSession, fetchSession } from "@/lib/auth-new"
import { listJoining2w, listJoining4w, listJoining6m, listJoining1y } from "@/lib/server-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { fmtDate } from "@/lib/date"

export default function MyApplicationsPage() {
  const { toast } = useToast()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const s = getSession() || (await fetchSession())
      if (s?.type === "student" && s.studentId) {
        const [j2, j4, j6, j1] = await Promise.all([listJoining2w(), listJoining4w(), listJoining6m(), listJoining1y()])
        const mine = [
          ...j2.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '2w' })),
          ...j4.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '4w' })),
          ...j6.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '6m' })),
          ...j1.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '1y' })),
        ]
        setApps(mine)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function refresh() {
    const s = getSession() || (await fetchSession())
    if (s?.type === "student" && s.studentId) {
      const [j2, j4, j6, j1] = await Promise.all([listJoining2w(), listJoining4w(), listJoining6m(), listJoining1y()])
      const mine = [
        ...j2.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '2w' })),
        ...j4.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '4w' })),
        ...j6.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '6m' })),
        ...j1.filter(a => a.studentId === s.studentId).map(a => ({ ...a, duration: '1y' })),
      ]
      setApps(mine)
    }
  }

  // Note: Certificate upload via joining tables is not wired here in this view.

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : apps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No applications yet.
                    </TableCell>
                  </TableRow>
                ) : null}
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.company}</TableCell>
                    <TableCell>{a.duration === "2w" ? "2 Weeks" : a.duration === "4w" ? "4 Weeks" : a.duration === "6m" ? "6 Months" : "1 Year"}</TableCell>
                    <TableCell>{fmtDate(a.startDate)}</TableCell>
                    <TableCell>{fmtDate(a.endDate)}</TableCell>
                    <TableCell className="capitalize">{a.status.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      {a.certificateFileName ? (
                        <div className="flex items-center gap-2">
                          <a className="underline" href={a.certificateUrl} target="_blank" rel="noreferrer">
                            {a.certificateFileName}
                          </a>
                          <span className="text-xs text-muted-foreground">uploaded {fmtDate(a.certificateUploadedAt)}</span>
                          {a.certificateVerified ? (
                            <span className="rounded bg-green-600 px-2 py-0.5 text-xs text-white">Verified</span>
                          ) : (
                            <span className="rounded bg-amber-500/90 px-2 py-0.5 text-xs text-white">Pending verification</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input id={`file-${a.id}`} type="file" accept="application/pdf" onChange={(e) => onUpload(e, a.id)} className="hidden" />
                          <Button size="sm" variant="outline" asChild>
                            <label htmlFor={`file-${a.id}`}>Upload PDF</label>
                          </Button>
                          <span className="text-xs text-muted-foreground">PDF, max 2MB</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



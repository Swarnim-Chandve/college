"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { attachInternshipCertificate, listInternshipsByStudent } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { fmtDate } from "@/lib/date"

export default function MyApplicationsPage() {
  const { toast } = useToast()
  const [apps, setApps] = useState<any[]>([])

  useEffect(() => {
    const s = getSession()
    if (s?.type === "student") {
      setApps(listInternshipsByStudent(s.studentId))
    }
  }, [])

  function refresh() {
    const s = getSession()
    if (s?.type === "student") {
      setApps(listInternshipsByStudent(s.studentId))
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>, appId: string) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Only PDF files are allowed.", variant: "destructive" as any })
      e.target.value = ""
      return
    }
    const maxBytes = 2 * 1024 * 1024 // 2 MB demo limit
    if (file.size > maxBytes) {
      toast({ title: "File too large", description: "Max size is 2 MB.", variant: "destructive" as any })
      e.target.value = ""
      return
    }
    const buffer = await file.arrayBuffer()
    const base64 = typeof window !== "undefined" ? btoa(String.fromCharCode(...new Uint8Array(buffer))) : ""
    const url = `data:${file.type};base64,${base64}`
    attachInternshipCertificate(appId, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url,
    })
    toast({ description: "Certificate uploaded." })
    e.target.value = ""
    refresh()
  }

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
                {apps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No applications yet.
                    </TableCell>
                  </TableRow>
                )}
                {apps.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.companySnapshot.name}</TableCell>
                    <TableCell>{a.duration === "2w" ? "2 Weeks" : a.duration === "4w" ? "4 Weeks" : "6 Months"}</TableCell>
                    <TableCell>{fmtDate(a.fromDate)}</TableCell>
                    <TableCell>{fmtDate(a.toDate)}</TableCell>
                    <TableCell className="capitalize">{a.status.replaceAll("_", " ")}</TableCell>
                    <TableCell>
                      {a.certificate ? (
                        <div className="flex items-center gap-2">
                          <a className="underline" href={a.certificate.url} target="_blank" rel="noreferrer">
                            {a.certificate.fileName}
                          </a>
                          <span className="text-xs text-muted-foreground">uploaded {fmtDate(a.certificate.uploadedAt)}</span>
                          {a.certificate.verified ? (
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



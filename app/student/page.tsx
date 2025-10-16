"use client"

import { useEffect, useRef, useState } from "react"
import { getSession, fetchSession } from "@/lib/auth-new"
import { getStudentProfileByStudentId, listJoining2w, listJoining4w, listJoining6m, upsertStudentProfile, findRollByStudentId } from "@/lib/server-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

export default function StudentHomePage() {
  const [profile, setProfile] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const prevStatusRef = useRef<Map<string, string>>(new Map())

  async function loadStudentApps(studentId: string) {
    const [joining2w, joining4w, joining6m] = await Promise.all([
      listJoining2w(),
      listJoining4w(),
      listJoining6m()
    ])
    const studentApps = [
      ...joining2w.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '2w' })),
      ...joining4w.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '4w' })),
      ...joining6m.filter(app => app.studentId === studentId).map(app => ({ ...app, duration: '6m' }))
    ]
    return studentApps
  }
  useEffect(() => {
    let interval: any
    async function loadData() {
      const s = await fetchSession()
      if (s && s.type === "student" && s.studentId) {
        const studentId = s.studentId as string
        let p = await getStudentProfileByStudentId(studentId)
        if (!p) {
          try {
            const roll = await findRollByStudentId(studentId)
            await upsertStudentProfile({
              studentId,
              email: s.email,
              name: roll?.name ?? undefined,
              branch: roll?.dept ?? undefined,
              semester: roll?.sem ? parseInt(roll.sem) : undefined,
              section: roll?.sec ?? undefined,
              rollno: roll?.rno ? parseInt(roll.rno) : undefined,
              year: roll?.session ?? undefined,
              btype: roll?.dtype ?? undefined,
              photo: "/placeholder-user.jpg",
              date: new Date().toISOString(),
            })
            p = await getStudentProfileByStudentId(studentId)
          } catch {}
        }
        setProfile(p)
        setLoading(false)

        // initial load
        const first = await loadStudentApps(studentId)
        setApps(first)
        // seed prevStatus map without toasts
        const seed = new Map<string, string>()
        first.forEach(a => seed.set(a.id, a.status))
        prevStatusRef.current = seed

        // poll for changes
        interval = setInterval(async () => {
          const latest = await loadStudentApps(studentId)
          setApps(latest)
          // compare and notify
          latest.forEach(a => {
            const prev = prevStatusRef.current.get(a.id)
            if (prev && prev !== a.status) {
              if (a.status.includes("approved")) {
                toast({ title: "Application approved", description: `${a.company} (${a.duration}) has been approved.` })
              } else if (a.status === "rejected") {
                toast({ title: "Application rejected", description: `${a.company} (${a.duration}) was rejected.`, variant: "destructive" as any })
              }
            }
          })
          // update map
          const next = new Map<string, string>()
          latest.forEach(a => next.set(a.id, a.status))
          prevStatusRef.current = next
        }, 8000)
      } else {
        setLoading(false)
      }
    }
    loadData()
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome {profile?.name ? profile.name : "Student"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <div className="col-span-3 text-center text-sm text-muted-foreground">
              Loading profile...
            </div>
          ) : (
            <>
              <div>
                <div className="text-xs text-muted-foreground">Student ID</div>
                <div className="font-medium">{profile?.studentId}</div>
              </div>
          <div>
            <div className="text-xs text-muted-foreground">Academic Year</div>
            <div className="font-medium">{profile?.year}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Roll No</div>
            <div className="font-medium">{profile?.rollno}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Semester</div>
            <div className="font-medium">{profile?.semester}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Section</div>
            <div className="font-medium">{profile?.section}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Branch</div>
            <div className="font-medium">{profile?.branch}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Degree</div>
            <div className="font-medium">{profile?.btype}</div>
          </div>
          <div className="md:col-span-3 text-sm text-muted-foreground">
            Explore internships via the menu. Your details are auto-filled in applications.
          </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Internship Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>{a.company}</TableCell>
                    <TableCell>
                      {a.duration === "2w" ? "2 Weeks" : a.duration === "4w" ? "4 Weeks" : "6 Months"}
                    </TableCell>
                    <TableCell>{fmtDate(a.startDate)}</TableCell>
                    <TableCell>{fmtDate(a.endDate)}</TableCell>
                    <TableCell>{a.totalDays}</TableCell>
                    <TableCell className="capitalize">{a.status.replaceAll("_", " ")}</TableCell>
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

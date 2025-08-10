"use client"

import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { getStudentProfileByStudentId, listInternshipsByStudent } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"

export default function StudentHomePage() {
  const [profile, setProfile] = useState<any>(null)
  const [apps, setApps] = useState<any[]>([])
  useEffect(() => {
    const s = getSession()
    if (s && s.type === "student") {
      const p = getStudentProfileByStudentId(s.studentId)
      setProfile(p)
      setApps(listInternshipsByStudent(s.studentId))
    }
  }, [])
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome {profile?.name ? profile.name : "Student"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">Student ID</div>
            <div className="font-medium">{profile?.studentId}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Academic Year</div>
            <div className="font-medium">{profile?.academicYear}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Roll No</div>
            <div className="font-medium">{profile?.rollNo}</div>
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
            <div className="font-medium">{profile?.degree}</div>
          </div>
          <div className="md:col-span-3 text-sm text-muted-foreground">
            Explore internships via the menu. Your details are auto-filled in applications.
          </div>
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
                    <TableCell>{a.companySnapshot.name}</TableCell>
                    <TableCell>
                      {a.duration === "2w" ? "2 Weeks" : a.duration === "4w" ? "4 Weeks" : "6 Months"}
                    </TableCell>
                    <TableCell>{fmtDate(a.fromDate)}</TableCell>
                    <TableCell>{fmtDate(a.toDate)}</TableCell>
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

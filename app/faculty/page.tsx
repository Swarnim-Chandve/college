"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { getAllStudents, listInternships, resetDB, updateInternshipStatus } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

function StudentsTable() {
  const [q, setQ] = useState("")
  const [rows, setRows] = useState(getAllStudents())
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q.toLowerCase()) ||
          r.studentId.toLowerCase().includes(q.toLowerCase()) ||
          r.rollNo.toLowerCase().includes(q.toLowerCase()),
      ),
    [rows, q],
  )
  useEffect(() => {
    setRows(getAllStudents())
  }, [])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registered Students</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Search by name, Student ID, or Roll No" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell>{s.rollNo}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.degree}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.mobile}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function ApprovalsTable() {
  const session = getSession()
  const { toast } = useToast()
  const role = session?.type === "faculty" ? session.role : "faculty"
  const [rows, setRows] = useState(listInternships())

  function refresh() {
    setRows(listInternships())
  }

  function canApprove(status: string) {
    if (role === "faculty") return status === "pending"
    if (role === "coordinator") return status === "approved_faculty" || status === "pending"
    if (role === "dean")
      return status === "approved_coordinator" || status === "approved_faculty" || status === "pending"
    if (role === "admin") return true
    return false
  }

  function approve(id: string) {
    if (!session || session.type !== "faculty") return
    const r = session.role === "admin" ? "dean" : session.role // admin escalates to dean-level approval
    updateInternshipStatus(id, { action: "approve", role: r as any, by: session.email })
    toast({ description: "Approved." })
    refresh()
  }

  function reject(id: string) {
    if (!session || session.type !== "faculty") return
    updateInternshipStatus(id, { action: "reject", by: session.email })
    toast({ description: "Rejected." })
    refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internship Applications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.studentId}</TableCell>
                  <TableCell>{r.companySnapshot.name}</TableCell>
                  <TableCell>
                    {r.duration === "2w" ? "2 Weeks" : r.duration === "4w" ? "4 Weeks" : "6 Months"}
                  </TableCell>
                  <TableCell>{fmtDate(r.fromDate)}</TableCell>
                  <TableCell>{fmtDate(r.toDate)}</TableCell>
                  <TableCell>{r.totalDays}</TableCell>
                  <TableCell className="capitalize">{r.status.replaceAll("_", " ")}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" disabled={!canApprove(r.status)} onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function AdminPanel() {
  const { toast } = useToast()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Manage demo data.</p>
        <Button
          variant="destructive"
          onClick={() => {
            resetDB()
            toast({ description: "Database reset to seed data." })
          }}
        >
          Reset Database
        </Button>
      </CardContent>
    </Card>
  )
}

export default function FacultyPage() {
  const sp = useSearchParams()
  const tab = sp.get("tab") ?? "home"
  const s = getSession()
  const role = s?.type === "faculty" ? s.role : "faculty"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome {s?.type === "faculty" ? s.name : "Faculty"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the menu to view registered students and approve internship applications. Role:{" "}
            <span className="capitalize">{role}</span>.
          </p>
        </CardContent>
      </Card>

      {tab === "students" && <StudentsTable />}
      {tab === "approvals" && <ApprovalsTable />}
      {tab === "admin" && role === "admin" && <AdminPanel />}

      {tab === "home" && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/faculty?tab=students">View Student List</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/faculty?tab=approvals">Review Applications</a>
            </Button>
            {role === "admin" && (
              <Button asChild variant="secondary">
                <a href="/faculty?tab=admin">Admin Tools</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

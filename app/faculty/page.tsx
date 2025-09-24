"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { getAllStudents, listInternships, resetDB, updateInternshipStatus, importRollListFromTSV, importStuLoginFromTSV, importStuProfileFromTSV, getStudentProfileByStudentId, verifyInternshipCertificate } from "@/lib/db"
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
  const [search, setSearch] = useState("")
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [filters, setFilters] = useState({ duration: "", session: "", semester: "", branch: "", ugpg: "" })

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
    toast({ title: "Approved", description: "Application moved to next stage." })
    refresh()
  }

  function reject(id: string) {
    if (!session || session.type !== "faculty") return
    updateInternshipStatus(id, { action: "reject", by: session.email })
    toast({ title: "Rejected", description: "Application marked as rejected." })
    refresh()
  }

  function markVerified(id: string) {
    if (!session || session.type !== "faculty") return
    if (role !== "coordinator" && role !== "admin" && role !== "dean") {
      toast({ title: "Not allowed", description: "Only coordinator/dean/admin can verify certificates.", variant: "destructive" as any })
      return
    }
    verifyInternshipCertificate(id, session.email)
    toast({ title: "Certificate verified", description: "Marked as verified." })
    refresh()
  }

  const rowsWithProfile = rows.map((r) => ({ r, p: getStudentProfileByStudentId(r.studentId) }))
  const filtered = rowsWithProfile.filter(({ r, p }) => {
    if (statusTab === "pending" && r.status !== "pending") return false
    if (statusTab === "approved" && !r.status.startsWith("approved_")) return false
    if (statusTab === "rejected" && r.status !== "rejected") return false
    if (filters.duration && r.duration !== (filters.duration as any)) return false
    if (filters.session && p && p.academicYear !== filters.session) return false
    if (filters.semester && p && p.semester !== filters.semester) return false
    if (filters.branch && p && !p.branch.toLowerCase().includes(filters.branch.toLowerCase())) return false
    if (filters.ugpg && p) {
      const deg = p.degree.toLowerCase()
      const isUG = deg.includes("b.") || deg.includes("btech") || deg.includes("btech") || deg.includes("btech")
      if (filters.ugpg === "UG" && !isUG) return false
      if (filters.ugpg === "PG" && isUG) return false
    }
    if (search) {
      const s = search.toLowerCase()
      const hay = [r.studentId, p?.name, p?.branch, r.companySnapshot.name].join(" ").toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internship Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={statusTab === "all" ? "default" : "outline"} onClick={() => setStatusTab("all")}>
            All
          </Button>
          <Button
            size="sm"
            variant={statusTab === "pending" ? "default" : "outline"}
            onClick={() => setStatusTab("pending")}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusTab === "approved" ? "default" : "outline"}
            onClick={() => setStatusTab("approved")}
          >
            Approved
          </Button>
          <Button
            size="sm"
            variant={statusTab === "rejected" ? "default" : "outline"}
            onClick={() => setStatusTab("rejected")}
          >
            Rejected
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Type</span>
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.duration}
              onChange={(e) => setFilters((f) => ({ ...f, duration: e.target.value }))}
            >
              <option value="">All</option>
              <option value="2w">2 Weeks</option>
              <option value="4w">4 Weeks</option>
              <option value="6m">6 Months</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Session</span>
            <input
              className="h-8 w-full rounded border bg-background px-2 text-sm"
              placeholder="2024-25"
              value={filters.session}
              onChange={(e) => setFilters((f) => ({ ...f, session: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Semester</span>
            <input
              className="h-8 w-full rounded border bg-background px-2 text-sm"
              placeholder="8"
              value={filters.semester}
              onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Branch</span>
            <input
              className="h-8 w-full rounded border bg-background px-2 text-sm"
              placeholder="CSE"
              value={filters.branch}
              onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">UG/PG</span>
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.ugpg}
              onChange={(e) => setFilters((f) => ({ ...f, ugpg: e.target.value }))}
            >
              <option value="">All</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Search</span>
            <input
              className="h-8 w-full rounded border bg-background px-2 text-sm"
              placeholder="Name / ID / Company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Sem/Section</TableHead>
                <TableHead>Degree</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(({ r, p }) => (
                <TableRow key={r.id}>
                  <TableCell>{r.studentId}</TableCell>
                  <TableCell>{p?.name}</TableCell>
                  <TableCell>{p?.rollNo}</TableCell>
                  <TableCell>{p?.mobile}</TableCell>
                  <TableCell>{p?.branch}</TableCell>
                  <TableCell>
                    {p?.semester}/{p?.section}
                  </TableCell>
                  <TableCell>{p?.degree}</TableCell>
                  <TableCell>{p?.email}</TableCell>
                  <TableCell>{r.companySnapshot.name}</TableCell>
                  <TableCell>
                    {r.duration === "2w" ? "2 Weeks" : r.duration === "4w" ? "4 Weeks" : "6 Months"}
                  </TableCell>
                  <TableCell>{fmtDate(r.fromDate)}</TableCell>
                  <TableCell>{fmtDate(r.toDate)}</TableCell>
                  <TableCell>{r.totalDays}</TableCell>
                  <TableCell>
                    {r.certificate ? (
                      <a className="underline" href={r.certificate.url} target="_blank" rel="noreferrer">
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not uploaded</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {r.status.replaceAll("_", " ")}
                    {r.certificate?.verified && (
                      <div className="text-xs text-green-600">Verified by {r.certificate.verified.by}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {r.approvals.faculty && <div>Faculty: {r.approvals.faculty.by} ({fmtDate(r.approvals.faculty.at)})</div>}
                      {r.approvals.coordinator && (
                        <div>Coordinator: {r.approvals.coordinator.by} ({fmtDate(r.approvals.coordinator.at)})</div>
                      )}
                      {r.approvals.dean && <div>Dean: {r.approvals.dean.by} ({fmtDate(r.approvals.dean.at)})</div>}
                    </div>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" disabled={!canApprove(r.status)} onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!r.certificate || !!r.certificate.verified} onClick={() => markVerified(r.id)}>
                      Verify Certificate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
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
  const [rollTSV, setRollTSV] = useState("")
  const [profileTSV, setProfileTSV] = useState("")
  const [loginTSV, setLoginTSV] = useState("")
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">Manage demo data.</p>
        <Button
          variant="destructive"
          onClick={() => {
            resetDB()
            toast({ title: "Database reset", description: "Seed data restored." })
          }}
        >
          Reset Database
        </Button>

        <div className="space-y-2">
          <div className="text-sm font-medium">Import Roll List (TSV)</div>
          <textarea className="w-full min-h-28 rounded-md border p-2 text-sm" value={rollTSV} onChange={(e) => setRollTSV(e.target.value)} placeholder="Dept\tSem\tSec\tRollNo\tName\tRegistrationId\tSession\tdtype" />
          <Button
            size="sm"
            onClick={() => {
              importRollListFromTSV(rollTSV)
              toast({ title: "Imported", description: "Roll list imported." })
              setRollTSV("")
            }}
          >
            Import Roll List
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Import Student Profiles (TSV)</div>
          <textarea className="w-full min-h-28 rounded-md border p-2 text-sm" value={profileTSV} onChange={(e) => setProfileTSV(e.target.value)} placeholder="RegistrationID\tName\tEmail\tDept\tPhoto\tDate\tSession\tMobile\tSem\tSection\tRollNo\tDtype" />
          <Button
            size="sm"
            onClick={() => {
              importStuProfileFromTSV(profileTSV)
              toast({ title: "Imported", description: "Student profiles imported." })
              setProfileTSV("")
            }}
          >
            Import Profiles
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Import Student Logins (TSV)</div>
          <textarea className="w-full min-h-28 rounded-md border p-2 text-sm" value={loginTSV} onChange={(e) => setLoginTSV(e.target.value)} placeholder="RegistrationId\tName\tEmail\tPassword\tDate\tSession" />
          <Button
            size="sm"
            onClick={() => {
              importStuLoginFromTSV(loginTSV)
              toast({ title: "Imported", description: "Student logins imported." })
              setLoginTSV("")
            }}
          >
            Import Logins
          </Button>
        </div>
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

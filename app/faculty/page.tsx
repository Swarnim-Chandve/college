"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth-new"
import { 
  listStuProfiles, 
  listInternshipApplications, 
  updateInternshipApplicationStatus,
  approveInternshipApplication,
  rejectInternshipApplication,
  verifyInternshipCertificate,
  seedDatabase
} from "@/lib/server-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

function StudentsTable() {
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<any[]>([])
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(q.toLowerCase()) ||
          r.studentId?.toLowerCase().includes(q.toLowerCase()) ||
          r.rollno?.toString().includes(q.toLowerCase()),
      ),
    [rows, q],
  )
  
  useEffect(() => {
    loadStudents()
  }, [])
  
  async function loadStudents() {
    const students = await listStuProfiles()
    setRows(students)
  }
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
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.studentId}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell>{s.rollno}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell>{s.branch}</TableCell>
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
  const [session, setSession] = useState<any>(null)
  const { toast } = useToast()
  const role = session?.type === "admin" ? "admin" : session?.type === "faculty" ? "faculty" : "coordinator"
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [filters, setFilters] = useState({ duration: "", session: "", semester: "", branch: "", degree: "" })

  useEffect(() => {
    async function loadSession() {
      const s = await fetchSession()
      setSession(s)
    }
    loadSession()
    loadApplications()
  }, [])

  async function loadApplications() {
    const applications = await listInternshipApplications()
    setRows(applications)
  }

  function refresh() {
    loadApplications()
  }

  function canApprove(status: string) {
    if (role === "faculty") return status === "pending"
    if (role === "coordinator") return status === "approved_faculty" || status === "pending"
    if (role === "dean") return status === "approved_coordinator" || status === "approved_faculty" || status === "pending"
    if (role === "admin") return status !== "approved" && status !== "rejected"
    return false
  }

  function getStatusDisplay(status: string) {
    switch (status) {
      case "pending": return "Pending"
      case "approved_faculty": return "Approved by Faculty"
      case "approved_coordinator": return "Approved by Coordinator"
      case "approved": return "Fully Approved"
      case "rejected": return "Rejected"
      default: return status
    }
  }

  async function approve(id: string) {
    if (!session || !session.email) return
    try {
      await approveInternshipApplication(id, session.email, role as any)
      toast({ title: "Approved", description: "Application approved successfully." })
      refresh()
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve application.", variant: "destructive" as any })
    }
  }

  async function reject(id: string) {
    if (!session || !session.email) return
    try {
      await rejectInternshipApplication(id, session.email)
      toast({ title: "Rejected", description: "Application rejected." })
      refresh()
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject application.", variant: "destructive" as any })
    }
  }

  async function markVerified(id: string) {
    if (!session || !session.email) return
    if (role !== "coordinator" && role !== "admin" && role !== "dean") {
      toast({ title: "Not allowed", description: "Only coordinator/dean/admin can verify certificates.", variant: "destructive" as any })
      return
    }
    try {
      await verifyInternshipCertificate(id, session.email)
      toast({ title: "Certificate verified", description: "Marked as verified." })
      refresh()
    } catch (error) {
      toast({ title: "Error", description: "Failed to verify certificate.", variant: "destructive" as any })
    }
  }

  const filtered = rows.filter((r) => {
    if (statusTab === "pending" && r.status !== "pending") return false
    if (statusTab === "approved" && !r.status.includes("approved")) return false
    if (statusTab === "rejected" && r.status !== "rejected") return false
    if (filters.duration && r.duration !== filters.duration) return false
    if (filters.session && r.profile?.year !== filters.session) return false
    if (filters.semester && r.profile?.semester?.toString() !== filters.semester) return false
    if (filters.branch && r.profile?.branch !== filters.branch) return false
    if (filters.degree && r.profile?.btype !== filters.degree) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = [r.studentId, r.company, r.profile?.name || ''].join(" ").toLowerCase()
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
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.session}
              onChange={(e) => setFilters((f) => ({ ...f, session: e.target.value }))}
            >
              <option value="">All Sessions</option>
              {Array.from(new Set(rows.map(r => r.profile?.year).filter(Boolean))).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Semester</span>
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.semester}
              onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
            >
              <option value="">All Semesters</option>
              {Array.from(new Set(rows.map(r => r.profile?.semester).filter(Boolean))).sort().map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Branch</span>
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.branch}
              onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            >
              <option value="">All Branches</option>
              {Array.from(new Set(rows.map(r => r.profile?.branch).filter(Boolean))).map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">UG/PG</span>
            <select
              className="h-8 rounded border bg-background px-2 text-sm"
              value={filters.degree}
              onChange={(e) => setFilters((f) => ({ ...f, degree: e.target.value }))}
            >
              <option value="">All Degrees</option>
              {Array.from(new Set(rows.map(r => r.profile?.btype).filter(Boolean))).map(degree => (
                <option key={degree} value={degree}>{degree}</option>
              ))}
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
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.studentId}</TableCell>
                  <TableCell>{r.profile?.name || '-'}</TableCell>
                  <TableCell>{r.profile?.rollno || '-'}</TableCell>
                  <TableCell>{r.profile?.mobile || '-'}</TableCell>
                  <TableCell>{r.profile?.branch || '-'}</TableCell>
                  <TableCell>{r.profile?.semester ? `${r.profile.semester}/${r.profile.section}` : '-'}</TableCell>
                  <TableCell>{r.profile?.btype || '-'}</TableCell>
                  <TableCell>{r.profile?.email || '-'}</TableCell>
                  <TableCell>{r.company}</TableCell>
                  <TableCell>
                    {r.duration === "2w" ? "2 Weeks" : r.duration === "4w" ? "4 Weeks" : "6 Months"}
                  </TableCell>
                  <TableCell>{fmtDate(r.startDate)}</TableCell>
                  <TableCell>{fmtDate(r.endDate)}</TableCell>
                  <TableCell>{r.totalDays}</TableCell>
                  <TableCell>
                    {r.certificateFileName ? (
                      <a className="underline" href={r.certificateUrl} target="_blank" rel="noreferrer">
                        {r.certificateFileName}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not uploaded</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {getStatusDisplay(r.status)}
                    {r.certificateVerified && (
                      <div className="text-xs text-green-600">Verified by {r.certificateVerifiedBy}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {r.approvedBy && <div>Approved by: {r.approvedBy} ({fmtDate(r.approvedAt)})</div>}
                      {r.rejectedBy && <div>Rejected by: {r.rejectedBy} ({fmtDate(r.rejectedAt)})</div>}
                    </div>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" disabled={!canApprove(r.status)} onClick={() => approve(r.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={r.status === "rejected"} onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                    <Button size="sm" variant="secondary" disabled={!r.certificateFileName || r.certificateVerified} onClick={() => markVerified(r.id)}>
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
  const [isMigrating, setIsMigrating] = useState(false)

  const handleSeeding = async () => {
    setIsMigrating(true)
    try {
      await seedDatabase()
      toast({ 
        title: "Database Seeded", 
        description: "Initial data has been added to the database!" 
      })
    } catch (error) {
      toast({ 
        title: "Seeding Failed", 
        description: "Failed to seed database",
        variant: "destructive"
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">Manage demo data and database migration.</p>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Database Seeding</div>
          <p className="text-xs text-muted-foreground">
            Add initial data to the database (companies, faculty, etc.)
          </p>
          <Button
            onClick={handleSeeding}
            disabled={isMigrating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isMigrating ? "Seeding..." : "Seed Database"}
          </Button>
        </div>


        <div className="space-y-2">
          <div className="text-sm font-medium">Import Roll List (TSV)</div>
          <textarea className="w-full min-h-28 rounded-md border p-2 text-sm" value={rollTSV} onChange={(e) => setRollTSV(e.target.value)} placeholder="Dept\tSem\tSec\tRollNo\tName\tRegistrationId\tSession\tdtype" />
          <Button
            size="sm"
            onClick={() => {
              toast({ title: "Import disabled", description: "TSV import is deprecated. Use database seeding instead." })
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
              toast({ title: "Import disabled", description: "TSV import is deprecated. Use database seeding instead." })
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
              toast({ title: "Import disabled", description: "TSV import is deprecated. Use database seeding instead." })
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
  const role = s?.type === "admin" ? "admin" : s?.type === "faculty" ? "coordinator" : "dean"

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

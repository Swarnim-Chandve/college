"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession, fetchSession } from "@/lib/auth-new"
import { 
  listStuProfiles, 
  listInternshipApplications,
  listJoining2w,
  listJoining4w,
  listJoining6m,
  listJoining1y,
  updateInternshipApplicationStatus,
  approveInternshipApplication,
  rejectInternshipApplication,
  verifyInternshipCertificate,
  seedDatabase,
  approveJoining2w,
  approveJoining4w,
  approveJoining6m,
  approveJoining1y,
  rejectJoining2w,
  rejectJoining4w,
  rejectJoining6m,
  rejectJoining1y,
  listCompanySubmissions,
  approveCompanySubmission,
  rejectCompanySubmission
} from "@/lib/server-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtDate } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"
import SiteHeader from "@/components/site-header"

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
    <Card className="border-2 border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Registered Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Input 
            placeholder="Search by name, Student ID, or Roll No" 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            className="border-gray-300 focus:border-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Student ID</TableHead>
                <TableHead className="font-semibold text-gray-700">Roll No</TableHead>
                <TableHead className="font-semibold text-gray-700">Semester</TableHead>
                <TableHead className="font-semibold text-gray-700">Section</TableHead>
                <TableHead className="font-semibold text-gray-700">Branch</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Mobile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.studentId} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{s.name}</TableCell>
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
                  <TableCell colSpan={8} className="text-center text-sm text-gray-500 py-8">
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
  const role = session?.type === "admin" ? "admin" : session?.type === "faculty" ? "faculty" : session?.type === "dean" ? "dean" : "coordinator"
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
    // Load applications from joining tables only (no more main table)
    const [joining2w, joining4w, joining6m, joining1y] = await Promise.all([
      listJoining2w(),
      listJoining4w(),
      listJoining6m(),
      listJoining1y()
    ])
    
    // Combine all applications with their source table
    const allApplications = [
      ...joining2w.map(app => ({ ...app, source: '2w', duration: '2w' })),
      ...joining4w.map(app => ({ ...app, source: '4w', duration: '4w' })),
      ...joining6m.map(app => ({ ...app, source: '6m', duration: '6m' })),
      ...joining1y.map(app => ({ ...app, source: '1y', duration: '1y' }))
    ]
    
    setRows(allApplications)
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

  async function approve(id: string, source: string) {
    if (!session || !session.email) return
    try {
      if (source === '2w') {
        await approveJoining2w(id, session.email, role as any)
      } else if (source === '4w') {
        await approveJoining4w(id, session.email, role as any)
      } else if (source === '6m') {
        await approveJoining6m(id, session.email, role as any)
      } else if (source === '1y') {
        await approveJoining1y(id, session.email, role as any)
      } else {
        await approveInternshipApplication(id, session.email, role as any)
      }
      toast({ title: "Approved", description: "Application approved successfully." })
      refresh()
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve application.", variant: "destructive" as any })
    }
  }

  async function reject(id: string, source: string) {
    if (!session || !session.email) return
    try {
      if (source === '2w') {
        await rejectJoining2w(id, session.email)
      } else if (source === '4w') {
        await rejectJoining4w(id, session.email)
      } else if (source === '6m') {
        await rejectJoining6m(id, session.email)
      } else if (source === '1y') {
        await rejectJoining1y(id, session.email)
      } else {
        await rejectInternshipApplication(id, session.email)
      }
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
              <option value="1y">1 Year</option>
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
                    {r.duration === "2w" ? "2 Weeks" : r.duration === "4w" ? "4 Weeks" : r.duration === "6m" ? "6 Months" : "1 Year"}
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
                    <Button size="sm" disabled={!canApprove(r.status)} onClick={() => approve(r.id, r.source)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={r.status === "rejected"} onClick={() => reject(r.id, r.source)}>
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

function ReportsTable() {
  const [session, setSession] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [durationFilter, setDurationFilter] = useState<"all" | "2w" | "4w" | "6m" | "1y">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [filters, setFilters] = useState({ 
    session: "", 
    semester: "", 
    branch: "", 
    degree: "" 
  })

  useEffect(() => {
    async function loadSession() {
      const s = await fetchSession()
      setSession(s)
    }
    loadSession()
    loadReports()
  }, [])

  async function loadReports() {
    // Load reports from joining tables
    const [joining2w, joining4w, joining6m, joining1y] = await Promise.all([
      listJoining2w(),
      listJoining4w(),
      listJoining6m(),
      listJoining1y()
    ])
    
    // Combine all reports with their source table
    const allReports = [
      ...joining2w.map(app => ({ ...app, source: '2w', duration: '2w' })),
      ...joining4w.map(app => ({ ...app, source: '4w', duration: '4w' })),
      ...joining6m.map(app => ({ ...app, source: '6m', duration: '6m' })),
      ...joining1y.map(app => ({ ...app, source: '1y', duration: '1y' }))
    ]
    
    setRows(allReports)
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

  const filtered = rows.filter((r) => {
    if (durationFilter !== "all" && r.duration !== durationFilter) return false
    if (statusFilter === "pending" && r.status !== "pending") return false
    if (statusFilter === "approved" && !r.status.includes("approved")) return false
    if (statusFilter === "rejected" && r.status !== "rejected") return false
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

  // Calculate statistics
  const stats = {
    total: rows.length,
    pending: rows.filter(r => r.status === "pending").length,
    approved: rows.filter(r => r.status.includes("approved")).length,
    rejected: rows.filter(r => r.status === "rejected").length,
    byDuration: {
      "2w": rows.filter(r => r.duration === "2w").length,
      "4w": rows.filter(r => r.duration === "4w").length,
      "6m": rows.filter(r => r.duration === "6m").length,
      "1y": rows.filter(r => r.duration === "1y").length
    },
    byBranch: rows.reduce((acc, r) => {
      const branch = r.profile?.branch || 'Unknown'
      acc[branch] = (acc[branch] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Duration Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Applications by Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-black text-blue-600">{stats.byDuration["2w"]}</div>
              <div className="text-sm text-muted-foreground">2 Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600">{stats.byDuration["4w"]}</div>
              <div className="text-sm text-muted-foreground">4 Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-orange-600">{stats.byDuration["6m"]}</div>
              <div className="text-sm text-muted-foreground">6 Months</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-600">{stats.byDuration["1y"]}</div>
              <div className="text-sm text-muted-foreground">1 Year</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Applications by Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(stats.byBranch)
              .sort(([,a], [,b]) => (b as number) - (a as number)) // Sort by count descending
              .map(([branch, count]) => (
                <div key={branch} className="text-center">
                  <div className="text-4xl font-black text-indigo-600">{count as number}</div>
                  <div className="text-sm text-muted-foreground">{branch}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} of {rows.length} applications
            {filtered.length !== rows.length && (
              <span className="ml-2 text-blue-600">
                (Filtered by: {[
                  durationFilter !== "all" && `${durationFilter === "2w" ? "2 Weeks" : durationFilter === "4w" ? "4 Weeks" : durationFilter === "6m" ? "6 Months" : "1 Year"}`,
                  statusFilter !== "all" && `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
                  filters.session && `Session: ${filters.session}`,
                  filters.semester && `Semester: ${filters.semester}`,
                  filters.branch && `Branch: ${filters.branch}`,
                  filters.degree && `Degree: ${filters.degree}`,
                  search && `Search: "${search}"`
                ].filter(Boolean).join(", ")})
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={durationFilter === "all" ? "default" : "outline"} onClick={() => setDurationFilter("all")}>
              All Durations
            </Button>
            <Button size="sm" variant={durationFilter === "2w" ? "default" : "outline"} onClick={() => setDurationFilter("2w")}>
              2 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "4w" ? "default" : "outline"} onClick={() => setDurationFilter("4w")}>
              4 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "6m" ? "default" : "outline"} onClick={() => setDurationFilter("6m")}>
              6 Months
            </Button>
            <Button size="sm" variant={durationFilter === "1y" ? "default" : "outline"} onClick={() => setDurationFilter("1y")}>
              1 Year
            </Button>
            {(durationFilter !== "all" || statusFilter !== "all" || filters.session || filters.semester || filters.branch || filters.degree || search) && (
              <Button size="sm" variant="secondary" onClick={() => {
                setDurationFilter("all")
                setStatusFilter("all")
                setFilters({ session: "", semester: "", branch: "", degree: "" })
                setSearch("")
              }}>
                Clear All Filters
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>
              All Status
            </Button>
            <Button size="sm" variant={statusFilter === "pending" ? "default" : "outline"} onClick={() => setStatusFilter("pending")}>
              Pending
            </Button>
            <Button size="sm" variant={statusFilter === "approved" ? "default" : "outline"} onClick={() => setStatusFilter("approved")}>
              Approved
            </Button>
            <Button size="sm" variant={statusFilter === "rejected" ? "default" : "outline"} onClick={() => setStatusFilter("rejected")}>
              Rejected
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-5">
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
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.studentId}</TableCell>
                    <TableCell>{r.profile?.name || '-'}</TableCell>
                    <TableCell>{r.profile?.rollno || '-'}</TableCell>
                    <TableCell>{r.profile?.branch || '-'}</TableCell>
                    <TableCell>{r.company}</TableCell>
                    <TableCell>
                      {r.duration === "2w" ? "2 Weeks" : r.duration === "4w" ? "4 Weeks" : r.duration === "6m" ? "6 Months" : "1 Year"}
                    </TableCell>
                    <TableCell>{fmtDate(r.startDate)}</TableCell>
                    <TableCell>{fmtDate(r.endDate)}</TableCell>
                    <TableCell>{r.totalDays}</TableCell>
                    <TableCell className="capitalize">
                      {getStatusDisplay(r.status)}
                      {r.certificateVerified && (
                        <div className="text-xs text-green-600">✓ Verified</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.certificateFileName ? (
                        <a className="underline text-blue-600" href={r.certificateUrl} target="_blank" rel="noreferrer">
                          {r.certificateFileName}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {r.approvedBy && <div>✓ {r.approvedBy}</div>}
                        {r.rejectedBy && <div>✗ {r.rejectedBy}</div>}
                        {!r.approvedBy && !r.rejectedBy && <div>-</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-sm text-muted-foreground">
                      No reports found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompaniesTable() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [durationFilter, setDurationFilter] = useState<"all" | "2w" | "4w" | "6m">("all")
  const [industryFilter, setIndustryFilter] = useState("")

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    try {
      setLoading(true)
      // For now, we'll use the existing companies from the database
      // In a real implementation, you'd parse the Excel files and store them with duration info
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      } else {
        // Fallback: create mock data based on the Excel files
        const mockCompanies = [
          // 2-week companies
          { id: '1', name: 'TechCorp Solutions', industry: 'Technology', location: 'Mumbai', duration: '2w', website: 'https://techcorp.com', personName: 'Rajesh Kumar', email: 'hr@techcorp.com', mobile: '9876543210' },
          { id: '2', name: 'DataFlow Systems', industry: 'Data Analytics', location: 'Bangalore', duration: '2w', website: 'https://dataflow.com', personName: 'Priya Sharma', email: 'contact@dataflow.com', mobile: '9876543211' },
          { id: '3', name: 'CloudTech Innovations', industry: 'Cloud Computing', location: 'Hyderabad', duration: '2w', website: 'https://cloudtech.com', personName: 'Amit Patel', email: 'info@cloudtech.com', mobile: '9876543212' },
          
          // 4-week companies
          { id: '4', name: 'GreenGrid Solutions', industry: 'Energy', location: 'Delhi', duration: '4w', website: 'https://greengrid.com', personName: 'Sneha Singh', email: 'projects@greengrid.com', mobile: '9876543213' },
          { id: '5', name: 'FinTech Dynamics', industry: 'Financial Technology', location: 'Pune', duration: '4w', website: 'https://fintech.com', personName: 'Rahul Verma', email: 'careers@fintech.com', mobile: '9876543214' },
          { id: '6', name: 'HealthTech Solutions', industry: 'Healthcare Technology', location: 'Chennai', duration: '4w', website: 'https://healthtech.com', personName: 'Dr. Anjali Rao', email: 'hr@healthtech.com', mobile: '9876543215' },
          
          // 6-month companies
          { id: '7', name: 'AI Research Labs', industry: 'Artificial Intelligence', location: 'Bangalore', duration: '6m', website: 'https://airesearch.com', personName: 'Dr. Vikram Singh', email: 'research@airesearch.com', mobile: '9876543216' },
          { id: '8', name: 'Blockchain Ventures', industry: 'Blockchain Technology', location: 'Mumbai', duration: '6m', website: 'https://blockchain.com', personName: 'Arjun Mehta', email: 'info@blockchain.com', mobile: '9876543217' },
          { id: '9', name: 'Cybersecurity Pro', industry: 'Cybersecurity', location: 'Delhi', duration: '6m', website: 'https://cybersec.com', personName: 'Neha Gupta', email: 'security@cybersec.com', mobile: '9876543218' },
        ]
        setCompanies(mockCompanies)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = companies.filter((company) => {
    if (durationFilter !== "all" && company.duration !== durationFilter) return false
    if (industryFilter && company.industry !== industryFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = [company.name, company.industry, company.location, company.personName].join(" ").toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })

  // Calculate statistics
  const stats = {
    total: companies.length,
    byDuration: {
      "2w": companies.filter(c => c.duration === "2w").length,
      "4w": companies.filter(c => c.duration === "4w").length,
      "6m": companies.filter(c => c.duration === "6m").length
    },
    byIndustry: companies.reduce((acc, c) => {
      acc[c.industry] = (acc[c.industry] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2 Weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">{stats.byDuration["2w"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">4 Weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-600">{stats.byDuration["4w"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-orange-600">{stats.byDuration["6m"]}</div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Directory</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} of {companies.length} companies
            {filtered.length !== companies.length && (
              <span className="ml-2 text-blue-600">
                (Filtered by: {[
                  durationFilter !== "all" && `${durationFilter === "2w" ? "2 Weeks" : durationFilter === "4w" ? "4 Weeks" : "6 Months"}`,
                  industryFilter && `Industry: ${industryFilter}`,
                  search && `Search: "${search}"`
                ].filter(Boolean).join(", ")})
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={durationFilter === "all" ? "default" : "outline"} onClick={() => setDurationFilter("all")}>
              All Durations
            </Button>
            <Button size="sm" variant={durationFilter === "2w" ? "default" : "outline"} onClick={() => setDurationFilter("2w")}>
              2 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "4w" ? "default" : "outline"} onClick={() => setDurationFilter("4w")}>
              4 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "6m" ? "default" : "outline"} onClick={() => setDurationFilter("6m")}>
              6 Months
            </Button>
            {(durationFilter !== "all" || industryFilter || search) && (
              <Button size="sm" variant="secondary" onClick={() => {
                setDurationFilter("all")
                setIndustryFilter("")
                setSearch("")
              }}>
                Clear All Filters
              </Button>
            )}
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Industry</span>
              <select
                className="h-8 rounded border bg-background px-2 text-sm"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="">All Industries</option>
                {Object.keys(stats.byIndustry).map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Search</span>
              <input
                className="h-8 w-full rounded border bg-background px-2 text-sm"
                placeholder="Company / Industry / Location / Contact"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Website</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Loading companies...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No companies found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{company.location}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          company.duration === "2w" ? "bg-blue-100 text-blue-800" :
                          company.duration === "4w" ? "bg-purple-100 text-purple-800" :
                          "bg-orange-100 text-orange-800"
                        }`}>
                          {company.duration === "2w" ? "2 Weeks" : company.duration === "4w" ? "4 Weeks" : "6 Months"}
                        </span>
                      </TableCell>
                      <TableCell>{company.personName}</TableCell>
                      <TableCell>
                        <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                          {company.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={`tel:${company.mobile}`} className="text-blue-600 hover:underline">
                          {company.mobile}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompanySubmissionsTable() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [durationFilter, setDurationFilter] = useState<"all" | "2w" | "4w" | "6m" | "1y">("all")
  const { toast } = useToast()

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      setLoading(true)
      const data = await listCompanySubmissions()
      setSubmissions(data)
    } catch (error) {
      console.error('Error loading company submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function approve(id: string) {
    try {
      const s = getSession()
      const approvedBy = s?.type === "coordinator" ? s.name : s?.type === "admin" ? s.name : "TNP Coordinator"
      await approveCompanySubmission(id, approvedBy)
      toast({ title: "Company approved", description: "Company has been added to the directory." })
      loadSubmissions()
    } catch (error) {
      toast({ title: "Approval failed", description: "Failed to approve company submission.", variant: "destructive" })
    }
  }

  async function reject(id: string) {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return
    
    try {
      const s = getSession()
      const rejectedBy = s?.type === "coordinator" ? s.name : s?.type === "admin" ? s.name : "TNP Coordinator"
      await rejectCompanySubmission(id, rejectedBy, reason)
      toast({ title: "Company rejected", description: "Company submission has been rejected." })
      loadSubmissions()
    } catch (error) {
      toast({ title: "Rejection failed", description: "Failed to reject company submission.", variant: "destructive" })
    }
  }

  const filtered = submissions.filter((submission) => {
    if (statusFilter !== "all" && submission.status !== statusFilter) return false
    if (durationFilter !== "all" && submission.duration !== durationFilter) return false
    if (search) {
      const s = search.toLowerCase()
      const hay = [submission.companyName, submission.industry, submission.location, submission.personName].join(" ").toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  })

  // Calculate statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
    byDuration: {
      "2w": submissions.filter(s => s.duration === "2w").length,
      "4w": submissions.filter(s => s.duration === "4w").length,
      "6m": submissions.filter(s => s.duration === "6m").length,
      "1y": submissions.filter(s => s.duration === "1y").length
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Submissions</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {filtered.length} of {submissions.length} submissions
            {filtered.length !== submissions.length && (
              <span className="ml-2 text-blue-600">
                (Filtered by: {[
                  statusFilter !== "all" && `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
                  durationFilter !== "all" && `${durationFilter === "2w" ? "2 Weeks" : durationFilter === "4w" ? "4 Weeks" : durationFilter === "6m" ? "6 Months" : "1 Year"}`,
                  search && `Search: "${search}"`
                ].filter(Boolean).join(", ")})
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>
              All Status
            </Button>
            <Button size="sm" variant={statusFilter === "pending" ? "default" : "outline"} onClick={() => setStatusFilter("pending")}>
              Pending
            </Button>
            <Button size="sm" variant={statusFilter === "approved" ? "default" : "outline"} onClick={() => setStatusFilter("approved")}>
              Approved
            </Button>
            <Button size="sm" variant={statusFilter === "rejected" ? "default" : "outline"} onClick={() => setStatusFilter("rejected")}>
              Rejected
            </Button>
            <Button size="sm" variant={durationFilter === "all" ? "default" : "outline"} onClick={() => setDurationFilter("all")}>
              All Durations
            </Button>
            <Button size="sm" variant={durationFilter === "2w" ? "default" : "outline"} onClick={() => setDurationFilter("2w")}>
              2 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "4w" ? "default" : "outline"} onClick={() => setDurationFilter("4w")}>
              4 Weeks
            </Button>
            <Button size="sm" variant={durationFilter === "6m" ? "default" : "outline"} onClick={() => setDurationFilter("6m")}>
              6 Months
            </Button>
            <Button size="sm" variant={durationFilter === "1y" ? "default" : "outline"} onClick={() => setDurationFilter("1y")}>
              1 Year
            </Button>
            {(statusFilter !== "all" || durationFilter !== "all" || search) && (
              <Button size="sm" variant="secondary" onClick={() => {
                setStatusFilter("all")
                setDurationFilter("all")
                setSearch("")
              }}>
                Clear All Filters
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Search</span>
            <input
              className="h-8 w-full rounded border bg-background px-2 text-sm"
              placeholder="Company / Industry / Location / Contact"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                      Loading submissions...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground">
                      No submissions found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.companyName}</TableCell>
                      <TableCell>{submission.industry}</TableCell>
                      <TableCell>{submission.location}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          submission.duration === "2w" ? "bg-blue-100 text-blue-800" :
                          submission.duration === "4w" ? "bg-purple-100 text-purple-800" :
                          submission.duration === "6m" ? "bg-orange-100 text-orange-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {submission.duration === "2w" ? "2 Weeks" : 
                           submission.duration === "4w" ? "4 Weeks" : 
                           submission.duration === "6m" ? "6 Months" : "1 Year"}
                        </span>
                      </TableCell>
                      <TableCell>{submission.personName || "-"}</TableCell>
                      <TableCell>{submission.email || "-"}</TableCell>
                      <TableCell>{submission.mobile || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          submission.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          submission.status === "approved" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{submission.studentId}</TableCell>
                      <TableCell>{fmtDate(submission.submittedAt)}</TableCell>
                      <TableCell>
                        {submission.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => approve(submission.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => reject(submission.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {submission.status === "approved" && (
                          <span className="text-sm text-green-600">Approved by {submission.approvedBy}</span>
                        )}
                        {submission.status === "rejected" && (
                          <span className="text-sm text-red-600">Rejected by {submission.rejectedBy}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
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
  const role = s?.type === "admin" ? "admin" : s?.type === "faculty" ? "faculty" : s?.type === "dean" ? "dean" : s?.type === "coordinator" ? "coordinator" : "faculty"

  return (
    <div className="bg-white min-h-svh flex flex-col">
      <SiteHeader />
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Welcome {s?.type === "faculty" ? s.name : s?.type === "coordinator" ? "TNP Coordinator" : "Faculty"}
                  </h1>
                  <p className="text-gray-600">
                    Use the menu to view registered students and approve internship applications. Role:{" "}
                    <span className="font-semibold text-blue-600 capitalize">{role}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="text-blue-600 text-xl">👨‍🏫</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">FACULTY</div>
                    <div className="text-xs text-gray-500 capitalize">{role}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Content */}
        {tab === "students" && <StudentsTable />}
        {tab === "approvals" && <ApprovalsTable />}
        {tab === "reports" && <ReportsTable />}
        {tab === "companies" && (role === "coordinator" || role === "admin") && <CompaniesTable />}
        {tab === "company-submissions" && (role === "coordinator" || role === "admin") && <CompanySubmissionsTable />}
        {tab === "admin" && role === "admin" && <AdminPanel />}

        {/* Quick Actions Section */}
        {tab === "home" && (
          <div className="mb-8">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Button asChild className="h-16 flex flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                    <a href="/faculty?tab=students">
                      <div className="text-lg">👥</div>
                      <div className="text-sm font-medium">View Students</div>
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 border-blue-200 hover:bg-blue-50">
                    <a href="/faculty?tab=approvals">
                      <div className="text-lg">📋</div>
                      <div className="text-sm font-medium">Review Applications</div>
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-16 flex flex-col gap-2 border-green-200 hover:bg-green-50">
                    <a href="/faculty?tab=reports">
                      <div className="text-lg">📊</div>
                      <div className="text-sm font-medium">View Reports</div>
                    </a>
                  </Button>
                  {(role === "coordinator" || role === "admin") && (
                    <Button asChild variant="outline" className="h-16 flex flex-col gap-2 border-purple-200 hover:bg-purple-50">
                      <a href="/faculty?tab=companies">
                        <div className="text-lg">🏢</div>
                        <div className="text-sm font-medium">Company Directory</div>
                      </a>
                    </Button>
                  )}
                  {(role === "coordinator" || role === "admin") && (
                    <Button asChild variant="outline" className="h-16 flex flex-col gap-2 border-orange-200 hover:bg-orange-50">
                      <a href="/faculty?tab=company-submissions">
                        <div className="text-lg">📝</div>
                        <div className="text-sm font-medium">Company Submissions</div>
                      </a>
                    </Button>
                  )}
                  {role === "admin" && (
                    <Button asChild variant="outline" className="h-16 flex flex-col gap-2 border-red-200 hover:bg-red-50">
                      <a href="/faculty?tab=admin">
                        <div className="text-lg">⚙️</div>
                        <div className="text-sm font-medium">Admin Panel</div>
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

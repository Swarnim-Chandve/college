"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getSession } from "@/lib/auth-new"
import {
  getStudentProfileByStudentId,
  searchCompaniesByName,
  getCompanyById,
  createInternshipApplication,
  createJoining2w,
  createJoining4w,
  createJoining6m,
  createJoining1y,
  upsertStudentProfile,
  findRollByStudentId,
} from "@/lib/server-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toISOFromInput, diffDaysInclusive } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"
// Removed separate dropdown; using a single input with datalist suggestions

const durationDays: Record<string, number> = {
  "2w": 14,
  "4w": 28,
  "6m": 180, // approx for validation
  "1y": 365, // approx for validation
}

export default function InternshipFormPage() {
  const params = useParams<{ duration: string }>()
  const { toast } = useToast()
  const duration = params.duration as "2w" | "4w" | "6m" | "1y"
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // Step 1
  const [query, setQuery] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  // Step 2
  const [companyId, setCompanyId] = useState<string>("")
  const [company, setCompany] = useState<any>(null)
  
  useEffect(() => {
    if (companyId) {
      getCompanyById(companyId).then(c => setCompany(c))
    } else {
      setCompany(null)
    }
  }, [companyId])
  // Step 3
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const totalDays = from && to ? diffDaysInclusive(toISOFromInput(from), toISOFromInput(to)) : 0

  useEffect(() => {
    const s = getSession()
    if (s?.type === "student") {
      getStudentProfileByStudentId(s.studentId || '').then(p => setProfile(p))
    }
    loadCompanies()
  }, [])

  async function loadCompanies() {
    const base = await searchCompaniesByName("")
    const sorted = [...base].sort((a, b) => a.name.localeCompare(b.name))
    setAllCompanies(sorted)
    setCompanies(sorted)
  }

  // Live filter as user types
  useEffect(() => {
    search()
  }, [query])

  function search() {
    const s = query.trim().toLowerCase()
    if (!s) {
      setCompanies(allCompanies)
      return
    }
    setCompanies(allCompanies.filter((c) => c.name.toLowerCase().includes(s)))
  }

  function go() {
    const exact = allCompanies.find((c) => c.name.toLowerCase() === query.trim().toLowerCase())
    if (exact) setCompanyId(exact.id)
    search()
  }

  function selectCompany(id: string) {
    setCompanyId(id)
  }

  async function submit() {
    if (!profile) {
      // Try to auto-create a minimal profile from roll list and session
      const s = getSession()
      const sid = s?.studentId
      if (!sid) {
        toast({ title: "Profile missing", description: "Please complete registration and try again.", variant: "destructive" as any })
        return
      }
      try {
        const roll = await findRollByStudentId(sid)
        await upsertStudentProfile({
          studentId: sid,
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
        const p = await getStudentProfileByStudentId(sid)
        setProfile(p)
      } catch (e) {
        toast({ title: "Profile missing", description: "Please complete registration and try again.", variant: "destructive" as any })
        return
      }
    }
    if (!company) {
      toast({ title: "No company selected", description: "Choose a company from list or dropdown.", variant: "destructive" as any })
      return
    }
    if (!from || !to) {
      toast({ title: "Dates required", description: "Select From and To dates.", variant: "destructive" as any })
      return
    }
    const required = durationDays[duration]
    if (totalDays < required) {
      toast({ title: "Insufficient duration", description: `Total days must be at least ${required} for this internship type.`, variant: "destructive" as any })
      return
    }
    
    setLoading(true)
    try {
      // Create application in the appropriate joining table based on duration
      if (duration === "2w") {
        await createJoining2w({
          studentId: profile.studentId,
          company: company.name,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "4w") {
        await createJoining4w({
          studentId: profile.studentId,
          company: company.name,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "6m") {
        await createJoining6m({
          studentId: profile.studentId,
          company: company.name,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "1y") {
        await createJoining1y({
          studentId: profile.studentId,
          company: company.name,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      }
      
      toast({ title: "Application submitted", description: "Your IRF is pending approval." })
      setFrom("")
      setTo("")
    } catch (error) {
      toast({ title: "Submission failed", description: "Failed to submit application. Please try again.", variant: "destructive" as any })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Internship Application — {duration === "2w" ? "2 Weeks" : duration === "4w" ? "4 Weeks" : "6 Months"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="font-medium">{profile?.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Student ID</div>
              <div className="font-medium">{profile?.studentId}</div>
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
            <div>
              <div className="text-xs text-muted-foreground">Academic Year</div>
              <div className="font-medium">{profile?.year}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 1: Company Search</h4>
            <div className="flex gap-2">
              <Input
                list="companyList"
                placeholder="Type a company name (A–Z suggestions)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") go()
                }}
              />
              <datalist id="companyList">
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <Button onClick={go}>Go</Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Sector</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => selectCompany(c.id)}
                    >
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.address}</TableCell>
                      <TableCell>{c.personName}</TableCell>
                      <TableCell>{c.designation}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.mobile}</TableCell>
                      <TableCell>{c.state}</TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>{c.sector}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 2: Company Details</h4>
            {!company && <p className="text-sm text-muted-foreground">Select a company from Step 1 to auto-fill.</p>}
            {company && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Company Name</Label>
                  <Input value={company.name} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Company Sector</Label>
                  <Input value={company.sector} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Person Name</Label>
                  <Input value={company.personName} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Designation</Label>
                  <Input value={company.designation} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input value={company.mobile} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={company.email} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input value={company.state} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input value={company.city} readOnly />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label>Company Address</Label>
                  <Input value={company.address} readOnly />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 3: Internship Duration</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>From Date</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>To Date</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Total Days</Label>
                <Input value={totalDays ? String(totalDays) : ""} readOnly />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Required days: {duration === "2w" ? "14" : duration === "4w" ? "28" : duration === "6m" ? "180 (approx)" : "365 (approx)"}.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

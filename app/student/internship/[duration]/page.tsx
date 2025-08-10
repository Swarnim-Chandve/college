"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { getSession } from "@/lib/auth"
import {
  getStudentProfileByStudentId,
  searchCompaniesByName,
  getCompanyById,
  createInternshipApplication,
} from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toISOFromInput, diffDaysInclusive } from "@/lib/date"
import { useToast } from "@/hooks/use-toast"

const durationDays: Record<string, number> = {
  "2w": 14,
  "4w": 28,
  "6m": 180, // approx for validation
}

export default function InternshipFormPage() {
  const params = useParams<{ duration: string }>()
  const { toast } = useToast()
  const duration = params.duration as "2w" | "4w" | "6m"
  const [profile, setProfile] = useState<any>(null)

  // Step 1
  const [query, setQuery] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  // Step 2
  const [companyId, setCompanyId] = useState<string>("")
  const company = useMemo(() => (companyId ? getCompanyById(companyId) : undefined), [companyId])
  // Step 3
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const totalDays = from && to ? diffDaysInclusive(toISOFromInput(from), toISOFromInput(to)) : 0

  useEffect(() => {
    const s = getSession()
    if (s?.type === "student") {
      const p = getStudentProfileByStudentId(s.studentId)
      setProfile(p)
    }
    setCompanies(searchCompaniesByName(""))
  }, [])

  function search() {
    setCompanies(searchCompaniesByName(query))
  }

  function selectCompany(id: string) {
    setCompanyId(id)
  }

  function submit() {
    if (!profile) {
      toast({ description: "Profile missing." })
      return
    }
    if (!company) {
      toast({ description: "Select a company." })
      return
    }
    if (!from || !to) {
      toast({ description: "Select From and To dates." })
      return
    }
    const required = durationDays[duration]
    if (totalDays !== required) {
      toast({ description: `Total days must be exactly ${required} for this internship type.` })
      return
    }
    createInternshipApplication({
      studentId: profile.studentId,
      duration,
      companyId: company.id,
      companySnapshot: {
        name: company.name,
        sector: company.sector,
        personName: company.personName,
        designation: company.designation,
        mobile: company.mobile,
        email: company.email,
        state: company.state,
        city: company.city,
        address: company.address,
      },
      fromDate: toISOFromInput(from),
      toDate: toISOFromInput(to),
      totalDays,
      status: "pending",
      approvals: {},
    })
    toast({ description: "Application submitted." })
    setFrom("")
    setTo("")
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
            <div>
              <div className="text-xs text-muted-foreground">Academic Year</div>
              <div className="font-medium">{profile?.academicYear}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Step 1: Company Search</h4>
            <div className="flex gap-2">
              <Input placeholder="Search by company name" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button onClick={search}>Search</Button>
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
              Required days: {duration === "2w" ? "14" : duration === "4w" ? "28" : "180 (approx)"}.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={submit}>Submit Application</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

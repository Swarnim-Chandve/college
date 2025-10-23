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
  createCompanySubmission,
  getCompaniesByDuration,
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
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [submittingCompany, setSubmittingCompany] = useState(false)

  // Step 1
  const [query, setQuery] = useState("")
  const [companies, setCompanies] = useState<any[]>([])
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  // Step 2
  const [companyId, setCompanyId] = useState<string>("")
  const [company, setCompany] = useState<any>(null)
  
  // Removed the useEffect that was causing conflicts with company selection
  // Step 3
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [internshipRole, setInternshipRole] = useState("")
  const totalDays = from && to ? diffDaysInclusive(toISOFromInput(from), toISOFromInput(to)) : 0

  // Company submission form
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    industry: "",
    location: "",
    website: "",
    personName: "",
    email: "",
    mobile: "",
    address: "",
    state: "",
    city: "",
    sector: "",
    description: ""
  })

  useEffect(() => {
    const s = getSession()
    if (s?.type === "student") {
      getStudentProfileByStudentId(s.studentId || '').then(p => setProfile(p))
    }
    loadCompanies()
  }, [])

  useEffect(() => {
    if (profile) {
      loadCompanies()
    }
  }, [profile, duration])

  async function loadCompanies() {
    try {
      // Load companies from the API endpoint (Excel data)
      const response = await fetch('/api/companies')
      const apiCompanies = await response.json()
      
      // Filter companies by duration
      const filteredCompanies = apiCompanies.filter(company => {
        // Check if company duration matches the current page duration
        return company.duration === duration
      })
      
      // Further filter by branch if available
      const session = getSession()
      const branch = session?.type === "student" ? profile?.branch : undefined
      
      let finalCompanies = filteredCompanies
      if (branch) {
        // Filter by industry/sector that matches the branch
        finalCompanies = filteredCompanies.filter(company => {
          const industry = (company.industry || '').toLowerCase()
          const sector = (company.sector || '').toLowerCase()
          const branchLower = branch.toLowerCase()
          
          return industry.includes(branchLower) || 
                 sector.includes(branchLower) ||
                 branchLower.includes(industry) ||
                 branchLower.includes(sector)
        })
      }
      
      const sorted = finalCompanies.sort((a, b) => a.name.localeCompare(b.name))
      setAllCompanies(sorted)
      // Show only first 10 companies by default
      setCompanies(sorted.slice(0, 10))
    } catch (error) {
      console.error('Error loading companies:', error)
      // Fallback to database companies
      const base = await searchCompaniesByName("")
      const sorted = [...base].sort((a, b) => a.name.localeCompare(b.name))
      setAllCompanies(sorted)
      // Show only first 10 companies by default
      setCompanies(sorted.slice(0, 10))
    }
  }

  // Live filter as user types
  useEffect(() => {
    search()
  }, [query])

  function search() {
    const s = query.trim().toLowerCase()
    if (!s) {
      // When no search query, show only first 10 companies
      setCompanies(allCompanies.slice(0, 10))
      return
    }
    // When searching, show all matching results
    setCompanies(allCompanies.filter((c) => c.name.toLowerCase().includes(s)))
  }

  function go() {
    const exact = allCompanies.find((c) => c.name.toLowerCase() === query.trim().toLowerCase())
    if (exact) {
      setCompanyId(exact.id)
      setCompany(exact)
    }
    search()
  }

  function selectCompany(id: string) {
    console.log('Selecting company with ID:', id)
    // Find the company from the companies array and set it directly
    const selectedCompany = allCompanies.find(c => c.id === id)
    if (selectedCompany) {
      console.log('Found company:', selectedCompany.name)
      setCompanyId(id)
      setCompany(selectedCompany)
      toast({ title: "Company selected", description: `${selectedCompany.name} has been selected.` })
    } else {
      console.log('Company not found with ID:', id)
      toast({ title: "Company not found", description: "The selected company could not be found.", variant: "destructive" as any })
    }
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
    if (!internshipRole.trim()) {
      toast({ title: "Internship role required", description: "Please specify your role in the internship.", variant: "destructive" as any })
      return
    }
    const required = durationDays[duration]
    if (totalDays < required) {
      toast({ title: "Insufficient duration", description: `Total days must be at least ${required} for this internship type.`, variant: "destructive" as any })
      return
    }
    
    setLoading(true)
    try {
      console.log('Submitting application with data:', {
        studentId: profile.studentId,
        company: company.name,
        internshipRole: internshipRole,
        duration: duration,
        from: from,
        to: to,
        totalDays: totalDays
      })
      
      // Create application in the appropriate joining table based on duration
      if (duration === "2w") {
        await createJoining2w({
          studentId: profile.studentId,
          company: company.name,
          internshipRole: internshipRole,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "4w") {
        await createJoining4w({
          studentId: profile.studentId,
          company: company.name,
          internshipRole: internshipRole,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "6m") {
        await createJoining6m({
          studentId: profile.studentId,
          company: company.name,
          internshipRole: internshipRole,
          startDate: new Date(toISOFromInput(from)),
          endDate: new Date(toISOFromInput(to)),
          totalDays,
          status: "pending",
        })
      } else if (duration === "1y") {
        await createJoining1y({
          studentId: profile.studentId,
          company: company.name,
          internshipRole: internshipRole,
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

  async function submitCompany() {
    console.log('submitCompany called, profile:', profile)
    
    if (!profile) {
      console.log('No profile found')
      toast({ title: "Profile missing", description: "Please complete registration and try again.", variant: "destructive" as any })
      return
    }
    
    if (!companyForm.companyName || !companyForm.industry || !companyForm.location) {
      console.log('Required fields missing:', { companyName: companyForm.companyName, industry: companyForm.industry, location: companyForm.location })
      toast({ title: "Required fields missing", description: "Please fill in company name, industry, and location.", variant: "destructive" as any })
      return
    }
    
    console.log('Submitting company with data:', {
      studentId: profile.studentId,
      companyName: companyForm.companyName,
      industry: companyForm.industry,
      location: companyForm.location,
      duration: duration,
      website: companyForm.website,
      personName: companyForm.personName,
      email: companyForm.email,
      mobile: companyForm.mobile,
      address: companyForm.address,
      state: companyForm.state,
      city: companyForm.city,
      sector: companyForm.sector,
      description: companyForm.description
    })
    
    setSubmittingCompany(true)
    try {
      const result = await createCompanySubmission({
        studentId: profile.studentId,
        companyName: companyForm.companyName,
        industry: companyForm.industry,
        location: companyForm.location,
        duration: duration,
        website: companyForm.website,
        personName: companyForm.personName,
        email: companyForm.email,
        mobile: companyForm.mobile,
        address: companyForm.address,
        state: companyForm.state,
        city: companyForm.city,
        sector: companyForm.sector,
        description: companyForm.description
      })
      
      console.log('Company submission successful:', result)
      toast({ title: "Company submitted", description: "Your company submission is pending TNP approval." })
      setShowCompanyForm(false)
      setCompanyForm({
        companyName: "",
        industry: "",
        location: "",
        website: "",
        personName: "",
        email: "",
        mobile: "",
        address: "",
        state: "",
        city: "",
        sector: "",
        description: ""
      })
    } catch (error) {
      console.error('Company submission error:', error)
      toast({ title: "Submission failed", description: "Failed to submit company. Please try again.", variant: "destructive" as any })
    } finally {
      setSubmittingCompany(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Internship Application — {duration === "2w" ? "2 Weeks" : duration === "4w" ? "4 Weeks" : duration === "6m" ? "6 Months" : "1 Year"}
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
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        companyId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        selectCompany(c.id)
                      }}
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

          {/* Company Submission Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Can't find your company?</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCompanyForm(!showCompanyForm)}
              >
                {showCompanyForm ? "Hide Form" : "Submit New Company"}
              </Button>
            </div>
            
            {showCompanyForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submit New Company for Approval</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submit a new company for TNP approval. Once approved, it will be available for all students.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={companyForm.companyName}
                        onChange={(e) => setCompanyForm({...companyForm, companyName: e.target.value})}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="industry">Industry *</Label>
                      <Input
                        id="industry"
                        value={companyForm.industry}
                        onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})}
                        placeholder="e.g., Technology, Manufacturing, Healthcare"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={companyForm.location}
                        onChange={(e) => setCompanyForm({...companyForm, location: e.target.value})}
                        placeholder="e.g., Mumbai, Bangalore, Delhi"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companyForm.website}
                        onChange={(e) => setCompanyForm({...companyForm, website: e.target.value})}
                        placeholder="https://company.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="personName">Contact Person</Label>
                      <Input
                        id="personName"
                        value={companyForm.personName}
                        onChange={(e) => setCompanyForm({...companyForm, personName: e.target.value})}
                        placeholder="Name of contact person"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mobile">Mobile</Label>
                      <Input
                        id="mobile"
                        value={companyForm.mobile}
                        onChange={(e) => setCompanyForm({...companyForm, mobile: e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={companyForm.state}
                        onChange={(e) => setCompanyForm({...companyForm, state: e.target.value})}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={companyForm.city}
                        onChange={(e) => setCompanyForm({...companyForm, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sector">Sector</Label>
                      <Input
                        id="sector"
                        value={companyForm.sector}
                        onChange={(e) => setCompanyForm({...companyForm, sector: e.target.value})}
                        placeholder="Business sector"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                      placeholder="Complete address"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={companyForm.description}
                      onChange={(e) => setCompanyForm({...companyForm, description: e.target.value})}
                      placeholder="Brief description of the company"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCompanyForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={submitCompany} 
                      disabled={submittingCompany}
                    >
                      {submittingCompany ? "Submitting..." : "Submit Company"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
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
                  <Label>Internship Role</Label>
                  <Input 
                    placeholder="e.g., Electrical Engineer, Software Developer, Data Analyst"
                    value={internshipRole}
                    onChange={(e) => setInternshipRole(e.target.value)}
                  />
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

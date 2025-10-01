"use client"

import { useEffect, useState } from "react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  findRollByStudentId,
  getStudentProfileByStudentId,
  upsertStudentProfile,
} from "@/lib/db"
import { registerStudent, getUserByStudentId } from "@/lib/auth-new"

export default function RegistrationPage() {
  const { toast } = useToast()
  const [studentId, setStudentId] = useState("")
  const [fetched, setFetched] = useState(false)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)

  const [degree, setDegree] = useState("")
  const [branch, setBranch] = useState("")
  const [name, setName] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [semester, setSemester] = useState("")
  const [section, setSection] = useState("")
  const [academicYear, setAcademicYear] = useState("2024-25")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")

  useEffect(() => {
    // prefill latest academic year
    setAcademicYear("2024-25")
  }, [])

  function fetchDetails() {
    if (!studentId.trim()) {
      toast({ title: "Student ID required", description: "Enter Student ID number.", variant: "destructive" as any })
      return
    }
    const roll = findRollByStudentId(studentId.trim())
    if (!roll) {
      toast({ title: "Not found", description: "No record found in roll list. Please verify Student ID.", variant: "destructive" as any })
      return
    }
    // Check if user already exists in new auth system
    const existingUser = await getUserByStudentId(roll.studentId)
    if (existingUser) {
      toast({ description: "You are already registered.", title: "Registration Exists", variant: "destructive" as any })
      setFetched(true)
      // We'll need to get profile data from the roll list since we don't have it in the new system yet
      setDegree(roll.degree)
      setBranch(roll.branch)
      setName(roll.name)
      setRollNo(roll.rollNo)
      setSemester(roll.semester)
      setSection(roll.section)
      setAcademicYear(roll.academicYear)
      setEmail(existingUser.email)
      return
    }
    setDegree(roll.degree)
    setBranch(roll.branch)
    setName(roll.name)
    setRollNo(roll.rollNo)
    setSemester(roll.semester)
    setSection(roll.section)
    setAcademicYear(roll.academicYear)
    setFetched(true)
  }

  async function onRegister() {
    if (!fetched) {
      toast({ title: "Action needed", description: "Fetch details before registering.", variant: "destructive" as any })
      return
    }
    if (!email || !mobile) {
      toast({ title: "Missing fields", description: "Please fill E-Mail ID and Mobile Number.", variant: "destructive" as any })
      return
    }
    if (!agree) {
      toast({ title: "Agreement required", description: "You must agree to the terms and conditions.", variant: "destructive" as any })
      return
    }
    setLoading(true)
    
    try {
      // Register student with new auth system
      const result = await registerStudent({
        email,
        name,
        studentId: studentId.trim()
      })
      
      if (result.success) {
        // Also create profile in legacy system for now (we'll migrate this later)
        upsertStudentProfile({
          studentId: studentId.trim(),
          email,
          mobile,
          degree,
          branch,
          name,
          rollNo,
          semester,
          section,
          academicYear,
          pictureUrl: "/diverse-student-profiles.png",
        })
        
        toast({ 
          title: "Registration Complete", 
          description: `Password sent to ${email}. Check your email for login credentials.` 
        })
      } else {
        toast({ 
          title: "Registration Failed", 
          description: result.error || "Unknown error occurred",
          variant: "destructive" as any 
        })
      }
    } catch (error) {
      toast({ 
        title: "Registration Error", 
        description: "Failed to register. Please try again.",
        variant: "destructive" as any 
      })
    }
    
    setLoading(false)
  }

  const alreadyHasLogin = studentId ? false : false // We'll check this async later
  const alreadyHasProfile = studentId ? !!getStudentProfileByStudentId(studentId) : false

  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Registration Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID Number</Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. GHRCE2025CSE001"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full md:w-auto" onClick={fetchDetails}>
                  Fetch Details
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input value={degree} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={branch} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Roll No</Label>
                <Input value={rollNo} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input value={semester} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={section} readOnly />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>E-Mail ID</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@domain.com" />
                <p className="text-xs text-muted-foreground">No domain restriction for students.</p>
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(!!v)} />
              <Label htmlFor="agree" className="text-sm">
                I agree to the terms and conditions
              </Label>
            </div>
            {alreadyHasLogin && (
              <div className="rounded-md border bg-muted p-3 text-sm">You are already registered.</div>
            )}
            <div className="flex justify-end">
              {alreadyHasLogin || alreadyHasProfile ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!studentId || !email) {
                      toast({ title: "Missing info", description: "Enter Student ID and Email to resend password.", variant: "destructive" as any })
                      return
                    }
                    const newPwd = generateStudentPassword()
                    setStuLoginForStudent(studentId.trim(), email, newPwd)
                    await sendEmail({
                      to: email,
                      subject: "GHRCE Portal Password Reset",
                      text: `Hello ${name},\n\nYour new password is ${newPwd}.`,
                    })
                    toast({ title: "Password Sent", description: `We emailed your new password.` })
                  }}
                >
                  Resend Password
                </Button>
              ) : (
                <Button onClick={onRegister} disabled={loading}>
                  {loading ? "Saving..." : "Register"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

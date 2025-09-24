"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { loginStudent, loginFaculty } from "@/lib/auth"
import { getFacultyByEmail, getStuLoginByEmail, setStuLoginForStudent } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [studentEmail, setStudentEmail] = useState("")
  const [studentPassword, setStudentPassword] = useState("")
  const [facEmail, setFacEmail] = useState("")
  const [facEmpId, setFacEmpId] = useState("")
  const [facPassword, setFacPassword] = useState("")
  const [loadingForgot, setLoadingForgot] = useState(false)

  function onStudentLogin() {
    const rec = getStuLoginByEmail(studentEmail.trim())
    if (!rec) {
      router.push("/register")
      return
    }
    const session = loginStudent(studentEmail.trim(), studentPassword.trim())
    if (!session) {
      toast({ title: "Login failed", description: "Invalid student credentials.", variant: "destructive" as any })
      return
    }
    router.push("/student")
  }

  async function onStudentForgot() {
    const rec = getStuLoginByEmail(studentEmail.trim())
    if (!rec) {
      toast({ title: "No account", description: "Email not found.", variant: "destructive" as any })
      return
    }
    setLoadingForgot(true)
    try {
      const newPwd = `GHRCE-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
      setStuLoginForStudent(rec.studentId, rec.email, newPwd)
      await sendEmail({ to: rec.email, subject: "GHRCE Password Reset", text: `Your new password is ${newPwd}` })
      toast({ title: "Password Sent", description: "Check your email for the new password." })
    } finally {
      setLoadingForgot(false)
    }
  }

  function onFacultyLogin() {
    if (!facEmail.trim().toLowerCase().endsWith("@ghrce.com")) {
      toast({ title: "Invalid email", description: "Faculty email must end with @ghrce.com", variant: "destructive" as any })
      return
    }
    const fac = getFacultyByEmail(facEmail.trim())
    if (!fac || (fac.employeeId && fac.employeeId !== facEmpId)) {
      toast({ title: "Login failed", description: "Invalid employee ID or email.", variant: "destructive" as any })
      return
    }
    const session = loginFaculty(facEmail.trim(), facPassword.trim())
    if (!session) {
      toast({ title: "Login failed", description: "Invalid faculty credentials.", variant: "destructive" as any })
      return
    }
    router.push("/faculty")
  }

  async function onFacultyForgot() {
    if (!facEmail.trim().toLowerCase().endsWith("@ghrce.com")) {
      toast({ title: "Invalid email", description: "Faculty email must end with @ghrce.com", variant: "destructive" as any })
      return
    }
    const fac = getFacultyByEmail(facEmail.trim())
    if (!fac || (fac.employeeId && fac.employeeId !== facEmpId)) {
      toast({ title: "Not found", description: "Employee ID or email invalid.", variant: "destructive" as any })
      return
    }
    setLoadingForgot(true)
    try {
      const newPwd = `GHRCE-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
      ;(fac as any).password = newPwd
      await sendEmail({ to: fac.email, subject: "GHRCE Faculty Password Reset", text: `Your new password is ${newPwd}` })
      toast({ title: "Password Sent", description: "Check your email for the new password." })
    } finally {
      setLoadingForgot(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student Login</TabsTrigger>
                <TabsTrigger value="faculty">Faculty Login</TabsTrigger>
              </TabsList>
              <TabsContent value="student" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="s-email">Email</Label>
                  <Input
                    id="s-email"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="s-password">Password</Label>
                    <Button variant="link" className="ml-auto p-0 text-sm" onClick={onStudentForgot} disabled={loadingForgot}>
                      {loadingForgot ? "Sending..." : "Forgot Password"}
                    </Button>
                  </div>
                  <Input
                    id="s-password"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={onStudentLogin}>
                  Submit
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New student?{" "}
                  <Link href="/register" className="underline">
                    Register here
                  </Link>
                </p>
              </TabsContent>
              <TabsContent value="faculty" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="f-email">Email</Label>
                  <Input
                    id="f-email"
                    type="email"
                    value={facEmail}
                    onChange={(e) => setFacEmail(e.target.value)}
                    placeholder="name@ghrce.com"
                  />
                  <p className="text-xs text-muted-foreground">Must end with @ghrce.com</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f-emp">Employee ID</Label>
                  <Input id="f-emp" value={facEmpId} onChange={(e) => setFacEmpId(e.target.value)} placeholder="EMP001" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Label htmlFor="f-password">Password</Label>
                    <Button variant="link" className="ml-auto p-0 text-sm" onClick={onFacultyForgot} disabled={loadingForgot}>
                      {loadingForgot ? "Sending..." : "Forgot Password"}
                    </Button>
                  </div>
                  <Input
                    id="f-password"
                    type="password"
                    value={facPassword}
                    onChange={(e) => setFacPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={onFacultyLogin}>
                  Submit
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

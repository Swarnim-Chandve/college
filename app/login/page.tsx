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
import { loginUser, forgotPassword } from "@/lib/server-actions"
import { setSession } from "@/lib/auth-new"
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

  async function onStudentLogin() {
    if (!studentEmail.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" as any })
      return
    }
    if (!studentEmail.trim().toLowerCase().endsWith("@ghrce.raisoni.net")) {
      toast({ title: "Invalid email", description: "Student email must end with @ghrce.raisoni.net", variant: "destructive" as any })
      return
    }
    if (!studentPassword.trim()) {
      toast({ title: "Password required", description: "Please enter your password.", variant: "destructive" as any })
      return
    }
    
    const session = await loginUser(studentEmail.trim(), studentPassword.trim())
    if (!session) {
      toast({ title: "Login failed", description: "Invalid email or password. Please check your credentials.", variant: "destructive" as any })
      return
    }
    
    // Persist session before redirect
    await setSession(session)

    if (session.type === 'student') {
      router.push("/student")
    } else {
      router.push("/faculty")
    }
  }

  async function onStudentForgot() {
    if (!studentEmail.trim()) {
      toast({ title: "Email required", description: "Please enter your email address to reset password.", variant: "destructive" as any })
      return
    }
    if (!studentEmail.trim().toLowerCase().endsWith("@ghrce.raisoni.net")) {
      toast({ title: "Invalid email", description: "Student email must end with @ghrce.raisoni.net", variant: "destructive" as any })
      return
    }
    
    setLoadingForgot(true)
    try {
      const result = await forgotPassword(studentEmail.trim())
      if (result.success) {
        toast({ 
          title: "Password Reset", 
          description: "Your new password has been sent to your email address. Please check your inbox."
        })
      } else {
        toast({ title: "Error", description: result.error || "Failed to reset password.", variant: "destructive" as any })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset password.", variant: "destructive" as any })
    } finally {
      setLoadingForgot(false)
    }
  }

  async function onFacultyLogin() {
    if (!facEmail.trim().toLowerCase().endsWith("@ghrce.com")) {
      toast({ title: "Invalid email", description: "Faculty email must end with @ghrce.com", variant: "destructive" as any })
      return
    }
    
    const session = await loginUser(facEmail.trim(), facPassword.trim())
    if (!session) {
      toast({ title: "Login failed", description: "Invalid faculty credentials.", variant: "destructive" as any })
      return
    }
    
    // Persist session before redirect
    await setSession(session)

    router.push("/faculty")
  }

  async function onFacultyForgot() {
    if (!facEmail.trim().toLowerCase().endsWith("@ghrce.com")) {
      toast({ title: "Invalid email", description: "Faculty email must end with @ghrce.com", variant: "destructive" as any })
      return
    }
    
    setLoadingForgot(true)
    try {
      const result = await forgotPassword(facEmail.trim())
      if (result.success) {
        toast({ 
          title: "Password Reset", 
          description: "Your new password has been sent to your email address. Please check your inbox."
        })
      } else {
        toast({ title: "Error", description: result.error || "Failed to reset password.", variant: "destructive" as any })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset password.", variant: "destructive" as any })
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

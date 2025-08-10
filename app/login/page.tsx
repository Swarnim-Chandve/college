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
import { getStuLoginByEmail } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [studentEmail, setStudentEmail] = useState("")
  const [studentPassword, setStudentPassword] = useState("")
  const [facEmail, setFacEmail] = useState("")
  const [facPassword, setFacPassword] = useState("")

  function onStudentLogin() {
    const rec = getStuLoginByEmail(studentEmail)
    if (!rec) {
      router.push("/register")
      return
    }
    const session = loginStudent(studentEmail, studentPassword)
    if (!session) {
      toast({ description: "Invalid student credentials." })
      return
    }
    router.push("/student")
  }

  function onFacultyLogin() {
    if (!facEmail.toLowerCase().endsWith("@ghrce.com")) {
      toast({ description: "Faculty email must end with @ghrce.com" })
      return
    }
    const session = loginFaculty(facEmail, facPassword)
    if (!session) {
      toast({ description: "Invalid faculty credentials." })
      return
    }
    router.push("/faculty")
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
                    <Button
                      variant="link"
                      className="ml-auto p-0 text-sm"
                      onClick={() => alert("Forgot password flow is not implemented in demo.")}
                    >
                      Forgot Password
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
                  <div className="flex items-center">
                    <Label htmlFor="f-password">Password</Label>
                    <Button
                      variant="link"
                      className="ml-auto p-0 text-sm"
                      onClick={() => alert("Forgot password flow is not implemented in demo.")}
                    >
                      Forgot Password
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

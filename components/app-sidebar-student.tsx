"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Briefcase, LogOut, CalendarCheck } from "lucide-react"
import { logout } from "@/lib/auth"
import { useEffect, useState } from "react"
import { getSession } from "@/lib/auth"
import { getStudentProfileByStudentId } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function StudentSidebar() {
  const pathname = usePathname()
  const [name, setName] = useState("Student")
  const [picture, setPicture] = useState<string | undefined>()
  useEffect(() => {
    const s = getSession()
    if (s && s.type === "student") {
      const prof = getStudentProfileByStudentId(s.studentId)
      setName(prof?.name ?? "Student")
      setPicture(prof?.pictureUrl)
    }
  }, [])
  const menuActive = (href: string) => pathname === href

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src={picture || "/placeholder.svg"} alt="Student photo" />
            <AvatarFallback>{name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-muted-foreground">Student</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={menuActive("/student")}>
                  <Link href="/student">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/student/internship")}>
                  <Link href="/student/internship/2w">
                    <Briefcase />
                    <span>Internship</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={menuActive("/student/internship/2w")}>
                      <Link href="/student/internship/2w">
                        <CalendarCheck />
                        <span>2 Weeks</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={menuActive("/student/internship/4w")}>
                      <Link href="/student/internship/4w">
                        <CalendarCheck />
                        <span>4 Weeks</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={menuActive("/student/internship/6m")}>
                      <Link href="/student/internship/6m">
                        <CalendarCheck />
                        <span>6 Months</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    logout()
                    window.location.href = "/"
                  }}
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}

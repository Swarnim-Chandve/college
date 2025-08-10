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
  SidebarSeparator,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Home, Users, CheckSquare, Wrench, LogOut, Shield } from "lucide-react"
import { logout, getSession } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function FacultySidebar() {
  const pathname = usePathname()
  const [name, setName] = useState("Faculty")
  const [role, setRole] = useState("faculty")
  useEffect(() => {
    const s = getSession()
    if (s?.type === "faculty") {
      setName(s.email.split("@")[0])
      setRole(s.role)
    }
  }, [])
  const isActive = (href: string) => pathname === href

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs text-muted-foreground capitalize">{role}</div>
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
                <SidebarMenuButton asChild isActive={isActive("/faculty")}>
                  <Link href="/faculty">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/faculty/students")}>
                  <Link href="/faculty?tab=students">
                    <Users />
                    <span>Student List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/faculty/approvals")}>
                  <Link href="/faculty?tab=approvals">
                    <CheckSquare />
                    <span>Internship Approvals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/faculty/admin")}>
                    <Link href="/faculty?tab=admin">
                      <Wrench />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          Role-based controls
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

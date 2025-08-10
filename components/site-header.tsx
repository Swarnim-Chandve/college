"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function NavLinks() {
  return (
    <nav className="hidden items-center gap-6 md:flex">
      <Link href="/" className="text-sm font-medium hover:underline">
        Home
      </Link>
      <div className="relative group">
        <button className="inline-flex items-center gap-1 text-sm font-medium">
          {"GHRCE Repository"}
          <ChevronDown className="h-4 w-4" />
        </button>
        <div className="invisible absolute left-0 z-20 mt-2 min-w-[220px] rounded-md border bg-popover p-2 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
          <Link href="/repository" className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
            Browse Repository
          </Link>
        </div>
      </div>
      <Link href="/register" className="text-sm font-medium hover:underline">
        Portal Registration
      </Link>
      <Link href="/login" className="text-sm font-medium hover:underline">
        Login
      </Link>
    </nav>
  )
}

export default function SiteHeader({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onRoute = () => setOpen(false)
    window.addEventListener("hashchange", onRoute)
    return () => window.removeEventListener("hashchange", onRoute)
  }, [])
  return (
    <header className={cn("w-full border-b bg-background", className)}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <img src="/generic-left-aligned-logo.png" alt="Raisoni mock logo left" className="h-11 w-11 rounded" />
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-base font-semibold">G H Raisoni College of Engineering</span>
            <span className="text-xs text-muted-foreground">Internship Portal</span>
          </div>
        </div>

        <NavLinks />

        <div className="flex items-center gap-4">
          <img src="/generic-tech-logo.png" alt="Raisoni mock logo right" className="h-11 w-11 rounded" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden bg-transparent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{"GHRCE Portal"}</SheetTitle>
              </SheetHeader>
              <Separator className="my-3" />
              <div className="grid gap-2">
                <Link href="/" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                  Home
                </Link>
                <Link href="/repository" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                  Browse Repository
                </Link>
                <Link href="/register" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                  Portal Registration
                </Link>
                <Link href="/login" className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                  Login
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

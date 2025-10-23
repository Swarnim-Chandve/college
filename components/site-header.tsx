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
      <Link href="/" className="text-sm font-medium text-white hover:underline">
        Home
      </Link>
      <div className="relative group">
        <button className="inline-flex items-center gap-1 text-sm font-medium text-white">
          {"GHRCE Repository"}
          <ChevronDown className="h-4 w-4" />
        </button>
        <div className="invisible absolute left-0 z-20 mt-2 min-w-[220px] rounded-md border bg-popover p-2 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
          <Link href="/repository" className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
            Browse Repository
          </Link>
        </div>
      </div>
      <Link href="/register" className="text-sm font-medium text-white hover:underline">
        Portal Registration
      </Link>
      <Link href="/login" className="text-sm font-medium text-white hover:underline">
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
    <div className="w-full">
      {/* Header Section */}
      <header className={cn("w-full bg-white border-4 border-blue-600", className)}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          {/* Left Logo */}
          <div className="flex items-center">
            <img src="/logo.png" alt="G H Raisoni College Logo" className="h-20 w-auto border-0" />
          </div>

          {/* Right Logo */}
          <div className="flex items-center">
            <img src="/logo2.png" alt="Raisoni Education Logo" className="h-20 w-auto border-0" />
          </div>
        </div>
        
        {/* Gradient Separator */}
        <div className="h-1 bg-gradient-to-r from-orange-500 to-purple-600"></div>
      </header>

      {/* Navigation Bar */}
      <nav className="w-full bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <NavLinks />
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="bg-transparent border-white text-white hover:bg-blue-700">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>GHRCE Portal</SheetTitle>
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
      </nav>
    </div>
  )
}

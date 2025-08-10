import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function SiteFooter() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold">Contact</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              G H Raisoni College of Engineering, Nagpur, Maharashtra, India
              <br />
              Phone: +91-XXXXXXXXXX
              <br />
              Email: info@ghrce.edu.in
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/repository" className="hover:underline">
                  Repository
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:underline">
                  Registration
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GHRCE — Internship Portal.
        </p>
      </div>
    </footer>
  )
}

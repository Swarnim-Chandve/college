import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer className="w-full border border-gray-300 bg-white">
      {/* Main Footer Content */}
      <div className="px-6 py-8">
        {/* Institution Name */}
        <h1 className="text-2xl font-bold text-orange-600 mb-4">
          G H Raisoni College of Engineering
        </h1>
        
        {/* Institutional Details */}
        <div className="text-sm text-black mb-4 space-y-1">
          <p>An Empowered Autonomous Institute affiliated to Rashtrasant Tukadoji Maharaj Nagpur University, Nagpur</p>
          <p>Accredited by NAAC with "A++" Grade (3rd Cycle)</p>
          <p>CRPF Gate No. 3, Hingna Road, Digdoh Hills, Nagpur - 440 016 (INDIA)</p>
        </div>
        
        {/* Contact Information */}
        <div className="text-sm text-black mb-6">
          <span>T: </span>
          <span className="text-orange-600">+91 9604787184, 9689903286, 9921008391</span>
          <span className="mx-2">|</span>
          <span>E: </span>
          <span className="text-orange-600">principal.ghrce@raisoni.net</span>
          <span className="mx-2">|</span>
          <span>W: </span>
          <span className="text-orange-600">ghrce.raisoni.net</span>
        </div>
        
        {/* Logo and Locations Row */}
        <div className="flex items-start justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img src="/logo2.png" alt="Raisoni Education Logo" className="h-16 w-auto" />
          </div>
          
          {/* Orange Separator Line */}
          <div className="flex-1 mx-6 mt-3">
            <div className="h-0.5 bg-orange-600"></div>
          </div>
          
          {/* Locations */}
          <div className="text-sm text-black">
            Nagpur | Pune | Jalgaon | Amravati | Pandhurna | Bhandara
          </div>
        </div>
      </div>
      
      {/* Bottom Blue Bar */}
      <div className="bg-blue-600 py-3">
        <div className="text-center text-white text-sm">
          Developed By : Team GHRCE
        </div>
      </div>
    </footer>
  )
}

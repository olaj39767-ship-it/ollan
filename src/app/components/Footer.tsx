import { useState } from "react";

const OllanFooter = () => {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const quickLinks = [
    { label: "Home", href: "/pages/home" },
    { label: "Shop", href: "/" },
    { label: "About Us", href: "/pages/about" },
    { label: "Contact", href: "/pages/contact" },
  ];

  const services = [
    "24/7 Delivery",
    "Consultation",
    "Laboratory",
    "ICU",
    "Patient Ward",
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "#",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/2349040788398",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.535a.5.5 0 0 0 .612.612l5.688-1.471A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.97 0-3.805-.568-5.356-1.55l-.385-.24-3.97 1.026 1.05-3.858-.262-.403A9.956 9.956 0 0 1 2 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 font-sans">
      {/* Top brand bar */}
      <div className="bg-gray-50 px-4 sm:px-8 lg:px-10 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3 py-4">
          <div className="bg-orange-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-serif font-semibold text-base flex-shrink-0">
            O
          </div>
          <div>
            <div className="font-serif text-lg font-semibold text-gray-900">OLLAN PHARMACY</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Committed to care</div>
          </div>
        </div>
        <div className="text-xs text-gray-500">RC 69,342</div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 sm:px-8 lg:px-10 py-10">
        {/* Contact */}
        <div>
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-orange-600 mb-4 pb-2 border-b border-orange-200 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-7 after:h-0.5 after:bg-orange-600">
            Contact Us
          </h4>
          <div className="flex items-start gap-2 mb-3 text-sm text-gray-700">
            <span className="text-orange-400 flex-shrink-0 mt-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span>No. 62 Iwo Road, Opposite Ibadan North East Secretariat, Ibadan, Oyo State, Nigeria</span>
          </div>
          <div className="flex items-start gap-2 mb-3 text-sm text-gray-700">
            <span className="text-orange-400 flex-shrink-0 mt-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18l.19-1.08z" />
              </svg>
            </span>
            <a href="tel:+2349040788398" className="hover:text-orange-600 border-b border-dotted border-transparent hover:border-orange-600 transition">
              +234 904 078 8398
            </a>
          </div>
          <div className="flex items-start gap-2 mb-3 text-sm text-gray-700">
            <span className="text-orange-400 flex-shrink-0 mt-0.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <a href="mailto:services@ollanpharmacy.ng" className="hover:text-orange-600 border-b border-dotted border-transparent hover:border-orange-600 transition">
              services@ollanpharmacy.ng
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-orange-600 mb-4 pb-2 border-b border-orange-200 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-7 after:h-0.5 after:bg-orange-600">
            Quick Links
          </h4>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-gray-600 flex items-center gap-1 hover:text-orange-600 hover:gap-2 transition-all"
                >
                  <span className="text-orange-500 text-xs">→</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-orange-600 mb-4 pb-2 border-b border-orange-200 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-7 after:h-0.5 after:bg-orange-600">
            Services
          </h4>
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                {service}
              </li>
            ))}
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="font-serif text-xs font-semibold tracking-wider uppercase text-orange-600 mb-4 pb-2 border-b border-orange-200 relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-7 after:h-0.5 after:bg-orange-600">
            Social Media
          </h4>
          <div className="space-y-1">
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 p-2 rounded-md border border-transparent hover:border-orange-200 hover:bg-orange-50/50 transition-all"
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setHoveredLink(s.name)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <span className={hoveredLink === s.name ? "text-orange-600" : "text-orange-400"}>
                  {s.icon}
                </span>
                <span>{s.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 px-4 sm:px-8 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© 2023 Ollan Pharmacy · RC Number: 69,342 · All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <a href="/terms" className="hover:text-orange-600 border-b border-dotted border-transparent hover:border-orange-600 transition">
            Terms and Conditions
          </a>
          <span className="w-px h-3 bg-gray-300" />
          <a href="/privacy" className="hover:text-orange-600 border-b border-dotted border-transparent hover:border-orange-600 transition">
            Privacy Policy
          </a>
        </nav>
        <span className="text-5xl opacity-10 text-red-400 absolute right-10 pointer-events-none hidden lg:block">✚</span>
      </div>
    </footer>
  );
};

export default OllanFooter;
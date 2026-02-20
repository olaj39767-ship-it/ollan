"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar"; // Adjust path to your Navbar component
import OllanFooter from "./Footer";
import InstallPWA from "./InstallPWA"; // Adjust path to your InstallPWA component
export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNavbar = pathname !== "/" && !pathname.startsWith("/admin");

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
      <InstallPWA />
      <OllanFooter/>

    </>
  );
}
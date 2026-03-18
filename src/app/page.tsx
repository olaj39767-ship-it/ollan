
import HeroSection from './components/store/Shop';
import InstallPWA from './components/InstallPWA';
import MobileInstallBanner from './components/MobileInstallBanner';
import PWAChecker from './components/PWAChecker';

export default function Home() {
  return(
<>
 <HeroSection />;
  <InstallPWA />
  <MobileInstallBanner/>
  {/* <PWAChecker/> */}
</>
  )
}
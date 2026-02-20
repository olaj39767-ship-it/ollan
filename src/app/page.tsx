// 'use client'

// import React, { useState, useEffect } from 'react'
// import Image from 'next/image'
// import logo from "../../public/ollogo.svg"

// interface CountdownTime {
//   days: number
//   hours: number
//   minutes: number
//   seconds: number
// }

// interface FeatureProps {
//   icon: string
//   title: string
//   description: string
// }

// const FloatingShape: React.FC<{ className: string; delay: number }> = ({ className, delay }) => (
//   <div 
//     className={`absolute opacity-10 ${className}`}
//     style={{
//       animation: `float 20s infinite linear ${delay}s`
//     }}
//   />
// )

// const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => (
//   <div className="bg-indigo-50/50 p-6 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-200/50 border border-indigo-100/50 backdrop-blur-sm">
//     <span className="text-4xl mb-4 block">{icon}</span>
//     <h3 className="text-xl font-semibold text-slate-700 mb-2">{title}</h3>
//     <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
//   </div>
// )

// const CountdownItem: React.FC<{ value: number; label: string }> = ({ value, label }) => (
//   <div className="bg-indigo-50/50 p-2 lg:p-4 rounded-2xl lg:min-w-[80px] text-center border border-indigo-100/50 backdrop-blur-sm">
//     <span className="text-xl lg:text-3xl font-extrabold text-[#EF372B] block">{value}</span>
//     <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>
//   </div>
// )

// const SocialLink: React.FC<{ icon: string; href?: string }> = ({ icon, href = "#" }) => (
//   <a 
//     href={href} 
//     className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-300/50 border border-indigo-100/50"
//   >
//     {icon}
//   </a>
// )

// export default function ComingSoonPage() {
//   const [countdown, setCountdown] = useState<CountdownTime>({
//     days: 30,
//     hours: 12,
//     minutes: 45,
//     seconds: 20
//   })
//   const [email, setEmail] = useState('')
//   const [showSuccess, setShowSuccess] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

//   useEffect(() => {
//     const launchDate = new Date()
//     launchDate.setDate(launchDate.getDate() + 30)
    
//     const timer = setInterval(() => {
//       const now = new Date().getTime()
//       const distance = launchDate.getTime() - now
      
//       const days = Math.floor(distance / (1000 * 60 * 60 * 24))
//       const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
//       const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
//       const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      
//       setCountdown({ days, hours, minutes, seconds })
//     }, 1000)

//     return () => clearInterval(timer)
//   }, [])

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       setMousePosition({
//         x: (e.clientX / window.innerWidth - 0.5) * 100,
//         y: (e.clientY / window.innerHeight - 0.5) * 100
//       })
//     }

//     window.addEventListener('mousemove', handleMouseMove)
//     return () => window.removeEventListener('mousemove', handleMouseMove)
//   }, [])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!email || !email.includes('@')) return
    
//     setIsSubmitting(true)
    
//     try {
//       const response = await fetch('https://services.ollanpharmacy.com/api/notify', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email: email,
//           source: 'coming_soon_page',
//           timestamp: new Date().toISOString()
//         })
//       })
      
//       if (response.ok) {
//         setShowSuccess(true)
//         setEmail('')
//         setTimeout(() => setShowSuccess(false), 5000)
//       } else {
//         // Handle error - you might want to show an error message
//         console.error('Failed to submit email')
//       }
//     } catch (error) {
//       console.error('Error submitting email:', error)
//       // You might want to show an error message to the user
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const features: FeatureProps[] = [
//     {
//       icon: "🚚",
//       title: "Fast Delivery",
//       description: "Same-day delivery for urgent medications and health products"
//     },
//     {
//       icon: "👨‍⚕️",
//       title: "Expert Consultation", 
//       description: "24/7 pharmacist support and personalized health guidance"
//     },
//     {
//       icon: "🔒",
//       title: "Secure & Private",
//       description: "Bank-level security for all your health information and orders"
//     }
//   ]

//   return (
//     <>
//       <style jsx>{`
//         @keyframes float {
//           0% { transform: translateY(0px) rotate(0deg); }
//           50% { transform: translateY(-20px) rotate(180deg); }
//           100% { transform: translateY(0px) rotate(360deg); }
//         }
        
//         @keyframes slideUp {
//           from {
//             opacity: 0;
//             transform: translateY(50px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes pulse {
//           0% { transform: scale(1); }
//           50% { transform: scale(1.05); }
//           100% { transform: scale(1); }
//         }
        
//         .slide-up {
//           animation: slideUp 1s ease-out;
//         }
        
//         .pulse-animation {
//           animation: pulse 2s infinite;
//         }
//       `}</style>
      
//       <div className="min-h-screen bg-white lg:bg-gradient-to-br from-red-500 via-purple-600 to-indigo-700 relative overflow-hidden">
//         {/* Floating Shapes */}
//         <div className="fixed inset-0 overflow-hidden pointer-events-none">
//           <FloatingShape 
//             className="top-1/5 left-1/10 w-20 h-20 bg-white rounded-full" 
//             delay={0}
//           />
//           <FloatingShape 
//             className="top-3/5 left-4/5 w-30 h-30 bg-white/80 rounded-3xl" 
//             delay={5}
//           />
//           <FloatingShape 
//             className="top-2/5 left-3/4 w-15 h-15 bg-white rounded-full" 
//             delay={10}
//           />
//           <FloatingShape 
//             className="top-4/5 left-1/5 w-25 h-25 bg-white/60 rounded-2xl" 
//             delay={15}
//           />
          
//           {/* Parallax shapes */}
//           {[...Array(4)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-20 h-20 bg-white/5 rounded-full transition-transform duration-75 ease-out"
//               style={{
//                 top: `${20 + i * 20}%`,
//                 left: `${10 + i * 20}%`,
//                 transform: `translate(${mousePosition.x * (i + 1) * 0.1}px, ${mousePosition.y * (i + 1) * 0.1}px)`
//               }}
//             />
//           ))}
//         </div>

//         {/* Main Content */}
//         <div className="min-h-screen flex items-center justify-center p-2 lg:p-8 relative">
//           <div className="bg-white/95 backdrop-blur-3xl rounded-[2rem] p-2 lg:p-16 text-center shadow-2xl shadow-black/20 max-w-7xl w-full slide-up">
            
//             {/* Logo */}
//             <div className='w-full flex justify-center items-center'>
//            <Image src={logo} alt='logo'/>

//             </div>

//             {/* Title */}
//             <h1 className="lg:text-5xl text-3xl font-extrabold  bg-clip-text text-[#EF372B] mb-4 leading-tight">
//              Ollan Pharmacy
//             </h1>
            
//             <h2 className="text-xl text-slate-600 font-normal mb-10 leading-relaxed lg:max-w-lg lg:mx-auto">
//               Your trusted online pharmacy is launching soon with revolutionary healthcare solutions
//             </h2>

//             {/* Countdown */}
//             <div className="flex justify-center gap-1 lg:gap-4 mb-12 flex-wrap">
//               <CountdownItem value={countdown.days} label="Days" />
//               <CountdownItem value={countdown.hours} label="Hours" />
//               <CountdownItem value={countdown.minutes} label="Minutes" />
//               <CountdownItem value={countdown.seconds} label="Seconds" />
//             </div>

//             {/* Features */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
//               {features.map((feature, index) => (
//                 <Feature key={index} {...feature} />
//               ))}
//             </div>

//             {/* Notification Form */}
//             <div className="bg-white rounded-3xl p-8 mb-8 shadow-lg shadow-black/5">
//               <h3 className="text-xl font-semibold text-slate-700 mb-2">
//                 Get notified when we launch
//               </h3>
//               <p className="text-slate-600 mb-6">
//                 Be the first to access exclusive offers and premium healthcare services
//               </p>
              
//               <form onSubmit={handleSubmit} className="flex gap-4 flex-col sm:flex-row">
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Enter your email address"
//                   className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-2xl text-base transition-all focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
//                   required
//                 />
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-400/50 whitespace-nowrap disabled:opacity-50 disabled:hover:transform-none disabled:cursor-not-allowed"
//                 >
//                   {isSubmitting ? (
//                     <span className="flex items-center gap-2">
//                       <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                       </svg>
//                       Submitting...
//                     </span>
//                   ) : (
//                     'Notify Me'
//                   )}
//                 </button>
//               </form>
              
//               {showSuccess && (
//                 <div className="bg-green-500 text-white px-4 py-3 rounded-xl mt-4 animate-pulse">
//                   ✅ Thank you! We'll notify you as soon as we launch.
//                 </div>
//               )}
//             </div>

//             {/* Social Links */}
//             <div className="flex justify-center gap-4">
//               <SocialLink icon="📧" />
//               <SocialLink icon="📱" />
//               <SocialLink icon="🌐" />
//               <SocialLink icon="📞" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

// pages/index.tsx
import HeroSection from './components/Shop';
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
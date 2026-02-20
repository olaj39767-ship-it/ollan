'use client';

import { useState, useEffect, FC } from 'react';
import Image from 'next/image';
import i1 from "../../../../public/img/o2.png"
import i2 from "../../../../public/img/o3.png"
import i3 from "../../../../public/img/o1.png"
import i4 from "../../../../public/img/o4.png"
import i5 from "../../../../public/img/o5.png"


interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  color: string;
  imageUrl?: any;
  initials: string;
}

/* ─── Truncated Bio ─────────────────────────────────────────────────────────── */

const TruncatedBio: FC<{ text: string; limit?: number }> = ({ text, limit = 20 }) => {
  const [expanded, setExpanded] = useState(false);

  const words = text.trim().split(/\s+/);
  const isTruncatable = words.length > limit;
  const displayed =
    expanded || !isTruncatable ? text : words.slice(0, limit).join(' ') + '…';

  return (
    <>
      <p
        className="text-red-50 text-sm leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity duration-500"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {displayed}
      </p>
      {isTruncatable && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // prevent card hover side-effects
            setExpanded((p) => !p);
          }}
          className="mt-2 text-xs font-bold text-white/70 hover:text-white underline underline-offset-2 transition-colors duration-200"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────────── */

export default function AboutUs() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Oladejo Olakareem",
      role: "Chief Executive Officer",
      bio: "A second-generation CEO, Oladejo grew up inside the Ollan Pharmacy business and now leads its evolution into a modern, tech-enabled healthcare company. He is focused on using technology, data, and operational excellence to expand access to quality medicines and food while keeping community trust at the center of everything.",
      color: "#dc2626",
      imageUrl: i1,
      initials: "SM"
    },
    {
      id: 2,
      name: "Abdulkarerm Ajolayo Olakareem",
      role: "COO",
      bio: "Operations mastermind scaling efficiency and building sustainable growth frameworks.",
      color: "#b91c1c",
      imageUrl: i2,
      initials: "MC"
    },
    {
      id: 3,
      name: "Olakareem Abdulwasii Omobolarinwa",
      role: "CTO",
      bio: "Tech pioneer architecting tomorrow's solutions with cutting-edge engineering.",
      color: "#991b1b",
      imageUrl: i3,
      initials: "AR"
    },
    {
      id: 4,
      name: "Muizat Busari,",
      role: "Product Manager",
      bio: "While her journey with the company began more recently, her deep interest in the intersection of healthcare and brand storytelling has made her a vital part of the firm's digital transformation",
      color: "#dc2626",
      imageUrl: i4,
      initials: "JP"
    },
    {
      id: 5,
      name: "Balogun Lateef",
      role: "Operations and Digital Marketer",
      bio: "Balogun Lateef currently works at Ollan Pharmacy and Supermarket, where he improves operations, increases visibility, and drives sustainable growth across the pharmacy.",
      color: "#b91c1c",
      imageUrl: i5,
      initials: "EW"
    },
  ];

  return (
    <div className="min-h-screen text-black overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-white"></div>
        <div
          className="absolute w-[1000px] h-[1000px] rounded-full blur-[150px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)',
            left: mousePosition.x - 500,
            top: mousePosition.y - 500,
            transition: 'left 0.3s ease-out, top 0.3s ease-out'
          }}
        ></div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            style={{
              backgroundImage: 'linear-gradient(#ef4444 1px, transparent 1px), linear-gradient(90deg, #ef4444 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
            className="w-full h-full"
          ></div>
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-red-500 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20 relative">
          <div className="max-w-7xl w-full">
            {/* Main Title */}
            <div className="text-center mb-20">
              <h1
                className="text-8xl md:text-9xl lg:text-[5rem] font-black mb-8 relative leading-none"
                style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}
              >
                <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                  THE TEAM
                </span>
              </h1>

              {/* Animated Line */}
              <div className="flex justify-center gap-2 mb-8">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 bg-red-600 rounded-full"
                    style={{
                      width: i === 3 ? '120px' : '40px',
                      animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`
                    }}
                  ></div>
                ))}
              </div>

              <p
                className="text-2xl md:text-3xl text-red-300 max-w-4xl mx-auto leading-relaxed tracking-wide"
                style={{ fontFamily: "'Crimson Pro', 'Georgia', serif" }}
              >
                We don't follow trends.{' '}
                <span className="text-red-500 font-bold italic">We create them.</span>
              </p>
            </div>

            {/* Leadership Team Grid */}
            <div>
              <h3
                className="text-5xl md:text-6xl font-black text-center mb-12 tracking-tight"
                style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}
              >
                <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
                  LEADERSHIP TEAM
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="group relative"
                    style={{ animation: `slideUp 0.6s ease-out ${(index + 1) * 0.1}s both` }}
                    onMouseEnter={() => setActiveCard(member.id)}
                    onMouseLeave={() => setActiveCard(null)}
                  >
                    <div className="relative rounded-3xl overflow-hidden transform-gpu transition-all duration-500 hover:scale-105 hover:-rotate-1">
                      {/* Card Background */}
                      <div className="absolute bg-gradient-to-r from-red-600 via-red-500 to-orange-600 inset-0 opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Hover Glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-red-500 to-red-600 rounded-3xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                      {/* Content */}
                      <div className="relative p-8 flex flex-col">
                        {/* Role Badge */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                            <span
                              className="text-xs font-bold tracking-widest uppercase text-white"
                              style={{ fontFamily: "'Space Mono', monospace" }}
                            >
                              {member.role}
                            </span>
                          </div>
                          <div className="w-12 h-12 border-t-2 border-r-2 border-white/30 rounded-tr-2xl group-hover:border-red-400 transition-colors duration-500"></div>
                        </div>

                        {/* Team Member Image */}
                        <div className="relative w-48 h-48 mx-auto mb-6">
                          <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-red-400 transition-colors duration-500"></div>
                          <div className="absolute inset-2 rounded-full overflow-hidden bg-gradient-to-br from-white to-red-50 shadow-xl">
                            <div className="relative w-full h-full">
                              <Image
                                src={member.imageUrl}
                                alt={`${member.name} - ${member.role}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          </div>
                          {/* Decorative ring */}
                          <div className="absolute -inset-4 rounded-full border border-dashed border-white/20 group-hover:rotate-180 transition-transform duration-[3s]"></div>
                        </div>

                        {/* Name and Bio */}
                        <div className="mt-auto text-center">
                          <h4
                            className="text-3xl text-white mb-3 leading-none transform group-hover:scale-105 transition-transform duration-500"
                            style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}
                          >
                            {member.name}
                          </h4>

                          {/* ← Bio with 20-word truncation */}
                          <TruncatedBio text={member.bio} limit={20} />
                        </div>

                        {/* Decorative Circles */}
                        <div className="absolute bottom-8 right-8 w-20 h-20 border-2 border-white/10 rounded-full group-hover:scale-150 group-hover:border-red-500/30 transition-all duration-700 pointer-events-none"></div>
                      </div>

                      {/* Hover Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbit {
          from { transform: translate(-50%, -50%) rotate(0deg) translateY(-140px); }
          to   { transform: translate(-50%, -50%) rotate(360deg) translateY(-140px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline { animation: scanline 8s linear infinite; }
      `}</style>
    </div>
  );
}
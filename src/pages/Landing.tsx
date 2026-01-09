import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores';
import { useSignOut } from '../hooks/useAuth';
import { useState } from 'react';
import { FaInstagram, FaYoutube, FaFacebook, FaHeart } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import Logo from '../components/Logo';
import avatarCollab from '../assets/avatar-collab.png';
import logoSvg from '../assets/logo.svg';
import brand1 from '../assets/brands/1.png';
import brand2 from '../assets/brands/2.png';
import brand3 from '../assets/brands/3.png';
import brand4 from '../assets/brands/4.png';
import brand5 from '../assets/brands/5.png';
import brand6 from '../assets/brands/6.png';
import brand7 from '../assets/brands/7.png';
import brand8 from '../assets/brands/8.png';

const Landing = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { signOut } = useSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(true);

  // Brand logos
  const brandLogos = [
    { id: 1, image: brand1, alt: 'Brand 1' },
    { id: 2, image: brand2, alt: 'Brand 2' },
    { id: 3, image: brand3, alt: 'Brand 3' },
    { id: 4, image: brand4, alt: 'Brand 4' },
    { id: 5, image: brand5, alt: 'Brand 5' },
    { id: 6, image: brand6, alt: 'Brand 6' },
    { id: 7, image: brand7, alt: 'Brand 7' },
    { id: 8, image: brand8, alt: 'Brand 8' },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.roles.includes('promoter')) return '/promoter/dashboard';
    if (user.roles.includes('influencer')) return '/influencer/dashboard';
    return '/role-selection';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#00D9FF]/30 font-sans">
      {/* --- NAV BAR --- */}
      <header className="fixed w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Logo size="lg" onClick={handleLogoClick} />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
            <a href="#benefits" className="hover:text-white transition-colors">Why Us</a>
            <a href="#creators" className="hover:text-white transition-colors">Creators</a>
            <a href="#brands" className="hover:text-white transition-colors">Brands</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:block">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to={getDashboardPath()} className="bg-[#00D9FF] text-black font-black px-5 py-2 rounded-full text-sm hover:scale-105 transition-all">
                  DASHBOARD
                </Link>
                <button onClick={handleSignOut} className="bg-white/10 text-white font-black px-5 py-2 rounded-full text-sm hover:bg-white/20 transition-all">
                  SIGN OUT
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-white text-black font-black px-6 py-2 rounded-full text-sm hover:scale-105 transition-all">
                SIGN IN
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="flex flex-col gap-4 text-sm font-bold uppercase tracking-widest text-gray-400">
                <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Why Us</a>
                <a href="#creators" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Creators</a>
                <a href="#brands" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Brands</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Pricing</a>
              </div>
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-[#00D9FF] text-black font-black px-5 py-3 rounded-full text-sm text-center hover:scale-105 transition-all"
                    >
                      DASHBOARD
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="bg-white/10 text-white font-black px-5 py-3 rounded-full text-sm hover:bg-white/20 transition-all w-full"
                    >
                      SIGN OUT
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-white text-black font-black px-6 py-3 rounded-full text-sm text-center hover:scale-105 transition-all"
                  >
                    SIGN IN
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-30 pb-16 px-4 relative overflow-hidden">
        {/* Logo as frosted glass background */}
        <div className="absolute -bottom-[80px] right-0 w-[400px] h-[400px] md:w-[600px] md:h-[600px] z-0">
          <img
            src={logoSvg}
            alt=""
            className="w-full h-full object-contain"
            style={{ filter: 'blur(12px) opacity(0.3)' }}
          />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="inline-block px-4 py-1.5 mb-8 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#00D9FF] text-[10px] font-black uppercase tracking-[0.3em]"
          >
            The Professional Collab Operating System
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter"
          >
            THE NEW <br />
            <span className="bg-gradient-to-r from-[#00D9FF] to-[#B8FF00] bg-clip-text text-transparent">COLLAB WORKSPACE.</span>
          </motion.h1 >

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Don't let your business get lost in the DMs. One workspace to collaborate, execute, and settle brand collabs professionally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            {isAuthenticated ? (
              <Link to={getDashboardPath()} className="w-full sm:w-auto px-10 py-5 bg-[#00D9FF] text-black font-black rounded-2xl text-lg hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all">
                GO TO DASHBOARD
              </Link>
            ) : (
              <>
                <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-[#00D9FF] text-black font-black rounded-2xl text-lg hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all">
                  I AM A CREATOR
                </Link>
                <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-[#B8FF00] text-black font-black rounded-2xl text-lg hover:shadow-[0_0_30px_rgba(184,255,0,0.3)] transition-all">
                  I AM A BRAND
                </Link>
              </>
            )}
          </motion.div>

          {/* Brands Carousel */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="relative"
          >
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
              Brands promoted by our 100k+ verified influencers
            </p>

            <div className="relative overflow-hidden -mx-4">
              <div className="flex gap-8 md:gap-12 py-4 animate-scroll">
                {brandLogos.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    <div className="relative group">
                      <img
                        src={brand.image}
                        alt={brand.alt}
                        className="w-24 h-14 md:w-32 md:h-16 object-contain rounded-lg grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
                {brandLogos.map((brand) => (
                  <div
                    key={`dup-${brand.id}`}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    <div className="relative group">
                      <img
                        src={brand.image}
                        alt={brand.alt}
                        className="w-24 h-14 md:w-32 md:h-16 object-contain rounded-lg grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
                {brandLogos.map((brand) => (
                  <div
                    key={`dup2-${brand.id}`}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    <div className="relative group">
                      <img
                        src={brand.image}
                        alt={brand.alt}
                        className="w-24 h-14 md:w-32 md:h-16 object-contain rounded-lg grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.33%);
            }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
        `}</style>
      </section>

      {/* --- PLATFORM BENEFITS --- */}
      <section id="benefits" className="py-32 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              Why <span className="text-white font-normal" style={{ fontFamily: 'Inter, sans-serif' }}>Col</span><span className="bg-gradient-to-r from-[#00D9FF] to-[#B8FF00] bg-clip-text text-transparent font-black" style={{ fontFamily: 'Inter, sans-serif' }}>Loved</span>?
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              The missing layer between DMs and spreadsheets. Professionalize your brand collabs from first message to final payment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "⚡", title: "Everything in One Place", desc: "Chats, briefs, deliverables, payments—no more scattered conversations across multiple apps." },
              { icon: "👥", title: "100K+ Influencers", desc: "Join a thriving community of nano & micro creators. Your perfect network to grow, collaborate, and scale together." },
              { icon: "🎯", title: "Get Discovered", desc: "1000s of brands are actively looking for creators like you. Set up your profile and let brands come to you." },
              { icon: "📋", title: "Digital Confirmations", desc: "Lock in scope, timelines, and pricing with one click. No more scope creep or vague agreements." }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#00D9FF]/30 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{item.icon}</div>
                  <h3 className="text-base font-black uppercase tracking-tight">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CREATOR STOREFRONT --- */}
      <section className="py-32 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none uppercase mb-6">
              <span className="text-[#00D9FF]">Where Creators</span><br />
              <span className="text-[#B8FF00]">Meet Brands</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Your gateway to brand partnerships
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Features */}
            <div className="space-y-8">
              {[
                {
                  icon: "🎯",
                  title: "Get Discovered",
                  desc: "Show up in search when brands browse influencers. Your categories, rates, and portfolio—all in one place."
                },
                {
                  icon: "🔗",
                  title: "Your Link in Bio",
                  desc: "Share your ColLoved profile everywhere. One link for collabs, rates, and terms—no more 'send me your rate deck' DMs."
                },
                {
                  icon: "⚙️",
                  title: "Set Your Terms",
                  desc: "Define advance requirements, content preferences, and deal-breakers. Pre-filter unwanted queries before they reach your inbox."
                },
                {
                  icon: "💼",
                  title: "Better Deals, Less Noise",
                  desc: "Attract serious brands who respect your terms. Stop negotiating basics, focus on creative collaboration."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="text-4xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}

              <Link to="/login" className="inline-flex items-center gap-3 mt-8 px-8 py-4 bg-[#00D9FF] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all">
                Create My Public Profile
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            {/* Mock Profile Card with Tabs */}
            <div className="relative flex flex-col items-center pb-6">
              {/* Toggle Button */}
              <button
                onClick={() => setShowPricing(!showPricing)}
                className="relative mb-8 w-64 h-10 bg-white/5 rounded-full border border-white/10 overflow-hidden transition-all hover:bg-white/10"
              >
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/90 rounded-full shadow-lg transition-all duration-300 ease-out ${
                    showPricing ? 'left-1' : 'left-[calc(50%-4px)]'
                  }`}
                />
                <div className="relative flex h-full">
                  <span className={`flex-1 flex items-center justify-center text-xs font-black transition-colors duration-300 ${showPricing ? 'text-gray-900' : 'text-gray-500'}`}>
                    With Price
                  </span>
                  <span className={`flex-1 flex items-center justify-center text-xs font-black transition-colors duration-300 ${!showPricing ? 'text-gray-900' : 'text-gray-500'}`}>
                    Price on Request
                  </span>
                </div>
              </button>

              {/* Stacked Card Container */}
              <div className="relative w-full max-w-md h-[580px] md:h-[550px]">
                {/* Bottom Card (Without Price) */}
                <motion.div
                  animate={{
                    scale: showPricing ? 0.95 : 1,
                    y: showPricing ? 20 : 0,
                    opacity: showPricing ? 0.6 : 1,
                    zIndex: showPricing ? 0 : 10,
                    rotate: showPricing ? -6 : -3
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-0"
                >
                  <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] rounded-3xl border border-[#00D9FF]/20 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_60px_rgba(0,217,255,0.1)]">
                    {/* Profile Header */}
                    <div className="flex items-start gap-5 mb-8">
                      <div className="relative">
                        <img
                          src={avatarCollab}
                          alt="Priya Sharma"
                          className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1a1a1a]"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-1">Priya Sharma</h3>
                        <p className="text-gray-500 text-sm mb-3">@priyacreates</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Fashion</span>
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Lifestyle</span>
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Tech</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaInstagram className="text-lg text-pink-500" />
                          <span className="text-gray-400 text-xs font-medium">Instagram</span>
                        </div>
                        <p className="text-white font-black text-xl">125K</p>
                        <p className="text-gray-500 text-xs">followers</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaFacebook className="text-lg text-blue-500" />
                          <span className="text-gray-400 text-xs font-medium">Facebook</span>
                        </div>
                        <p className="text-white font-black text-xl">85K</p>
                        <p className="text-gray-500 text-xs">followers</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaYoutube className="text-lg text-red-500" />
                          <span className="text-gray-400 text-xs font-medium">YouTube</span>
                        </div>
                        <p className="text-white font-black text-xl">45K</p>
                        <p className="text-gray-500 text-xs">subscribers</p>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="mb-6">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-[#00D9FF]">✕</span>
                          No gambling or MLM scheme promotions
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-[#00D9FF]">✓</span>
                          Barter collabs only from 100K+ follower creators
                        </li>
                      </ul>
                    </div>

                    {/* Private Pricing Message */}
                    <div className="bg-gradient-to-r from-[#00D9FF]/5 to-transparent rounded-2xl p-5 md:px-6 md:py-7 border border-[#00D9FF]/10 text-center mb-6">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <span className="text-gray-300 text-sm">Price discussed in private</span>
                        <span className="px-3 py-1 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold uppercase tracking-wider">
                          Price on Request
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">Connect with me to know details</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                        <FaHeart className="w-4 h-4" />
                        Shortlist
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all">
                        <FiSend className="w-4 h-4" />
                        Send Proposal
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Top Card (With Price) */}
                <motion.div
                  animate={{
                    scale: showPricing ? 1 : 0.95,
                    y: showPricing ? 0 : 20,
                    opacity: showPricing ? 1 : 0.6,
                    zIndex: showPricing ? 10 : 0,
                    rotate: showPricing ? 2 : 6
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute inset-0"
                >
                  <div className="relative w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#050505] rounded-3xl border border-[#00D9FF]/30 p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_60px_rgba(0,217,255,0.15)]">
                    {/* Profile Header */}
                    <div className="flex items-start gap-5 mb-8">
                      <div className="relative">
                        <img
                          src={avatarCollab}
                          alt="Priya Sharma"
                          className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1a1a1a]"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-white mb-1">Priya Sharma</h3>
                        <p className="text-gray-500 text-sm mb-3">@priyacreates</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Fashion</span>
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Lifestyle</span>
                          <span className="px-3 py-1 rounded-full bg-[#00D9FF]/10 text-[#00D9FF] text-xs font-bold">Tech</span>
                        </div>
                      </div>
                    </div>

                    {/* Social Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaInstagram className="text-lg text-pink-500" />
                          <span className="text-gray-400 text-xs font-medium">Instagram</span>
                        </div>
                        <p className="text-white font-black text-xl">125K</p>
                        <p className="text-gray-500 text-xs">followers</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaFacebook className="text-lg text-blue-500" />
                          <span className="text-gray-400 text-xs font-medium">Facebook</span>
                        </div>
                        <p className="text-white font-black text-xl">85K</p>
                        <p className="text-gray-500 text-xs">followers</p>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <FaYoutube className="text-lg text-red-500" />
                          <span className="text-gray-400 text-xs font-medium">YouTube</span>
                        </div>
                        <p className="text-white font-black text-xl">45K</p>
                        <p className="text-gray-500 text-xs">subscribers</p>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="mb-6">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-[#00D9FF]">✕</span>
                          No gambling or MLM scheme promotions
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-[#00D9FF]">✓</span>
                          Barter collabs only from 100K+ follower creators
                        </li>
                      </ul>
                    </div>

                    {/* Pricing Section */}
                    <div className="bg-gradient-to-r from-[#00D9FF]/5 to-transparent rounded-2xl p-5 border border-[#00D9FF]/10 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-400 text-sm">Starting from</span>
                        <span className="text-[#00D9FF] font-black text-2xl">₹15,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Advance</span>
                        <span className="text-white font-bold">30% upfront</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                        <FaHeart className="w-4 h-4" />
                        Shortlist
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 bg-[#00D9FF] text-black font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all">
                        <FiSend className="w-4 h-4" />
                        Send Proposal
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOR CREATORS --- */}
      <section id="creators" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-2 mb-6 rounded-full border border-[#00D9FF]/20 bg-[#00D9FF]/5 text-[#00D9FF] text-xs font-black uppercase tracking-widest">
                For Creators & Influencers
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none uppercase mb-8">
                Your Work.<br />
                <span className="text-[#00D9FF]">Professional.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Stop chasing payments through DMs. Get a professional workspace that serious brands expect.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Workspace Link", desc: "One link to handle all brand inbounds. No more 'send me your rate deck' messages." },
                  { title: "Get Paid First", desc: "Escrow protection: Money is secured before you deliver. Work with confidence." },
                  { title: "All Collab Types", desc: "Barter, reviews, sponsored posts—manage everything from one dashboard." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#00D9FF]/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#00D9FF]"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/login" className="inline-flex items-center gap-3 mt-12 px-8 py-4 bg-[#00D9FF] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] transition-all">
                START AS CREATOR
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/20 to-transparent rounded-[60px] blur-3xl"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[60px] p-10 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#00D9FF]/50"></div>
                    <div>
                      <div className="font-black text-white">Nike Sportswear</div>
                      <div className="text-xs text-gray-500 font-medium">New Collab Request</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase">₹25,000 Escrowed</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="h-2 w-full bg-white/5 rounded-full"></div>
                  <div className="h-2 w-4/5 bg-white/5 rounded-full"></div>
                  <div className="h-2 w-3/5 bg-white/5 rounded-full"></div>
                </div>

                <div className="bg-[#00D9FF] p-5 rounded-2xl text-black">
                  <div className="text-[10px] font-black mb-2 opacity-60 uppercase tracking-widest">Deliverables</div>
                  <div className="font-black leading-tight mb-4">1x Reel (30s) + 2x Stories</div>
                  <div className="flex gap-2">
                    <div className="flex-1 py-2 bg-black text-white text-[10px] font-black flex items-center justify-center rounded-lg uppercase cursor-pointer">Accept</div>
                    <div className="flex-1 py-2 bg-white/20 text-black text-[10px] font-black flex items-center justify-center rounded-lg uppercase cursor-pointer">Negotiate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOR BRANDS --- */}
      <section id="brands" className="py-32 px-4 bg-[#050505] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#B8FF00]/20 to-transparent rounded-[60px] blur-3xl"></div>
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[60px] p-10 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-[10px] font-black text-[#B8FF00] tracking-tighter uppercase">Campaign Dashboard</div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#0a0a0a]"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-[#0a0a0a]"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-[#0a0a0a]"></div>
                    <div className="w-8 h-8 rounded-full bg-[#B8FF00] border-2 border-[#0a0a0a] flex items-center justify-center text-black text-xs font-black">+12</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <div className="text-2xl font-black text-white">15</div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase">Active</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <div className="text-2xl font-black text-[#B8FF00]">8</div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase">Completed</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center">
                    <div className="text-2xl font-black text-white">₹2.4L</div>
                    <div className="text-[10px] text-gray-500 font-medium uppercase">Spent</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-white">@fitnessqueen</div>
                      <div className="text-xs text-gray-500">Reel • Pending Review</div>
                    </div>
                    <div className="text-[10px] font-black text-[#B8FF00] bg-[#B8FF00]/10 px-2 py-1 rounded">VERIFY</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-600"></div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-white">@techreviewer</div>
                      <div className="text-xs text-gray-500">Story Settled</div>
                    </div>
                    <div className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded">DONE</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-block px-4 py-2 mb-6 rounded-full border border-[#B8FF00]/20 bg-[#B8FF00]/5 text-[#B8FF00] text-xs font-black uppercase tracking-widest">
                For Brands & Agents
              </div>
              <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none uppercase mb-8">
                Scale Your<br />
                <span className="text-[#B8FF00]">Campaigns.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                Manage 100+ influencer collabs without the chaos. Agency-grade tools for teams of all sizes.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Discover Creators", desc: "Find influencers by niche, audience demographics, and engagement rates." },
                  { title: "Centralized Dashboard", desc: "Track every collab status from brief to payment in one view." },
                  { title: "Audit-Proof", desc: "Every transaction, barter, and deliverable logged automatically. 100% compliant." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#B8FF00]/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#B8FF00]"></div>
                    </div>
                    <div>
                      <h4 className="font-black text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/login" className="inline-flex items-center gap-3 mt-12 px-8 py-4 bg-[#B8FF00] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(184,255,0,0.3)] transition-all">
                START AS BRAND
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-32 px-4 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 mb-6 rounded-full border border-[#B8FF00]/20 bg-[#B8FF00]/5 text-[#B8FF00] text-xs font-black uppercase tracking-widest">
              Simple, Transparent Pricing
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none uppercase mb-6">
              Pay Per <span className="text-[#B8FF00]">Collab</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Professional tools for every brand deal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Verified Collab Plan */}
            <div className="relative p-10 rounded-[40px] bg-gradient-to-br from-[#FFFFFF]/20 to-[#FFFFFF]/5 border-2 border-[#1ecf22]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1ecf22] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                No Subscriptions
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">Verified Collab</h3>
                <p className="text-gray-400 text-sm font-medium">For professional brand deals</p>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-black tracking-tighter text-white">₹49</span>
                <span className="text-2xl text-gray-300 line-through font-bold">₹99</span>
                <span className="text-gray-500 font-medium">/collab</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#1ecf22] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Digital confirmations & scope lock
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#1ecf22] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Auto-generated GST invoices
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#1ecf22] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  194-O/194R tax records
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#1ecf22] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Content verification
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#1ecf22] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Audit-proof records
                </li>
              </ul>
              <Link to="/login" className="block w-full py-3 bg-[#FFFFFF] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(32,178,170,0.3)] transition-all uppercase tracking-widest text-md text-center">
                Start Collab
              </Link>
            </div>

            {/* Escrow Plan - Highlighted */}
            <div className="relative p-10 rounded-[40px] bg-gradient-to-br from-[#FF6B9D]/20 to-[#FF6B9D]/5 border-2 border-[#FF6B9D]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FF6B9D] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                Maximum Security
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white mb-2">Payment Escrow</h3>
                <p className="text-gray-400 text-sm font-medium">Funds held safe until completion</p>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black tracking-tighter text-white">Starts at</span>
                <span className="text-6xl font-black tracking-tighter text-[#FF6B9D]">₹149</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B9D] flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  Everything in Verified Collab
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B9D]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B9D]"></div>
                  </div>
                  Payment escrow protection
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B9D]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B9D]"></div>
                  </div>
                  Money released only after completion
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B9D]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B9D]"></div>
                  </div>
                  Dispute resolution support
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B9D]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B9D]"></div>
                  </div>
                  Auto TDS deductions and tax handling
                </li>
              </ul>
              <Link to="/login" className="block w-full py-3 bg-[#FF6B9D] text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(255,107,157,0.3)] transition-all uppercase tracking-widest text-md text-center">
                Secure Your Deal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRE-FOOTER COMPLIANCE BAR --- */}
      <div className="w-full bg-[#111] py-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-2 opacity-40">
           <span className="text-[9px] font-black uppercase tracking-widest">Section 194-O Compliant</span>
           <span className="text-[9px] font-black uppercase tracking-widest">Section 194R Barter Tracking</span>
           <span className="text-[9px] font-black uppercase tracking-widest">GST Automated Invoicing</span>
           <span className="text-[9px] font-black uppercase tracking-widest">Permanent Audit Vault</span>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="md" onClick={handleLogoClick} />
          <div className="flex gap-8 text-[10px] font-black tracking-widest text-gray-500">
            <span>© 2026 ColLoved</span>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
        <div className="mt-4 text-center text-[9px] font-medium text-gray-600 max-w-2xl mx-auto">
          ColLoved is a technology enabler. We provide tools for professional collaboration and compliance automation. We are not a creative agency or tax firm.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
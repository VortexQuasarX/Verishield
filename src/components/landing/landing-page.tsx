'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import {
  Shield, CheckCircle2, Clock, Zap, ArrowRight, Menu, X,
  IdCard, MapPin, Home, GraduationCap, Briefcase, Gavel,
  Globe, FlaskConical, CreditCard, Users, Brain, ShieldUser,
  MessageCircle, Link, ShieldCheck, Video, Store, Building2,
  HardHat, Laptop, Scale, Award, FileCheck, Lock, Eye,
  ClipboardList, UserPlus, LayoutDashboard, ChevronRight,
  Star, Sparkles, ShieldAlert, FileText, Plug, ChartLine,
  UserCog, CheckCircle, CircleDot, PartyPopper,
  Hexagon, Triangle, Diamond
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { verificationChecks, products, industrySegments, pricingPlans } from '@/lib/mock-data';

// ---- Icon Mapping ----
const iconMap: Record<string, React.ElementType> = {
  IdCard, MapPin, Home, GraduationCap, Briefcase, Gavel,
  Globe, FlaskConical, CreditCard, Users, Brain, ShieldUser,
  MessageCircle, Link, ShieldCheck, Video, Store, Building2,
  HardHat, Laptop, Scale, Award, Shield, FileText, Plug, ChartLine, UserCog,
};

function getIcon(name: string): React.ElementType {
  return iconMap[name] || Shield;
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Premium staggered hero entrance
const heroStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// ═══════════════════════════════════════════════════════════════
// FLOATING CARD COMPONENT (Premium)
// ═══════════════════════════════════════════════════════════════

function FloatingCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPER (Premium)
// ═══════════════════════════════════════════════════════════════

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeInUp}
      className={`py-20 md:py-32 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM SECTION HEADER
// ═══════════════════════════════════════════════════════════════

function SectionHeader({ badge, title, description }: { badge?: string; title: string; description?: string }) {
  return (
    <div className="text-center mb-16 md:mb-20">
      {badge && (
        <motion.div variants={fadeInUp} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-sm font-medium text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            {badge}
          </span>
        </motion.div>
      )}
      <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
        {title}
      </motion.h2>
      {description && (
        <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {description}
        </motion.p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM SECTION DIVIDER
// ═══════════════════════════════════════════════════════════════

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-3 w-1.5 h-1.5 rounded-full bg-primary/40" />
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DOT GRID BACKGROUND
// ═══════════════════════════════════════════════════════════════

function DotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{
      backgroundImage: 'radial-gradient(circle, oklch(0.55 0.15 175 / 8%) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION BAR (Premium)
// ═══════════════════════════════════════════════════════════════

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setShowLoginDialog } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Checks', href: '#checks' },
    { label: 'Product', href: '#products' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-premium shadow-luxury'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Veri<span className="text-gradient">Shield</span>
              <span className="text-[10px] font-semibold text-primary ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10">Pro</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setShowLoginDialog(true)}>
              Login
            </Button>
            <button className="btn-premium text-sm h-9 px-5" onClick={() => setShowLoginDialog(true)}>
              Try for Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-premium border-t border-border/50"
          >
            <div className="px-4 py-5 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                >
                  {link.label}
                </a>
              ))}
              <Separator className="my-3" />
              <Button variant="ghost" className="w-full justify-start" onClick={() => { setShowLoginDialog(true); setMobileOpen(false); }}>
                Login
              </Button>
              <button className="btn-premium w-full h-10 text-sm" onClick={() => { setShowLoginDialog(true); setMobileOpen(false); }}>
                Try for Free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO SECTION (Premium — Full Viewport, Mesh + Noise)
// ═══════════════════════════════════════════════════════════════

function HeroSection() {
  const { setShowLoginDialog } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Premium Background: Mesh Gradient + Noise */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 noise" />

      {/* Dot Grid */}
      <DotGrid />

      {/* Parallax Decorative Orbs */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <div className="absolute top-20 left-[15%] w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-[10%] w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/[0.03] rounded-full blur-[140px]" />
      </motion.div>

      {/* Floating Geometric Decorations */}
      <motion.div
        className="absolute top-[15%] right-[8%] opacity-[0.04]"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <Hexagon className="w-32 h-32 text-primary" />
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[5%] opacity-[0.03]"
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      >
        <Triangle className="w-24 h-24 text-primary" />
      </motion.div>
      <motion.div
        className="absolute top-[35%] right-[25%] opacity-[0.03]"
        animate={{ rotate: 180 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <Diamond className="w-16 h-16 text-primary" />
      </motion.div>

      <motion.div style={{ opacity }} className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div variants={heroItem}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-sm font-medium text-primary mb-8">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Verification Platform
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={heroItem}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-7"
            >
              Fast,{' '}
              <span className="text-gradient">AI-Powered</span>
              <br />
              Employee Background
              <br />
              <span className="text-gradient">Verification</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={heroItem}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              AI-powered verification reports with <span className="font-semibold text-foreground">cryptographically sealed</span> audit trails.
              Built for modern teams who need fast, reliable background checks.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={heroItem}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button className="btn-premium h-13 px-8 text-base font-semibold" onClick={() => setShowLoginDialog(true)} style={{ height: '52px' }}>
                Try for Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <Button size="lg" variant="outline" className="h-[52px] px-8 text-base font-medium border-border/60 hover:border-primary/30 hover:bg-primary/5" onClick={() => setShowLoginDialog(true)}>
                Book Demo
              </Button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              variants={heroItem}
              className="flex flex-wrap gap-5 mt-10 justify-center lg:justify-start"
            >
              {[
                { icon: Clock, text: 'Fast Reports' },
                { icon: Link, text: 'Chain Sealed' },
                { icon: ShieldCheck, text: 'Privacy First' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Floating Verification Cards */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-[550px]">
              {/* Main Status Card */}
              <FloatingCard delay={0.4} className="absolute top-8 left-4">
                <div className="glass-premium rounded-2xl p-5 w-80 shadow-luxury">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Identity Verified</p>
                      <p className="text-xs text-muted-foreground">ID + Tax ID Match</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completed in 4.2 hrs</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Verified</span>
                  </div>
                </div>
              </FloatingCard>

              {/* Education Card */}
              <FloatingCard delay={0.6} className="absolute top-40 right-0">
                <div className="glass-premium rounded-2xl p-5 w-72 shadow-luxury">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Education Check</p>
                      <p className="text-xs text-muted-foreground">B.Tech - IIT Delhi</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <motion.div
                      className="bg-gradient-to-r from-primary to-primary/70 h-1.5 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">85% Complete</p>
                </div>
              </FloatingCard>

              {/* Court Check Card */}
              <FloatingCard delay={0.8} className="absolute bottom-28 left-0">
                <div className="glass-premium rounded-2xl p-5 w-64 shadow-luxury">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Court Check</p>
                      <p className="text-xs text-muted-foreground">No records found</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Clear</span>
                </div>
              </FloatingCard>

              {/* Blockchain Seal Card */}
              <FloatingCard delay={1.0} className="absolute bottom-2 right-8">
                <div className="glass-premium rounded-2xl p-5 shadow-luxury">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
                      <Link className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Chain Sealed</p>
                      <p className="text-xs text-muted-foreground font-mono">0x8f3a...b2c1</p>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Risk Score */}
              <FloatingCard delay={1.2} className="absolute top-0 right-16">
                <div className="glass-premium rounded-2xl p-4 shadow-luxury w-24 h-24 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-500">92</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Risk Score</span>
                </div>
              </FloatingCard>
            </div>
          </div>
        </motion.div>

        {/* Product Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 md:mt-24 pt-10 border-t border-border/30"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto lg:mx-0">
            {[
              { icon: Brain, label: 'AI-Powered Analysis' },
              { icon: Link, label: 'Chain-Sealed Records' },
              { icon: Clock, label: 'Rapid Turnaround' },
              { icon: ShieldCheck, label: 'Consent-First Design' },
            ].map((cap) => (
              <div key={cap.label} className="text-center lg:text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto lg:mx-0 mb-3">
                  <cap.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{cap.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// WHY VERISHIELD — Glass Cards with Premium Divider
// ═══════════════════════════════════════════════════════════════

function FeaturesSection() {
  const features = [
    { icon: UserCog, title: 'Self-serve Portal', desc: 'Candidates upload documents and track status independently, reducing your HR workload by 60%.' },
    { icon: ChartLine, title: 'Real-time Dashboard', desc: 'Monitor every verification in real-time with live status updates, analytics, and exception alerts.' },
    { icon: Scale, title: 'Consent-First Design', desc: 'Privacy-first architecture with explicit candidate consent, data minimization, and transparent processing at every step.' },
    { icon: Clock, title: 'Fast Turnaround', desc: 'AI-accelerated verification with identity checks completed rapidly and comprehensive reports delivered in days.' },
    { icon: FileText, title: 'White-label Reports', desc: 'Brand verification reports with your logo, colors, and custom formatting for client delivery.' },
    { icon: Plug, title: 'API Integrations', desc: 'REST APIs and webhooks for seamless integration with any HRMS, ATS, or ERP system.' },
  ];

  return (
    <Section id="features">
      {/* Premium Section Divider */}
      <SectionDivider />

      <SectionHeader
        badge="Why VeriShield"
        title="Why Teams Love VeriShield"
        description="Purpose-built features that make background verification effortless, fast, and compliant."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <motion.div
              whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              className="h-full"
            >
              <div className="h-full card-premium rounded-2xl p-7 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500 shadow-sm">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION CHECKS (Premium Cards)
// ═══════════════════════════════════════════════════════════════

function ChecksSection() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Checks' },
    { id: 'essential', label: 'Essential' },
    { id: 'enhanced', label: 'Enhanced' },
    { id: 'premium', label: 'Premium' },
  ];

  const filteredChecks = activeCategory === 'all'
    ? verificationChecks
    : verificationChecks.filter((c) => c.category === activeCategory);

  const categoryColors: Record<string, string> = {
    essential: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    enhanced: 'bg-primary/10 text-primary border-primary/20',
    premium: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  };

  return (
    <Section id="checks" className="bg-muted/30">
      <SectionHeader
        badge="Verification Checks"
        title="Comprehensive Background Checks"
        description="10 verification types covering every aspect of candidate due diligence, from identity to global databases."
      />

      {/* Premium Category Tabs */}
      <div className="flex justify-center mb-12">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm p-1">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="px-5 py-2 text-sm">
                {cat.label}
                {cat.id !== 'all' && (
                  <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                    {verificationChecks.filter((c) => c.category === cat.id).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Check Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredChecks.map((check) => {
            const Icon = getIcon(check.icon);
            return (
              <motion.div
                key={check.id}
                layout
                variants={staggerItem}
                exit={{ opacity: 0, scale: 0.92 }}
              >
                <motion.div whileHover={{ y: -4, transition: { duration: 0.3 } }}>
                  <div className="card-premium rounded-2xl p-6 h-full group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${categoryColors[check.category]}`}>
                        {check.category.charAt(0).toUpperCase() + check.category.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 tracking-tight">{check.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{check.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border/30">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>Turnaround: {check.turnaround}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTS SECTION (Premium Cards with Gradient Icons)
// ═══════════════════════════════════════════════════════════════

function ProductsSection() {
  return (
    <Section id="products">
      <SectionDivider />

      <SectionHeader
        badge="Our Products"
        title="Powered by Innovation"
        description="Six cutting-edge products that make VeriShield the most advanced verification platform."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {products.map((product) => {
          const Icon = getIcon(product.icon);
          return (
            <motion.div key={product.id} variants={staggerItem}>
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }} className="h-full">
                <div className="h-full card-premium rounded-2xl overflow-hidden group relative">
                  {/* Gradient Glow on Hover */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.04] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/[0.08] transition-all duration-700 blur-2xl" />

                  <div className="p-7 relative">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-500 shadow-sm">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${
                          product.status === 'live'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : product.status === 'beta'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {product.status === 'live' && <CircleDot className="w-2.5 h-2.5 mr-1 inline" />}
                        {product.status === 'beta' && <Sparkles className="w-2.5 h-2.5 mr-1 inline" />}
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 tracking-tight">{product.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{product.description}</p>

                    <Separator className="mb-5 opacity-50" />

                    <ul className="space-y-2.5">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// INDUSTRY SEGMENTS (Premium Glass Tabs)
// ═══════════════════════════════════════════════════════════════

function IndustrySection() {
  const { setShowLoginDialog } = useAuthStore();
  const [activeSegment, setActiveSegment] = useState(industrySegments[0].id);

  return (
    <Section className="bg-muted/30">
      <SectionHeader
        badge="Industry Solutions"
        title="Built for Your Industry"
        description="Tailored verification packages for every sector, with recommended checks and pricing."
      />

      <Tabs value={activeSegment} onValueChange={setActiveSegment} className="w-full">
        <div className="flex justify-center mb-10">
          <TabsList className="bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm flex-wrap h-auto gap-1 p-1.5">
            {industrySegments.map((segment) => {
              const Icon = getIcon(segment.icon);
              return (
                <TabsTrigger key={segment.id} value={segment.id} className="px-5 py-2.5 text-sm">
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{segment.name}</span>
                  <span className="sm:hidden">{segment.name.split('/')[0].trim()}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {industrySegments.map((segment) => (
          <TabsContent key={segment.id} value={segment.id}>
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="max-w-3xl mx-auto glass-premium rounded-2xl shadow-luxury">
                <div className="p-8 md:p-10">
                  <div className="grid md:grid-cols-3 gap-10">
                    {/* Suggested Checks */}
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <FileCheck className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Suggested Checks</h4>
                      </div>
                      <ul className="space-y-3">
                        {segment.suggestedChecks.map((check) => (
                          <li key={check} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Typical Roles */}
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Typical Roles</h4>
                      </div>
                      <ul className="space-y-3">
                        {segment.typicalRoles.map((role) => (
                          <li key={role} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Users className="w-4 h-4 text-primary shrink-0" />
                            {role}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <Star className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Price Range</h4>
                      </div>
                      <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                        <p className="text-3xl font-bold text-gradient">{segment.priceRange}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">per candidate</p>
                      </div>
                      <button className="btn-premium w-full mt-5 h-10 text-sm" onClick={() => setShowLoginDialog(true)}>
                        Get Quote
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOW IT WORKS (Premium Step Indicators)
// ═══════════════════════════════════════════════════════════════

function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      icon: UserPlus,
      title: 'Create Account',
      desc: 'Sign up in minutes. No credit card required. Get instant access to the dashboard.',
    },
    {
      num: '02',
      icon: ClipboardList,
      title: 'Invite Candidates',
      desc: 'Upload candidate details via CSV, API, or WhatsApp. Consent collection is automated.',
    },
    {
      num: '03',
      icon: LayoutDashboard,
      title: 'Monitor Dashboard',
      desc: 'Track real-time verification progress, receive AI alerts, and download sealed reports.',
    },
  ];

  return (
    <Section>
      <SectionDivider />

      <SectionHeader
        badge="Getting Started"
        title="How It Works"
        description="Three simple steps to start verifying candidates. No complex setup required."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-10 md:gap-16 relative"
      >
        {/* Gradient Connector Lines (Desktop) */}
        <div className="hidden md:block absolute top-[52px] left-[22%] right-[22%] h-px">
          <div className="w-full h-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />
        </div>

        {steps.map((step, i) => (
          <motion.div key={step.num} variants={staggerItem} className="text-center relative">
            <motion.div whileHover={{ scale: 1.03, transition: { duration: 0.3 } }}>
              <div className="relative inline-flex flex-col items-center">
                {/* Number circle with gradient fill */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-sm font-bold mb-6 relative z-10 shadow-lg shadow-primary/20">
                  {step.num}
                </div>
                {/* Icon */}
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                  <step.icon className="w-9 h-9 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING (Premium Cards with Gradient Border)
// ═══════════════════════════════════════════════════════════════

function PricingSection() {
  const { setShowLoginDialog } = useAuthStore();
  return (
    <Section id="pricing" className="bg-muted/30">
      <SectionHeader
        badge="Simple Pricing"
        title="Plans That Scale With You"
        description="Start small, grow fast. Prepaid credits or postpaid billing — your choice."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
      >
        {pricingPlans.map((plan) => (
          <motion.div key={plan.id} variants={staggerItem}>
            <motion.div whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }} className="h-full">
              <div className={`h-full relative overflow-hidden rounded-2xl transition-all duration-500 ${
                plan.popular
                  ? 'gradient-border shadow-luxury bg-card'
                  : 'card-premium'
              }`}>
                {/* Popular glow effect */}
                {plan.popular && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                )}

                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground text-[10px] font-bold px-4 py-1.5 rounded-bl-xl">
                    Most Popular
                  </div>
                )}

                <div className="relative p-8">
                  <h3 className="text-xl font-semibold mb-1 tracking-tight">{plan.name}</h3>
                  {plan.price > 0 ? (
                    <div className="mt-4 mb-6">
                      <span className="text-5xl font-bold tracking-tight">{plan.currency}{(plan.price / 1000).toFixed(0)}K</span>
                      <span className="text-muted-foreground text-sm ml-2">one-time</span>
                    </div>
                  ) : (
                    <div className="mt-4 mb-6">
                      <span className="text-5xl font-bold tracking-tight">Custom</span>
                      <span className="text-muted-foreground text-sm ml-2">postpaid</span>
                    </div>
                  )}

                  <Separator className="mb-6 opacity-50" />

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.popular ? (
                    <button className="btn-premium w-full h-12 text-base font-semibold" onClick={() => setShowLoginDialog(true)}>
                      {plan.price > 0 ? 'Get Started' : 'Contact Sales'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <Button
                      className="w-full h-12 text-base font-medium"
                      variant="outline"
                      onClick={() => setShowLoginDialog(true)}
                    >
                      {plan.price > 0 ? 'Get Started' : 'Contact Sales'}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRUST & COMPLIANCE (Premium)
// ═══════════════════════════════════════════════════════════════

function TrustSection() {
  const trustCards = [
    {
      icon: Lock,
      title: 'Secure by Default',
      desc: 'End-to-end encryption, chain-sealed records, and strict access controls across all processes.',
    },
    {
      icon: Eye,
      title: 'Privacy-First',
      desc: 'Candidate consent management, data minimization, and automatic retention policies built into every workflow.',
    },
    {
      icon: ShieldAlert,
      title: 'Audit-Ready',
      desc: 'Complete audit trails, tamper-proof logs, and instant compliance reporting for regulators and clients.',
    },
  ];

  const complianceFeatures = [
    { icon: FileCheck, title: 'Consent-First Architecture', desc: 'Every verification begins with explicit candidate consent. No data is processed without authorization.' },
    { icon: Lock, title: 'Data Encryption Standards', desc: 'All sensitive data encrypted at rest and in transit using industry-standard cryptographic protocols.' },
    { icon: Eye, title: 'Retention & Deletion Policies', desc: 'Automated data lifecycle management with configurable retention periods and secure deletion.' },
    { icon: ShieldAlert, title: 'Audit Trail Integrity', desc: 'Tamper-proof chain-sealed logs ensure every action is recorded and verifiable.' },
  ];

  return (
    <Section>
      <SectionDivider />

      <SectionHeader
        badge="Trust & Compliance"
        title="Compliance-First Architecture"
        description="Security and privacy are foundational — not afterthoughts. Built with compliance at the core."
      />

      {/* Compliance Features Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid sm:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto"
      >
        {complianceFeatures.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.3 } }} className="h-full">
              <div className="h-full flex items-start gap-4 p-6 rounded-2xl bg-primary/[0.03] border border-primary/8 hover:border-primary/20 hover:bg-primary/[0.05] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1.5 tracking-tight">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Trust Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid md:grid-cols-3 gap-8"
      >
        {trustCards.map((card) => (
          <motion.div key={card.title} variants={staggerItem}>
            <motion.div whileHover={{ y: -6, transition: { duration: 0.3 } }} className="h-full">
              <div className="h-full glass-premium rounded-2xl p-8 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-500">
                  <card.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// CTA BAND (Premium Aurora)
// ═══════════════════════════════════════════════════════════════

function CTABand() {
  const { setShowLoginDialog } = useAuthStore();

  return (
    <Section>
      <motion.div
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-aurora noise"
      >
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-60 h-60 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3 blur-2xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />

        <div className="relative z-10 p-10 md:p-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <PartyPopper className="w-7 h-7 text-primary-foreground" />
            </div>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-5 tracking-tight leading-tight">
            Ready to transform<br className="hidden sm:block" /> your hiring?
          </h2>
          <p className="text-primary-foreground/80 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
            Built for modern teams who verify faster, smarter, and safer. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="h-[52px] px-8 text-base font-semibold rounded-xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              onClick={() => setShowLoginDialog(true)}
            >
              Try for Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 h-[52px] px-8 text-base"
              onClick={() => setShowLoginDialog(true)}
            >
              Book Demo
            </Button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOTER (Premium — Gradient Border, Clean, Spacious)
// ═══════════════════════════════════════════════════════════════

function Footer() {
  const { setShowLoginDialog } = useAuthStore();
  const footerLinks = {
    Company: [
      { label: 'About Us', href: '#hero' },
      { label: 'Careers', href: '#products' },
      { label: 'Blog', href: '#checks' },
      { label: 'Contact', href: '#', onClick: () => setShowLoginDialog(true) },
    ],
    Resources: [
      { label: 'Verification Checks', href: '#checks' },
      { label: 'Products', href: '#products' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Help Center', href: '#pricing' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '#pricing' },
      { label: 'Terms of Service', href: '#pricing' },
      { label: 'Cookie Policy', href: '#pricing' },
      { label: 'Data Processing', href: '#pricing' },
    ],
  };

  return (
    <footer className="relative bg-background mt-auto">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-5 gap-12 md:gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Veri<span className="text-gradient">Shield</span>
                <span className="text-[10px] font-semibold text-primary ml-1.5 px-1.5 py-0.5 rounded-md bg-primary/10">Pro</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              AI-powered employee background verification platform. Chain-sealed records, privacy-first design, and built for modern teams.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-5 uppercase tracking-wider text-muted-foreground">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={link.onClick}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group inline-block"
                    >
                      {link.label}
                      <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 opacity-50" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VeriShield Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a key={item} href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
                {item}
                <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE (MAIN EXPORT)
// ═══════════════════════════════════════════════════════════════

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ChecksSection />
        <ProductsSection />
        <IndustrySection />
        <HowItWorksSection />
        <PricingSection />
        <TrustSection />
        <CTABand />
      </main>
      <Footer />
    </div>
  );
}

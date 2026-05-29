'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Fingerprint, Lock, Mail, Users, Sparkles, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import type { LoginCredentials, UserRole } from '@/types';

export function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(credentials);
      login(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setCredentials(prev => ({
      ...prev,
      role,
      email: role === 'admin' ? 'admin@verishield.ai' : 'user@verishield.ai',
      password: role === 'admin' ? 'admin123' : 'user123',
    }));
    setError('');
  };

  const handleDemoLogin = async (role: UserRole) => {
    handleRoleSelect(role);
    const creds: LoginCredentials = role === 'admin'
      ? { email: 'admin@verishield.ai', password: 'admin123', role: 'admin' }
      : { email: 'user@verishield.ai', password: 'user123', role: 'user' };
    setIsLoading(true);
    setError('');
    try {
      const response = await authApi.login(creds);
      login(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; description: string; subtext: string; icon: React.ElementType }[] = [
    { value: 'admin', label: 'Admin', description: 'Full system access & user management', subtext: 'Command Center', icon: Shield },
    { value: 'user', label: 'General User', description: 'View records & verification tasks', subtext: 'Workspace', icon: Users },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-mesh noise">
      {/* Aurora breathing background layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vh] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse, oklch(0.55 0.15 175 / 12%), transparent 60%)' }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vh] rounded-full opacity-25"
          style={{ background: 'radial-gradient(ellipse, oklch(0.65 0.16 55 / 8%), transparent 55%)' }}
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.95, 1.08, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, oklch(0.50 0.12 260 / 10%), transparent 50%)' }}
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Left side — Premium Branding */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-center items-center p-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg"
        >
          {/* Brand mark with floating shield */}
          <div className="flex items-center gap-4 mb-10">
            <motion.div
              className="relative"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-luxury">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              {/* Subtle glow behind shield */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl -z-10" />
            </motion.div>
            <span className="text-4xl font-bold tracking-tight text-gradient">VeriShield</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-bold mb-5 leading-[1.1] tracking-tight">
            AI-Powered{' '}
            <span className="text-gradient">Background Verification</span>{' '}
            Platform
          </h1>

          {/* Diamond separator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            <Diamond className="w-3 h-3 text-primary/40 rotate-45" />
            <Diamond className="w-2 h-2 text-primary/30 rotate-45" />
            <Diamond className="w-3 h-3 text-primary/40 rotate-45" />
            <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Enterprise-grade employee verification with chain-sealed audit trails.
            Verify faster, hire smarter, stay compliant.
          </p>

          {/* Feature items with hover animations */}
          <div className="space-y-4">
            {[
              { icon: Fingerprint, text: 'AI-driven identity verification' },
              { icon: Shield, text: 'Chain-sealed audit trails' },
              { icon: Lock, text: 'End-to-end encrypted data protection' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="group flex items-center gap-4 p-3 -ml-3 rounded-xl hover:bg-primary/5 transition-all duration-300 cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 group-hover:border-primary/20 group-hover:scale-105 transition-all duration-300">
                  <item.icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300 text-[15px]">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side — Login Form */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile logo */}
          <motion.div
            className="flex items-center gap-3 mb-8 lg:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gradient">VeriShield</span>
          </motion.div>

          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-5 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => useAuthStore.getState().setShowLoginDialog(false)}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Home
          </Button>

          {/* Premium glassmorphism card with gradient border wrapper */}
          <div className="gradient-border rounded-[20px]">
            <div className="glass-premium rounded-[20px] p-9 shadow-luxury-xl relative overflow-hidden">
              {/* Subtle inner glow at top of card */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-[26px] font-semibold mb-1.5 tracking-tight">Welcome back</h2>
                <p className="text-muted-foreground text-[15px]">Sign in to your workspace</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selector — Luxury airline seat class */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium tracking-wide uppercase text-muted-foreground/70" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
                    Select Access Level
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <AnimatePresence mode="wait">
                      {roleOptions.map((opt) => {
                        const isSelected = credentials.role === opt.value;
                        const Icon = opt.icon;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            onClick={() => handleRoleSelect(opt.value)}
                            disabled={isLoading}
                            className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border transition-all text-left overflow-hidden ${
                              isSelected
                                ? 'border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-luxury-inset'
                                : 'border-border/40 hover:border-primary/20 hover:bg-primary/[0.03]'
                            }`}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            {/* Selected gradient glow background */}
                            {isSelected && (
                              <motion.div
                                layoutId="role-glow"
                                className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4"
                                initial={false}
                                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                              />
                            )}

                            <div className="relative flex items-center gap-2.5">
                              <motion.div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted/60 text-muted-foreground'
                                }`}
                                animate={{ scale: isSelected ? 1.05 : 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                              >
                                <Icon className="w-4 h-4" />
                              </motion.div>
                              <div>
                                <span className={`text-sm font-semibold transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {opt.label}
                                </span>
                                <span className="block text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mt-0.5">
                                  {opt.subtext}
                                </span>
                              </div>
                            </div>

                            <span className="relative text-[11px] text-muted-foreground leading-relaxed pl-[42px]">
                              {opt.description}
                            </span>

                            {isSelected && (
                              <motion.div
                                layoutId="role-indicator"
                                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse-glow"
                                initial={false}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Email Input — Premium with teal glow focus */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium">User ID</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-12 h-12 rounded-xl border-border/40 bg-background/60 text-[15px] placeholder:text-muted-foreground/40 focus-visible:ring-primary/25 focus-visible:ring-offset-0 focus-visible:border-primary/40 transition-all duration-300"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input — Premium with sleek toggle */}
                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-12 pr-12 h-12 rounded-xl border-border/40 bg-background/60 text-[15px] placeholder:text-muted-foreground/40 focus-visible:ring-primary/25 focus-visible:ring-offset-0 focus-visible:border-primary/40 transition-all duration-300"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors duration-200 p-0.5 rounded-md hover:bg-muted/50"
                      tabIndex={-1}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showPassword ? 'off' : 'on'}
                          initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                          transition={{ duration: 0.15 }}
                        >
                          {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </motion.div>
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-xl bg-destructive/8 border border-destructive/15 px-4 py-3 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sign In Button — Premium gradient */}
                <motion.button
                  type="submit"
                  className="btn-premium w-full h-12 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2.5"
                  disabled={isLoading}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0, scale: 0.995 }}
                >
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2.5"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating</span>
                    </motion.div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 opacity-70" />
                      <span>Sign In as {credentials.role === 'admin' ? 'Admin' : 'General User'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Demo credentials — Premium glass cards */}
              <div className="mt-8 pt-6 border-t border-border/30">
                <p className="text-[11px] text-muted-foreground/50 text-center mb-4 uppercase tracking-[0.12em] font-medium">
                  Quick demo access
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { role: 'admin' as UserRole, label: 'Admin', email: 'admin@verishield.ai', icon: Shield },
                    { role: 'user' as UserRole, label: 'General User', email: 'user@verishield.ai', icon: Users },
                  ].map((demo) => (
                    <motion.button
                      key={demo.role}
                      onClick={() => handleDemoLogin(demo.role)}
                      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 bg-background/30 backdrop-blur-sm hover:bg-primary/[0.04] hover:border-primary/20 hover:shadow-luxury transition-all duration-300 text-xs"
                      disabled={isLoading}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                        <demo.icon className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                      </div>
                      <span className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-300">{demo.label}</span>
                      <span className="text-muted-foreground/50 text-[10px]">{demo.email}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer — Ultra-refined, minimal */}
          <motion.p
            className="text-[11px] text-muted-foreground/30 text-center mt-8 tracking-[0.04em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            &copy; {new Date().getFullYear()} VeriShield Technologies Pvt. Ltd. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

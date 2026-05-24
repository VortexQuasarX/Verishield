'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, ArrowRight, Loader2, Fingerprint, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import type { LoginCredentials } from '@/types';

export function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
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

  const fillDemo = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setCredentials({ email: 'admin@mploychek.com', password: 'admin123' });
    } else {
      setCredentials({ email: 'user@mploychek.com', password: 'user123' });
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex gradient-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.25 55 / 30%), transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.25 55 / 25%), transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, oklch(0.65 0.25 55 / 20%), transparent 70%)' }}
          animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold tracking-tight">MPloyChek</span>
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            AI-Powered{' '}
            <span className="text-primary">Background Verification</span>{' '}
            Platform
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Enterprise-grade employee verification with blockchain-secured audit trails.
            Verify faster, hire smarter, stay compliant.
          </p>

          <div className="space-y-4">
            {[
              { icon: Fingerprint, text: 'AI-driven identity verification' },
              { icon: Shield, text: 'Blockchain-secured audit trails' },
              { icon: Lock, text: 'SOC2 & ISO 27001 compliant' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-muted-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MPloyChek</span>
          </div>

          {/* Glassmorphism card */}
          <div className="glass rounded-2xl p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-1">Welcome back</h2>
              <p className="text-muted-foreground">Sign in to your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 h-11 rounded-lg border-border/50 bg-background/50"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 h-11 rounded-lg border-border/50 bg-background/50"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-11 rounded-lg text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center mb-3">Quick demo access</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => fillDemo('admin')}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs"
                  disabled={isLoading}
                >
                  <span className="font-medium text-foreground">Admin</span>
                  <span className="text-muted-foreground">admin@mploychek.com</span>
                </button>
                <button
                  onClick={() => fillDemo('user')}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs"
                  disabled={isLoading}
                >
                  <span className="font-medium text-foreground">User</span>
                  <span className="text-muted-foreground">user@mploychek.com</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            &copy; {new Date().getFullYear()} MPloyChek Technologies Pvt. Ltd. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

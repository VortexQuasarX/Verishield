'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor, Shield, Bell, Palette, Globe, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const SETTINGS_KEY = 'verishield_user_settings';

interface UserSettings {
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  twoFactor: boolean;
  alertFrequency: string;
  sessionTimeout: string;
}

function loadSettings(): UserSettings {
  if (typeof window === 'undefined') {
    return { notificationsEnabled: true, emailAlerts: true, twoFactor: false, alertFrequency: 'realtime', sessionTimeout: '24h' };
  }
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { notificationsEnabled: true, emailAlerts: true, twoFactor: false, alertFrequency: 'realtime', sessionTimeout: '24h' };
}

function saveSettings(settings: UserSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function SettingsView() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const initial = loadSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState(initial.notificationsEnabled);
  const [emailAlerts, setEmailAlerts] = useState(initial.emailAlerts);
  const [twoFactor, setTwoFactor] = useState(initial.twoFactor);
  const [alertFrequency, setAlertFrequency] = useState(initial.alertFrequency);
  const [sessionTimeout, setSessionTimeout] = useState(initial.sessionTimeout);
  const [twoFaDialogOpen, setTwoFaDialogOpen] = useState(false);
  const [twoFaEnabling, setTwoFaEnabling] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaDisableDialogOpen, setTwoFaDisableDialogOpen] = useState(false);
  const [changePwDialogOpen, setChangePwDialogOpen] = useState(false);
  const [changePwForm, setChangePwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [changePwErrors, setChangePwErrors] = useState<Record<string, string>>({});

  // Persist settings whenever they change
  useEffect(() => {
    saveSettings({ notificationsEnabled, emailAlerts, twoFactor, alertFrequency, sessionTimeout });
  }, [notificationsEnabled, emailAlerts, twoFactor, alertFrequency, sessionTimeout]);

  const showSaved = (setting: string) => {
    toast.success(`${setting} updated`, { description: 'Your preference has been saved.' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight"><span className="text-gradient">Settings</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and platform settings</p>
      </div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 card-premium shadow-luxury">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              <CardTitle className="text-base tracking-tight">Appearance</CardTitle>
            </div>
            <CardDescription>Customize how VeriShield looks on your device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); showSaved('Theme'); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all gradient-border ${
                      theme === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <opt.icon className={`w-5 h-5 ${theme === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                    {theme === opt.value && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 card-premium shadow-luxury">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <CardTitle className="text-base tracking-tight">Notifications</CardTitle>
            </div>
            <CardDescription>Configure your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive in-app notifications</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(v) => { setNotificationsEnabled(v); showSaved('Push notifications'); }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Alerts</Label>
                <p className="text-xs text-muted-foreground">Get email notifications for critical events</p>
              </div>
              <Switch
                checked={emailAlerts}
                onCheckedChange={(v) => { setEmailAlerts(v); showSaved('Email alerts'); }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Alert Frequency</Label>
                <p className="text-xs text-muted-foreground">How often to receive digest emails</p>
              </div>
              <Select value={alertFrequency} onValueChange={(v) => { setAlertFrequency(v); showSaved('Alert frequency'); }}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 card-premium shadow-luxury">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle className="text-base tracking-tight">Security</CardTitle>
            </div>
            <CardDescription>Manage your security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch
                checked={twoFactor}
                onCheckedChange={(v) => {
                  if (v) {
                    setTwoFaEnabling(true);
                    setTwoFaDialogOpen(true);
                  } else {
                    setTwoFaDisableDialogOpen(true);
                  }
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Session Timeout</Label>
                <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Select value={sessionTimeout} onValueChange={(v) => { setSessionTimeout(v); showSaved('Session timeout'); }}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="8h">8 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/50 card-premium shadow-luxury">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <CardTitle className="text-base tracking-tight">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account ID</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{user?.id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary" className="text-xs capitalize">{user?.role === 'user' ? 'General User' : user?.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge className="text-xs">Enterprise</Badge>
            </div>
            <Separator />
            <Button variant="outline" size="sm" className="w-full btn-premium" onClick={() => { setChangePwForm({ current: '', newPw: '', confirm: '' }); setChangePwErrors({}); setChangePwDialogOpen(true); }}>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- 2FA Setup Dialog ---- */}
      <Dialog open={twoFaDialogOpen} onOpenChange={(open) => {
        setTwoFaDialogOpen(open);
        if (!open && twoFaEnabling) {
          setTwoFaEnabling(false);
          setTwoFaCode('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>Secure your account with an authenticator app.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-40 h-40 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background text-xs text-center px-2">Scan with authenticator app</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Backup Code</Label>
              <div className="bg-muted rounded-md px-3 py-2 font-mono text-sm tracking-wider text-center select-all">
                ABCD-EFGH-IJKL-MNOP
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                placeholder="Enter 6-digit code"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTwoFaDialogOpen(false); setTwoFaEnabling(false); setTwoFaCode(''); }}>Cancel</Button>
            <Button onClick={() => {
              setTwoFactor(true);
              setTwoFaDialogOpen(false);
              setTwoFaEnabling(false);
              setTwoFaCode('');
              toast.success('2FA enabled', { description: 'Your account is now more secure.' });
            }}>Verify &amp; Enable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- 2FA Disable Confirmation Dialog ---- */}
      <Dialog open={twoFaDisableDialogOpen} onOpenChange={setTwoFaDisableDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>Are you sure you want to disable 2FA? This reduces your account security.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFaDisableDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              setTwoFactor(false);
              setTwoFaDisableDialogOpen(false);
              toast('2FA disabled', { description: 'Consider re-enabling for better security.' });
            }}>Disable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Change Password Dialog ---- */}
      <Dialog open={changePwDialogOpen} onOpenChange={(open) => {
        setChangePwDialogOpen(open);
        if (!open) { setChangePwForm({ current: '', newPw: '', confirm: '' }); setChangePwErrors({}); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input
                id="current-pw"
                type="password"
                placeholder="Enter current password"
                value={changePwForm.current}
                onChange={(e) => setChangePwForm((f) => ({ ...f, current: e.target.value }))}
              />
              {changePwErrors.current && <p className="text-xs text-destructive">{changePwErrors.current}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New Password</Label>
              <Input
                id="new-pw"
                type="password"
                placeholder="Enter new password"
                value={changePwForm.newPw}
                onChange={(e) => setChangePwForm((f) => ({ ...f, newPw: e.target.value }))}
              />
              {changePwErrors.newPw && <p className="text-xs text-destructive">{changePwErrors.newPw}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Confirm Password</Label>
              <Input
                id="confirm-pw"
                type="password"
                placeholder="Confirm new password"
                value={changePwForm.confirm}
                onChange={(e) => setChangePwForm((f) => ({ ...f, confirm: e.target.value }))}
              />
              {changePwErrors.confirm && <p className="text-xs text-destructive">{changePwErrors.confirm}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setChangePwDialogOpen(false); setChangePwForm({ current: '', newPw: '', confirm: '' }); setChangePwErrors({}); }}>Cancel</Button>
            <Button onClick={() => {
              const errors: Record<string, string> = {};
              if (!changePwForm.current) errors.current = 'Current password is required';
              if (!changePwForm.newPw) errors.newPw = 'New password is required';
              else if (changePwForm.newPw.length < 8) errors.newPw = 'New password must be at least 8 characters';
              if (!changePwForm.confirm) errors.confirm = 'Please confirm your new password';
              else if (changePwForm.newPw !== changePwForm.confirm) errors.confirm = 'Passwords do not match';
              if (Object.keys(errors).length > 0) {
                setChangePwErrors(errors);
                return;
              }
              setChangePwDialogOpen(false);
              setChangePwForm({ current: '', newPw: '', confirm: '' });
              setChangePwErrors({});
              toast.success('Password changed successfully');
            }}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

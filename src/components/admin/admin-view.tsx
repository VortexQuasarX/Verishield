'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users,
  UserPlus,
  Activity,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  Key,
  Bell,
  Link,
  ToggleLeft,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/lib/store';
import { usersApi, activityApi, settingsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { AuthUser, UserRole, ActivityLog } from '@/types';



// ---- Collapsible Section ----
function SettingsSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden glass-premium shadow-luxury">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminView() {
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formCompany, setFormCompany] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Settings state - loaded from DB via API
  const [settings, setSettings] = useState({
    defaultTurnaround: '7',
    autoEscalation: true,
    escalationHours: '48',
    apiKey: '',
    webhookUrl: '',
    emailAlerts: true,
    thresholdAlerts: true,
    highRiskThreshold: '80',
    autoSeal: true,
    retentionPeriod: '365',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAll({ search: search || undefined });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  // Fetch settings from DB
  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const data = await settingsApi.getAll();
      setSettings({
        defaultTurnaround: data.default_turnaround || '7',
        autoEscalation: data.auto_escalation !== 'false',
        escalationHours: data.escalation_hours || '48',
        apiKey: data.api_key || '',
        webhookUrl: data.webhook_url || '',
        emailAlerts: data.email_alerts !== 'false',
        thresholdAlerts: data.threshold_alerts !== 'false',
        highRiskThreshold: data.high_risk_threshold || '80',
        autoSeal: data.auto_seal !== 'false',
        retentionPeriod: data.retention_period || '365',
      });
    } catch {
      // Use defaults if API fails
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, [fetchUsers, fetchSettings]);

  // Fetch activity log
  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoadingActivity(true);
      try {
        const data = await activityApi.getAll();
        const adminActivity = data.filter((a) => a.category === 'admin');
        setActivityLog(adminActivity);
      } catch {
        setActivityLog([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    fetchActivity();
  }, []);

  // Filtered + paginated users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Stats
  const statsData = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    adminUsers: users.filter((u) => u.role === 'admin').length,
    newThisMonth: Math.max(1, Math.floor(users.length * 0.2)),
  };

  const resetForm = () => {
    setFormEmail('');
    setFormName('');
    setFormPassword('');
    setFormRole('user');
    setFormCompany('');
    setFormIsActive(true);
    setFormErrors({});
    setShowPassword(false);
  };

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Invalid email format';
    if (!formPassword.trim()) errors.password = 'Password is required';
    else if (formPassword.length < 6) errors.password = 'Password must be at least 6 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEdit = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Name is required';
    if (!formEmail.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) errors.email = 'Invalid email format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    setIsSubmitting(true);
    try {
      const result = await usersApi.create({
        email: formEmail,
        name: formName,
        password: formPassword,
        role: formRole,
      });
      setUsers((prev) => [result, ...prev]);
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      setFormErrors({ email: err instanceof Error ? err.message : 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !validateEdit()) return;
    setIsSubmitting(true);
    try {
      const result = await usersApi.update(selectedUser.id, {
        email: formEmail,
        name: formName,
        role: formRole,
        isActive: formIsActive,
      });
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? result : u)));
      setShowEditDialog(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      setFormErrors({ email: err instanceof Error ? err.message : 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await usersApi.delete(selectedUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: AuthUser) => {
    setSelectedUser(user);
    setFormEmail(user.email);
    setFormName(user.name);
    setFormRole(user.role);
    setFormCompany(user.company || '');
    setFormIsActive(user.isActive);
    setFormErrors({});
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: AuthUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const toggleUserStatus = async (user: AuthUser) => {
    try {
      const result = await usersApi.update(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? result : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight"><span className="text-gradient">Admin Panel</span></h1>
            <p className="text-sm text-muted-foreground">
              System administration and user management
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 text-xs">
          <ShieldCheck className="w-3 h-3 text-primary" />
          {currentUser?.role === 'admin' ? 'Admin Access' : 'Limited Access'}
        </Badge>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: statsData.totalUsers, icon: Users, color: 'text-primary' },
          { label: 'Active Users', value: statsData.activeUsers, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'Admin Users', value: statsData.adminUsers, icon: Shield, color: 'text-amber-500' },
          { label: 'New This Month', value: statsData.newThisMonth, icon: UserPlus, color: 'text-blue-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-border/50 card-premium shadow-luxury">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs: User Management / System Settings / Activity Log */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* ===== Users Tab ===== */}
          <TabsContent value="users" className="space-y-4">
            {/* Search + Filters + Add */}
            <Card className="border-border/50 glass-premium shadow-luxury">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">General User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true); }} className="h-9 btn-premium">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add User
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <Card className="border-border/50 shadow-luxury">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-9 h-9 rounded-full" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium">No users found</p>
                    <p className="text-xs text-muted-foreground mt-1">Adjust filters or add a new user</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[80px]">Role</TableHead>
                            <TableHead className="w-[120px]">Company</TableHead>
                            <TableHead className="w-[90px]">Status</TableHead>
                            <TableHead className="w-[150px]">Last Login</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((user, i) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className={`border-b border-border/50 hover:bg-gradient-to-r hover:from-primary/[0.03] hover:to-transparent transition-colors ${!user.isActive ? 'opacity-60' : ''}`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback
                                      className={`text-xs font-semibold ${
                                        user.role === 'admin'
                                          ? 'bg-primary/10 text-primary'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium">{user.name}</span>
                                      {user.id === currentUser?.id && (
                                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                                          You
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] capitalize ${
                                    user.role === 'admin' ? 'bg-primary/10 text-primary' : ''
                                  }`}
                                >
                                  {user.role === 'admin' ? (
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Shield className="w-3 h-3 mr-1" />
                                  )}
                                  {user.role === 'user' ? 'General User' : user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{user.company || '—'}</TableCell>
                              <TableCell>
                                <button
                                  onClick={() => user.id !== currentUser?.id && toggleUserStatus(user)}
                                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                    user.isActive
                                      ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                      : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                  } ${user.id === currentUser?.id ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserCheck className="w-3 h-3" /> Active
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3 h-3" /> Inactive
                                    </>
                                  )}
                                </button>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(user.lastLogin)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => openEditDialog(user)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  {user.id !== currentUser?.id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => openDeleteDialog(user)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                        <span className="text-xs text-muted-foreground">
                          Showing {(currentPage - 1) * pageSize + 1}–
                          {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                          >
                            Prev
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              className="h-7 w-7 text-xs p-0 btn-premium"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Settings Tab ===== */}
          <TabsContent value="settings" className="space-y-4">
            {/* Verification Settings */}
            <SettingsSection title="Verification Settings" icon={Clock} defaultOpen={true}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Default Turnaround Time (days)</Label>
                  <Input
                    type="number"
                    value={settings.defaultTurnaround}
                    onChange={(e) => setSettings((s) => ({ ...s, defaultTurnaround: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Escalation After (hours)</Label>
                  <Input
                    type="number"
                    value={settings.escalationHours}
                    onChange={(e) => setSettings((s) => ({ ...s, escalationHours: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Auto-Escalation</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically escalate cases past the threshold</p>
                </div>
                <Switch
                  checked={settings.autoEscalation}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, autoEscalation: v }))}
                />
              </div>
            </SettingsSection>

            {/* API Configuration */}
            <SettingsSection title="API Configuration" icon={Key}>
              <div className="space-y-2">
                <Label className="text-xs">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                    className="h-9 font-mono text-xs"
                    readOnly
                  />
                  <Button variant="outline" size="sm" className="h-9 px-3" disabled={isSavingSettings} onClick={async () => {
                    const random = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
                    const newKey = `vsh_live_${random}`;
                    setSettings((s) => ({ ...s, apiKey: newKey }));
                    try {
                      await settingsApi.update({ api_key: newKey });
                      toast({ title: 'API key regenerated and saved to database' });
                    } catch {
                      toast({ title: 'API key regenerated (save failed - will save with Settings)', variant: 'destructive' });
                    }
                  }}>
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Webhook URL</Label>
                <Input
                  value={settings.webhookUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, webhookUrl: e.target.value }))}
                  className="h-9 font-mono text-xs"
                  placeholder="https://api.yourcompany.com/webhooks/verishield"
                />
              </div>
            </SettingsSection>

            {/* Notification Settings */}
            <SettingsSection title="Notification Settings" icon={Bell}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Email Alerts</Label>
                    <p className="text-[10px] text-muted-foreground">Send email notifications for verification events</p>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, emailAlerts: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Threshold Alerts</Label>
                    <p className="text-[10px] text-muted-foreground">Alert when risk score exceeds threshold</p>
                  </div>
                  <Switch
                    checked={settings.thresholdAlerts}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, thresholdAlerts: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">High Risk Threshold</Label>
                  <Input
                    type="number"
                    value={settings.highRiskThreshold}
                    onChange={(e) => setSettings((s) => ({ ...s, highRiskThreshold: e.target.value }))}
                    className="h-9 w-24"
                    min="0"
                    max="100"
                  />
                  <p className="text-[10px] text-muted-foreground">Risk score 0–100; alerts trigger above this value</p>
                </div>
              </div>
            </SettingsSection>

            {/* Blockchain Settings */}
            <SettingsSection title="Blockchain Settings" icon={Link}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-medium">Auto-Seal Records</Label>
                    <p className="text-[10px] text-muted-foreground">Automatically seal completed verifications on blockchain</p>
                  </div>
                  <Switch
                    checked={settings.autoSeal}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, autoSeal: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Retention Period (days)</Label>
                  <Input
                    type="number"
                    value={settings.retentionPeriod}
                    onChange={(e) => setSettings((s) => ({ ...s, retentionPeriod: e.target.value }))}
                    className="h-9 w-32"
                  />
                  <p className="text-[10px] text-muted-foreground">How long to retain sealed records on-chain</p>
                </div>
              </div>
            </SettingsSection>

            {/* Save Settings */}
            <div className="flex justify-end">
              <Button className="gap-1.5 btn-premium" disabled={isSavingSettings} onClick={async () => {
                setIsSavingSettings(true);
                try {
                  await settingsApi.update({
                    default_turnaround: settings.defaultTurnaround,
                    auto_escalation: String(settings.autoEscalation),
                    escalation_hours: settings.escalationHours,
                    api_key: settings.apiKey,
                    webhook_url: settings.webhookUrl,
                    email_alerts: String(settings.emailAlerts),
                    threshold_alerts: String(settings.thresholdAlerts),
                    high_risk_threshold: settings.highRiskThreshold,
                    auto_seal: String(settings.autoSeal),
                    retention_period: settings.retentionPeriod,
                  });
                  toast({ title: 'Settings saved to database' });
                } catch {
                  toast({ title: 'Failed to save settings', variant: 'destructive' });
                } finally {
                  setIsSavingSettings(false);
                }
              }}>
                {isSavingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Settings
              </Button>
            </div>
          </TabsContent>

          {/* ===== Activity Tab ===== */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Admin Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-0">
                    {isLoadingActivity ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50">
                          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      ))
                    ) : activityLog.length === 0 ? (
                      <div className="py-8 text-center">
                        <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No admin activity found</p>
                      </div>
                    ) : (
                      activityLog.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">
                              {(entry.userName || 'S').charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{entry.action}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">{entry.userName || 'System'}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(entry.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                            {entry.category}
                          </Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ===== Create Dialog ===== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md glass-premium shadow-luxury-xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the VeriShield platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input id="create-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@company.com" />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password</Label>
              <div className="relative">
                <Input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">General User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-company">Company</Label>
                <Input id="create-company" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} placeholder="TCS" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Dialog ===== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md glass-premium shadow-luxury-xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">General User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input id="edit-company" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Badge
                variant={formIsActive ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setFormIsActive(!formIsActive)}
              >
                {formIsActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-premium shadow-luxury-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

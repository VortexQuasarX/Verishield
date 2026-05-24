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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useAuthStore } from '@/lib/store';
import { usersApi } from '@/lib/api';
import type { AuthUser, UserRole, CreateUserPayload, UpdateUserPayload } from '@/types';

export function AdminView() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setFormEmail('');
    setFormName('');
    setFormPassword('');
    setFormRole('user');
    setFormIsActive(true);
    setFormErrors({});
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
      const payload: CreateUserPayload = { email: formEmail, name: formName, password: formPassword, role: formRole };
      const newUser = await usersApi.create(payload);
      setUsers(prev => [newUser, ...prev]);
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
      const payload: UpdateUserPayload = { email: formEmail, name: formName, role: formRole, isActive: formIsActive };
      const updated = await usersApi.update(selectedUser.id, payload);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
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
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
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
    setFormIsActive(user.isActive);
    setFormErrors({});
    setShowEditDialog(true);
  };

  const openDeleteDialog = (user: AuthUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users, roles, and access control</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="h-9">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
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

      {/* Users List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : users.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust your search or add a new user</p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`border-border/50 hover:shadow-sm transition-shadow ${!user.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={`${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} text-sm font-semibold`}>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{user.name}</span>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-[9px]">You</Badge>
                          )}
                          {!user.isActive && (
                            <Badge variant="secondary" className="text-[9px] bg-muted text-muted-foreground">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Last login: {formatDate(user.lastLogin)}</p>
                      </div>

                      <Badge variant="secondary" className={`text-[10px] capitalize ${user.role === 'admin' ? 'bg-primary/10 text-primary' : ''}`}>
                        {user.role === 'admin' ? <ShieldCheck className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  const updated = await usersApi.update(user.id, { isActive: !user.isActive });
                                  setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : 'Failed to update user');
                                }
                              }}
                            >
                              {user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(user)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the MPloyChek platform.</DialogDescription>
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
              <Input id="create-password" type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimum 6 characters" />
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
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
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label>Status</Label>
              <Badge variant={formIsActive ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setFormIsActive(!formIsActive)}>
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

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
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

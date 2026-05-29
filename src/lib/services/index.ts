// =====================================================
// VeriShield - Services Index
// Centralized export of all service modules
// Following modular architecture pattern
// =====================================================

export { AuthService } from './auth-service';
export { UserService } from './user-service';
export { RecordsService } from './records-service';

export type { AuthResult } from './auth-service';
export type { UserListOptions, UserFormData } from './user-service';
export type { RecordsQuery, RecordsResult } from './records-service';

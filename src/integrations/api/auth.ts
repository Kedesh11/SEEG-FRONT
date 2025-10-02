import { api } from "@/integrations/api/client";
import { ROUTES } from "@/integrations/api/routes";

// Token storage helpers (single source of truth)
const ACCESS_TOKEN_KEY = "hcm_access_token";

export function saveAccessToken(token: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: unknown;
}

export interface CandidateSignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  matricule: string;
  date_of_birth: string; // YYYY-MM-DD
  sexe?: "M" | "F" | "Autre";
  phone?: string;
}

export interface CandidateSignupResponse {
  id: string | number;
  email: string;
  role: string;
}

export async function login(email: string, password: string) {
  // Use JSON body to avoid x-www-form-urlencoded '+' issues
  const { data } = await api.post<LoginResponse>(ROUTES.AUTH.LOGIN, {
    email,
    password,
  });
  if (data && (data as LoginResponse).access_token) {
    saveAccessToken((data as LoginResponse).access_token);
  }
  return data as LoginResponse;
}

export async function signupCandidate(payload: CandidateSignupRequest) {
  const { data } = await api.post<CandidateSignupResponse>(
    ROUTES.AUTH.SIGNUP,
    payload
  );
  return data;
}

export interface MeResponse {
  id: string | number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  matricule?: number;
}

export async function me() {
  const { data } = await api.get<MeResponse>(ROUTES.USERS.ME);
  return data;
}

export interface MatriculeVerificationResponse {
  valid: boolean;
  reason?: string | null;
  agent_matricule?: string | null;
}

export async function verifyMatricule() {
  const { data } = await api.get<MatriculeVerificationResponse>(
    ROUTES.AUTH.VERIFY_MATRICULE
  );
  return data;
}

// Admin create-user API (roles: admin | recruiter | observer)
export type AdminCreatableRole = "admin" | "recruiter" | "observer" | "observator" | "observateur";

export interface AdminCreateUserRequest {
  email: string;
  password: string;
  role: AdminCreatableRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  matricule?: string | number;
  date_of_birth?: string; // YYYY-MM-DD
}

export interface AdminCreateUserResponse {
  id: string | number;
  email: string;
  role: string;
}

export async function adminCreateUser(payload: AdminCreateUserRequest) {
  const { data } = await api.post<AdminCreateUserResponse>(
    ROUTES.AUTH.CREATE_USER,
    payload
  );
  return data;
}

export interface ForgotPasswordRequest { email: string }
export interface ForgotPasswordResponse { success: boolean; message?: string }
export async function forgotPassword(email: string) {
  const { data } = await api.post<ForgotPasswordResponse>(ROUTES.AUTH.FORGOT_PASSWORD, { email });
  return data;
}

export interface ResetPasswordRequest { token: string; new_password: string }
export interface ResetPasswordResponse { success: boolean; message?: string }
export async function resetPassword(token: string, newPassword: string) {
  const { data } = await api.post<ResetPasswordResponse>(ROUTES.AUTH.RESET_PASSWORD, { token, new_password: newPassword });
  return data;
}

export interface ChangePasswordRequest { current_password: string; new_password: string }
export interface ChangePasswordResponse { success: boolean; message?: string }
export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.post<ChangePasswordResponse>(ROUTES.AUTH.CHANGE_PASSWORD, { current_password: currentPassword, new_password: newPassword });
  return data;
}

// Refresh token (pour renouveler le token JWT)
export interface RefreshTokenRequest { refresh_token?: string }
export interface RefreshTokenResponse { access_token: string; token_type: string }
export async function refreshToken(refreshToken?: string) {
  const { data } = await api.post<RefreshTokenResponse>(`${ROUTES.AUTH.BASE}/refresh`, { refresh_token: refreshToken });
  if (data && (data as RefreshTokenResponse).access_token) {
    saveAccessToken((data as RefreshTokenResponse).access_token);
  }
  return data;
}

// Logout (déconnexion côté serveur)
export interface LogoutResponse { success: boolean; message?: string }
export async function logout() {
  try {
    const { data } = await api.post<LogoutResponse>(`${ROUTES.AUTH.BASE}/logout`);
    clearAccessToken();
    return data;
  } catch {
    // En cas d'erreur, on clear quand même le token local
    clearAccessToken();
    return { success: true, message: "Déconnexion locale réussie" };
  }
}

// Create first admin (setup initial du système)
export interface CreateFirstAdminRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}
export interface CreateFirstAdminResponse {
  id: string | number;
  email: string;
  role: string;
  message?: string;
}
export async function createFirstAdmin(payload: CreateFirstAdminRequest) {
  const { data } = await api.post<CreateFirstAdminResponse>(`${ROUTES.AUTH.BASE}/create-first-admin`, payload);
  return data;
} 
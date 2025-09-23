import { useCallback, useEffect, useMemo, useState } from "react";
import {
  login as beLoginApi,
  me as beMeApi,
  verifyMatricule as beVerifyApi,
  adminCreateUser as beAdminCreateUserApi,
  type LoginResponse,
  type MeResponse,
  type MatriculeVerificationResponse,
  type AdminCreateUserRequest,
  type AdminCreateUserResponse,
  clearAccessToken,
  saveAccessToken,
} from "@/integrations/api/auth";

export interface UseBackendAuth {
  token: string | null;
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  verifyMatricule: () => Promise<MatriculeVerificationResponse>;
  adminCreateUser: (
    payload: AdminCreateUserRequest
  ) => Promise<AdminCreateUserResponse>;
}

const ACCESS_TOKEN_KEY = "hcm_access_token";

export function useBackendAuth(): UseBackendAuth {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await beMeApi();
      setUser(data);
    } catch (e) {
      setUser(null);
      setError("Impossible de récupérer le profil");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Charger l'utilisateur au montage si un token existe
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = (await beLoginApi(email, password)) as LoginResponse;
      if (data?.access_token) {
        saveAccessToken(data.access_token);
        setToken(data.access_token);
        await refreshMe();
        return true;
      }
      setError("Identifiants invalides");
      return false;
    } catch (e) {
      setError("Erreur de connexion");
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshMe]);

  const logout = useCallback(() => {
    try {
      clearAccessToken();
    } catch {
      // noop
    }
    setToken(null);
    setUser(null);
  }, []);

  const verifyMatricule = useCallback(async () => {
    return beVerifyApi();
  }, []);

  const adminCreateUser = useCallback(async (payload: AdminCreateUserRequest) => {
    return beAdminCreateUserApi(payload);
  }, []);

  return useMemo(
    () => ({ token, user, loading, error, login, logout, refreshMe, verifyMatricule, adminCreateUser }),
    [token, user, loading, error, login, logout, refreshMe, verifyMatricule, adminCreateUser]
  );
} 
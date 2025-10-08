/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, createContext, useContext } from "react";
import { 
  login as beLoginApi, 
  signupCandidate,
  saveAccessToken, 
  clearAccessToken, 
  me as beMe,
  forgotPassword as beForgotPassword,
  resetPassword as beResetPassword,
  changePassword as beChangePassword,
  type MeResponse
} from "@/integrations/api/auth";

export interface SignUpMetadata {
  role: "candidat" | "recruteur" | "admin" | "observateur";
  first_name?: string;
  last_name?: string;
  phone?: string;
  matricule?: string;
  birth_date?: string;
  current_position?: string;
  bio?: string;
  gender?: string;
  candidate_status?: "interne" | "externe"; // Statut du candidat
}

// User simplifié (backend uniquement)
export interface BackendUser {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  matricule?: number;
  phone?: string;
  date_of_birth?: string;
}

interface AuthContextType {
  user: BackendUser | null;
  isLoading: boolean;
  isRoleLoading: boolean;
  signUp: (email: string, password: string, metadata?: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateUser: (metadata: Partial<BackendUser>) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  isCandidate: boolean;
  isRecruiter: boolean;
  isAdmin: boolean;
  isObserver: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [token, setToken] = useState<string | null>(() => {
    try { 
      return localStorage.getItem("hcm_access_token"); 
    } catch { 
      return null; 
    }
  });

  // Charger le profil utilisateur au démarrage si un token existe
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const storedToken = localStorage.getItem("hcm_access_token");
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setIsRoleLoading(true);
        const userData = await beMe();
        
        if (mounted && userData) {
          setUser({
            id: String(userData.id),
            email: userData.email,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            matricule: userData.matricule,
          });
          setToken(storedToken);
        }
      } catch (error) {
        console.warn('Failed to load user:', error);
        // Token invalide, nettoyer
        clearAccessToken();
        setToken(null);
        setUser(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsRoleLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: SignUpMetadata) => {
    try {
      // Convertir le matricule en number (l'API attend un INTEGER)
      const matriculeNum = metadata?.matricule ? parseInt(metadata.matricule, 10) : 0;
      
      // Convertir gender en sexe (M ou F uniquement, pas "Autre")
      let sexe: "M" | "F" = "M"; // Valeur par défaut
      if (metadata?.gender === 'Femme' || metadata?.gender === 'F') {
        sexe = "F";
      } else if (metadata?.gender === 'Homme' || metadata?.gender === 'M') {
        sexe = "M";
      }

      const payload = {
        email,
        password,
        first_name: metadata?.first_name || '',
        last_name: metadata?.last_name || '',
        matricule: matriculeNum,
        date_of_birth: metadata?.birth_date || '1990-01-01',
        sexe: sexe,
        phone: metadata?.phone,
      };

      // 🔍 LOG DE DÉBOGAGE - Afficher ce qui est envoyé
      console.log('📤 [SIGNUP] Payload envoyé à l\'API:', JSON.stringify(payload, null, 2));
      console.log('📤 [SIGNUP] Type de matricule:', typeof payload.matricule, '- Valeur:', payload.matricule);
      console.log('📤 [SIGNUP] Valeur de sexe:', payload.sexe);

      await signupCandidate(payload);

      return { error: null };
    } catch (error: any) {
      console.error('❌ [SIGNUP] Erreur:', error);
      return { 
        error: new Error(error?.message || "Erreur lors de l'inscription")
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await beLoginApi(email, password);
      const accessToken = response.access_token;

      if (accessToken) {
        saveAccessToken(accessToken);
        setToken(accessToken);

        // Charger le profil utilisateur
        try {
          const userData = await beMe();
          setUser({
            id: String(userData.id),
            email: userData.email,
            role: userData.role,
            first_name: userData.first_name,
            last_name: userData.last_name,
            matricule: userData.matricule,
          });
        } catch (err) {
          console.warn('Failed to load user profile after login:', err);
        }

        return { error: null };
      }

      return { error: new Error("Aucun token reçu") };
    } catch (error: any) {
      return { 
        error: new Error(error?.message || "Erreur de connexion")
      };
    }
  };

  const signOut = async () => {
    try {
      clearAccessToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
      setIsRoleLoading(false);

      // Nettoyer le localStorage
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('application_form')) {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Failed to remove localStorage key:', key);
            }
          }
        });
      }

      return { error: null };
    } catch (error: any) {
      return { 
        error: new Error(error?.message || "Erreur de déconnexion")
      };
    }
  };

  const updateUser = async (metadata: Partial<BackendUser>) => {
    try {
      // Appeler l'API backend pour mettre à jour le profil
      // Note: L'endpoint exact dépend de votre backend
      if (user) {
        setUser({ ...user, ...metadata });
      }
      return true;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await beForgotPassword(email);
      return { error: null };
    } catch (error: any) {
      return { 
        error: new Error(error?.message || "Erreur lors de la réinitialisation")
      };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await beChangePassword(currentPassword, newPassword);
      return { error: null };
    } catch (error: any) {
      return { 
        error: new Error(error?.message || "Erreur lors du changement de mot de passe")
      };
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      setIsRoleLoading(true);
      const userData = await beMe();
      
      if (userData) {
        setUser({
          id: String(userData.id),
          email: userData.email,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          matricule: userData.matricule,
        });
      }
    } catch (error) {
      console.warn('Failed to refresh user:', error);
    } finally {
      setIsRoleLoading(false);
    }
  };

  // Détermination des rôles
  const roleValue = user?.role || '';
  const roleNormalized = String(roleValue).toLowerCase();
  const isCandidate = roleNormalized === 'candidat' || roleNormalized === 'candidate';
  const isRecruiter = roleNormalized === 'recruteur' || roleNormalized === 'recruiter';
  const isAdmin = roleNormalized === 'admin';
  const isObserver = roleNormalized === 'observateur' || roleNormalized === 'observer' || roleNormalized === 'observator';

  const value = {
    user,
    isLoading,
    isRoleLoading,
    signUp,
    signIn,
    signOut,
    updateUser,
    resetPassword,
    changePassword,
    refreshUser,
    isCandidate,
    isRecruiter,
    isAdmin,
    isObserver,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    // En mode développement/test, fournir des valeurs par défaut
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.warn('useAuth called outside AuthProvider, returning default values');
      return {
        user: null,
        isLoading: false,
        isRoleLoading: false,
        signUp: async () => ({ error: null }),
        signIn: async () => ({ error: null }),
        signOut: async () => ({ error: null }),
        updateUser: async () => false,
        resetPassword: async () => ({ error: null }),
        changePassword: async () => ({ error: null }),
        refreshUser: async () => {},
        isCandidate: false,
        isRecruiter: false,
        isAdmin: false,
        isObserver: false,
        token: null,
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

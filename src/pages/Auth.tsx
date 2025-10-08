/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Mail, Lock, User, Building2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { ForgotPassword } from "@/components/auth/ForgotPassword";
import { isPreLaunch } from "@/utils/launchGate";
import { isApplicationClosed } from "@/utils/applicationUtils";
import { useBackendAuth } from "@/hooks/useBackendAuth";
import { me as beMe } from "@/integrations/api/auth";
import { signupCandidate } from "@/integrations/api/auth";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, token, signUp } = useAuth();
  const { login: beLogin, verifyMatricule: beVerifyMatricule } = useBackendAuth();
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const preLaunch = false;
  const applicationsClosed = false;

  // Deduplicate pre-launch toasts (shown in multiple places)
  const lastPreLaunchToastTs = useRef<number>(0);
  const preLaunchToast = () => {
    const now = Date.now();
    if (now - lastPreLaunchToastTs.current > 1200) {
      toast.info("Les inscriptions seront disponibles à partir du lundi 25 août 2025.");
      lastPreLaunchToastTs.current = now;
    }
  };

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = (location.state as any)?.redirect || searchParams.get('redirect');

  // Prevent duplicate success toasts on login (e.g., unexpected double submits)
  const lastLoginToastTs = useRef<number>(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    matricule: "",
    gender: "M", // Valeur par défaut
    birthDate: "", // Date de naissance
    status: "interne" as "interne" | "externe" // Statut candidat
  });

  const [matriculeError, setMatriculeError] = useState<string>("");
  const [isMatriculeValid, setIsMatriculeValid] = useState<boolean>(false);
  const [isVerifyingMatricule, setIsVerifyingMatricule] = useState<boolean>(false);
  const [lastVerifiedMatricule, setLastVerifiedMatricule] = useState<string>("");

  useEffect(() => {
    setIsMatriculeValid(false);
    setMatriculeError("");
    setLastVerifiedMatricule("");
    
    // Si externe, pas besoin de matricule
    if (signUpData.status === "externe") {
      setIsMatriculeValid(true);
      setMatriculeError("");
    }
  }, [signUpData.matricule, signUpData.status]);

  const verifyMatricule = useCallback(async (): Promise<boolean> => {
    // Si externe, le matricule n'est pas requis
    if (signUpData.status === "externe") {
      setMatriculeError("");
      setIsMatriculeValid(true);
      setLastVerifiedMatricule("");
      return true;
    }
    
    const matricule = signUpData.matricule.trim();
    if (!matricule) {
      setMatriculeError("Le matricule est requis pour les candidats internes.");
      setIsMatriculeValid(false);
      return false;
    }

    try {
      setIsVerifyingMatricule(true);
      // Si l'utilisateur est déjà authentifié côté backend, utiliser l'endpoint sécurisé
      if (token && token.length > 0) {
        try {
          const result = await beVerifyMatricule();
          if (!result?.valid) {
            setMatriculeError(result?.reason || "Matricule non valide.");
            setIsMatriculeValid(false);
            return false;
          }
          setMatriculeError("");
          setIsMatriculeValid(true);
          setLastVerifiedMatricule(matricule);
          return true;
        } catch (err) {
          setMatriculeError("Erreur lors de la vérification du matricule.");
          setIsMatriculeValid(false);
          return false;
        }
      }

      // Sinon, validation locale minimale: numérique uniquement
      if (!/^\d+$/.test(matricule)) {
        setMatriculeError("Le matricule doit contenir uniquement des chiffres.");
        setIsMatriculeValid(false);
        return false;
      }
      setMatriculeError("");
      setIsMatriculeValid(true);
      setLastVerifiedMatricule(matricule);
      return true;
    } catch (e) {
      setMatriculeError("Erreur lors de la vérification du matricule.");
      setIsMatriculeValid(false);
      return false;
    }
    finally {
      setIsVerifyingMatricule(false);
    }
  }, [signUpData.matricule, token, beVerifyMatricule]);

  useEffect(() => {
    if (!signUpData.matricule) return;
    const timer = setTimeout(() => {
      verifyMatricule();
    }, 1000); // Augmenté de 500ms à 1000ms pour réduire les appels
    return () => clearTimeout(timer);
  }, [signUpData.matricule, verifyMatricule]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Connexion backend (JWT)
      const ok = await beLogin(signInData.email, signInData.password);
      if (!ok) {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }

      // Vérification matricule backend (non bloquante)
      try {
        await beVerifyMatricule();
      } catch {
        // non bloquant
      }

      const now = Date.now();
      if (now - lastLoginToastTs.current > 1500) {
        toast.success("Connexion réussie !");
        lastLoginToastTs.current = now;
      }

      if (redirectParam) {
        navigate(redirectParam);
        return;
      }

      // Utiliser le rôle depuis le backend
      try {
        const meResp = await beMe();
        const rawRole = String(meResp?.role ?? '').toLowerCase();
        if (rawRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (rawRole === 'recruiter' || rawRole === 'observateur' || rawRole === 'observer' || rawRole === 'recruteur') {
          navigate('/recruiter/dashboard');
        } else {
          navigate('/candidate/dashboard');
        }
        return;
      } catch {
        // fallback
        navigate('/candidate/dashboard');
      }
    } catch (error) {
      toast.error("Une erreur est survenue lors de la connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (signUpData.password !== signUpData.confirmPassword) {
        toast.error("Les mots de passe ne correspondent pas");
        setIsSubmitting(false);
        return;
      }
      const okMat = await verifyMatricule();
      if (!okMat) {
        setIsSubmitting(false);
        return;
      }
      // Inscription via le hook useAuth (qui gère la conversion)
      const result = await signUp(signUpData.email, signUpData.password, {
        role: 'candidat',
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        phone: signUpData.phone,
        matricule: signUpData.status === "interne" ? signUpData.matricule : "", // Matricule seulement pour internes
        gender: signUpData.gender,
        birth_date: signUpData.birthDate || '1990-01-01', // Date saisie ou défaut
        candidate_status: signUpData.status, // Statut interne/externe
      });
      
      if (result?.error) {
        toast.error("Erreur d'inscription: " + result.error.message);
        setIsSubmitting(false);
        return;
      }
      toast.success("Compte créé ! Vous pouvez vous connecter.");
      setActiveTab('signin');
    } catch (err: any) {
      toast.error("Erreur d'inscription: " + (err?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4">
          <Link to="/">
            <Button variant="ghost" className="mb-3 sm:mb-4 text-blue-600 bg-white text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Retour à l'accueil</span>
              <span className="sm:hidden">Retour</span>
            </Button>
          </Link>
          
          <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
              Plateforme OneHCM | Talent source
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">Accès à votre compte</h1>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg opacity-90 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
              Connectez-vous ou créez votre compte pour accéder à la plateforme de recrutement SEEG
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-sm sm:max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">Authentification</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              {showForgotPassword ? (
                <ForgotPassword onBack={() => setShowForgotPassword(false)} />
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={(val) => {
                    setActiveTab(val);
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">
                      Inscription
                    </TabsTrigger>
                  </TabsList>

                  {/* Sign In Tab */}
                  <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="votre.email@exemple.com"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showSigninPassword ? "text" : "password"}
                        placeholder="Votre mot de passe"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showSigninPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        onClick={() => setShowSigninPassword((v) => !v)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto font-normal"
                      onClick={() => setShowForgotPassword(true)}
                      asChild
                    >
                      <Link to="/forgot-password">Mot de passe oublié ?</Link>
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <div className="relative">
                  {preLaunch && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      onClick={preLaunchToast}
                      aria-hidden="true"
                    />
                  )}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Sélection Statut Interne/Externe */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-semibold">Type de candidature *</Label>
                      <select
                        id="status"
                        value={signUpData.status}
                        onChange={(e) => setSignUpData({ ...signUpData, status: e.target.value as "interne" | "externe", matricule: e.target.value === "externe" ? "" : signUpData.matricule })}
                        className="flex h-11 w-full rounded-md border-2 border-primary/20 bg-background px-3 py-2 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        required
                      >
                        <option value="interne">Candidat Interne SEEG </option>
                        <option value="externe">Candidat Externe </option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {signUpData.status === "interne" 
                          ? "✓ Vous êtes employé(e) de la SEEG" 
                          : "✓ Vous n'êtes pas employé(e) de la SEEG"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                        <Input
                          id="firstName"
                          placeholder="Prénom"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                          className="text-sm"
                          required
                          disabled={false}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm">Nom</Label>
                        <Input
                          id="lastName"
                          placeholder="Nom"
                          value={signUpData.lastName}
                          onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                          className="text-sm"
                          required
                          disabled={false}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="votre.email@exemple.com"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          className="pl-10"
                          required
                          disabled={false}
                        />
                      </div>
                    </div>

                    {/* Matricule field - Visible uniquement pour les internes */}
                    {signUpData.status === "interne" && (
                      <div className="space-y-2">
                        <Label htmlFor="matricule">Matricule SEEG *</Label>
                        <div className="relative">
                          <Input
                            id="matricule"
                            placeholder="Ex: 1234"
                            title="Le matricule ne doit contenir que des chiffres."
                            value={signUpData.matricule}
                            onChange={(e) => setSignUpData({ ...signUpData, matricule: e.target.value })}
                            required={signUpData.status === "interne"}
                            className={matriculeError ? "border-destructive" : isMatriculeValid ? "border-green-500" : ""}
                            disabled={false}
                          />
                          {isVerifyingMatricule && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />)
                          }
                        </div>
                        {matriculeError && (
                          <Card className="border-red-200 bg-red-50">
                            <CardContent className="py-3 flex items-start gap-2 text-red-700">
                              <AlertCircle className="w-4 h-4 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Vérification du matricule</p>
                                <p className="text-sm">{matriculeError}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Sexe *</Label>
                        <select
                          id="gender"
                          value={signUpData.gender}
                          onChange={(e) => setSignUpData({ ...signUpData, gender: e.target.value })}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Date de naissance *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={signUpData.birthDate}
                          onChange={(e) => setSignUpData({ ...signUpData, birthDate: e.target.value })}
                          max={new Date().toISOString().split('T')[0]}
                          className="text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+241 01 23 45 67"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                        disabled={false}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Mot de passe (min. 6 caractères)"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          className="pl-10 pr-10"
                          required
                          disabled={false}
                        />
                        <button
                          type="button"
                          aria-label={showSignupPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => setShowSignupPassword((v) => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          disabled={false}
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showSignupConfirm ? "text" : "password"}
                          placeholder="Confirmez votre mot de passe"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="pl-10 pr-10"
                          required
                          disabled={false}
                        />
                        <button
                          type="button"
                          aria-label={showSignupConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          onClick={() => setShowSignupConfirm((v) => !v)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          disabled={false}
                        >
                          {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Création du compte..." : "Créer mon compte"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
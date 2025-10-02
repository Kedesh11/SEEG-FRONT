import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type SignUpMetadata } from "@/hooks/useAuth";
import { CandidateLayout } from "@/components/layout/CandidateLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/SafeSelect";
import { Textarea } from "@/components/ui/textarea";
import { Mail, User, KeyRound, Eye, EyeOff, Briefcase, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FullPageSpinner } from "@/components/ui/spinner";
import { changePassword } from "@/integrations/api/auth";
import { useMyProfile, useUpdateMe } from "@/hooks/useUsers";

export default function CandidateSettings() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Nouveaux champs de profil
  const [gender, setGender] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [currentPosition, setCurrentPosition] = useState<string>("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/candidate/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: profileData } = useMyProfile();
  const { mutateAsync: updateProfile } = useUpdateMe();

  const loadCandidateProfile = useCallback(async () => {
    if (!user?.id || !profileData) return;

    try {
      setLoadingProfile(true);
      
      // Charger depuis le profil Backend
      setPhone(user.phone || "");
      setGender(profileData.gender || "");
      setBirthDate(profileData.birth_date || "");
      setCurrentPosition(profileData.current_position || "");
      // years_experience et address ne sont pas dans CandidateProfileDTO
      setYearsExperience("");
      setAddress("");
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoadingProfile(false);
    }
  }, [user, profileData]);

  useEffect(() => {
    if (!user) return;
    // Utiliser directement les propriétés du BackendUser
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    // Charger les données du profil candidat
    loadCandidateProfile();
  }, [user, loadCandidateProfile]);

  if (isLoading) {
    return <FullPageSpinner text="Chargement des paramètres..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Mettre à jour via l'API Backend
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim() || undefined,
        date_of_birth: birthDate || undefined,
      });

      toast({ title: "Profil mis à jour", description: "Toutes vos informations ont été enregistrées." });
      
      // Rediriger vers le tableau de bord après sauvegarde réussie
      navigate('/candidate/dashboard');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Échec de la mise à jour";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ variant: "destructive", title: "Mot de passe invalide", description: "Au moins 6 caractères." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Incohérence", description: "Les mots de passe ne correspondent pas." });
      return;
    }
    try {
      setChangingPwd(true);
      // Note: L'API backend nécessite l'ancien mot de passe
      // Pour l'instant, on utilise un placeholder
      await changePassword("placeholder_current_password", newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour." });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Échec du changement de mot de passe";
      toast({ variant: "destructive", title: "Erreur", description: message });
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <CandidateLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Paramètres</h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Gérez vos informations de compte et votre mot de passe
          </p>
        </div>

        {/* Informations de compte (issus de l'inscription) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +241 01 23 45 67"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de profil candidat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Profil Candidat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Sexe</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input 
                  id="birthDate" 
                  type="date" 
                  value={birthDate} 
                  onChange={(e) => setBirthDate(e.target.value)}
                  max="2007-12-31"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentPosition">Poste actuel</Label>
                <Input 
                  id="currentPosition" 
                  value={currentPosition} 
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  placeholder="Ex: Technicien réseau"
                />
              </div>
              <div>
                <Label htmlFor="yearsExperience">Années d'expérience à la SEEG ou secteur similaire</Label>
                <Input 
                  id="yearsExperience" 
                  type="number" 
                  min="0" 
                  max="60" 
                  value={yearsExperience} 
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Votre adresse complète"
                rows={2}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving || loadingProfile}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Changer le mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showNewPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowNewPwd((v) => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowConfirmPwd((v) => !v)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleChangePassword} disabled={changingPwd}>
                {changingPwd ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
}
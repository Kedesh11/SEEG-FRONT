import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { forgotPassword as apiForgotPassword } from "@/integrations/api/auth";

interface ForgotPasswordProps {
  onBack: () => void;
  embedded?: boolean; // when true, render form content only (for usage inside Auth card)
}

export function ForgotPassword({ onBack, embedded = true }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Persist cooldown across reloads to avoid hammering
  const COOLDOWN_KEY = "pw_reset_cooldown_ts";
  const DEFAULT_COOLDOWN = 60; // seconds

  const setCooldownFor = (seconds: number) => {
    const until = Date.now() + seconds * 1000;
    try { localStorage.setItem(COOLDOWN_KEY, String(until)); } catch { /* no-op */ }
    setCooldown(seconds);
  };

  const hadCooldownAtMountRef = useRef(false);

  const getRemainingCooldown = (): number => {
    try {
      const raw = localStorage.getItem(COOLDOWN_KEY);
      if (!raw) return 0;
      const until = Number(raw);
      if (!Number.isFinite(until)) return 0;
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      return remaining;
    } catch { /* no-op */ }
    return 0;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COOLDOWN_KEY);
      const until = raw ? Number(raw) : 0;
      const remaining = until && Number.isFinite(until) ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0;
      if (remaining > 0 && cooldown === 0) setCooldown(remaining);
      hadCooldownAtMountRef.current = remaining > 0;
    } catch { /* no-op */ }

    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Veuillez saisir votre adresse email");
      return;
    }

    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      await apiForgotPassword(email.trim());
      setIsEmailSent(true);
      toast.success("Si l'adresse existe, un email a été envoyé.");
      setCooldownFor(DEFAULT_COOLDOWN);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
      toast.error("Une erreur s'est produite: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    if (embedded) {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Demande enregistrée</h2>
            <p className="text-gray-600 text-sm">
              Nous vous enverrons un lien à <strong>{email}</strong> dès que la fonctionnalité sera activée.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={() => {
                setIsEmailSent(false);
                setEmail("");
              }}
            >
              Renvoyer la demande
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3">
        <Card className="w-full max-w-sm shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-3 py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Demande enregistrée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-0">
            <div className="text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Nous vous enverrons un lien à <strong>{email}</strong> dès activation.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  setIsEmailSent(false);
                  setEmail("");
                }}
              >
                Renvoyer la demande
              </Button>
              <Button variant="ghost" className="w-full h-10" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Mot de passe oublié</h2>
          <p className="text-gray-600 text-sm">Saisissez votre adresse email pour demander un lien.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || cooldown > 0}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Button type="submit" className="w-full h-10" disabled={isLoading || cooldown > 0}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : cooldown > 0 ? (
                `Réessayez dans ${cooldown}s`
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" className="w-full h-10" onClick={onBack} disabled={isLoading || cooldown > 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </Button>
          </div>
        </form>
      </div>
    );
  }
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-3">
      <Card className="w-full max-w-sm shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-3 py-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Mot de passe oublié</CardTitle>
          <p className="text-gray-600 text-sm">Saisissez votre adresse email pour demander un lien.</p>
        </CardHeader>
        <CardContent className="py-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Adresse email</Label>
              <Input id="email" type="email" placeholder="votre.email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading || cooldown > 0} className="h-10" />
            </div>
            <div className="space-y-2">
              <Button type="submit" className="w-full h-10" disabled={isLoading || cooldown > 0}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Envoi...</>) : cooldown > 0 ? (`Réessayez dans ${cooldown}s`) : (<><Mail className="w-4 h-4 mr-2" />Envoyer la demande</>)}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-10" onClick={onBack} disabled={isLoading || cooldown > 0}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

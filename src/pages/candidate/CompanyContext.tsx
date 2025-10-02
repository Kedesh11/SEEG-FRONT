import { CandidateLayout } from "@/components/layout/CandidateLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Zap, Award, MapPin, Phone, Mail } from "lucide-react";

export default function CompanyContext() {
  return (
    <CandidateLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Contexte de l'Entreprise</h1>
          <p className="text-muted-foreground">
            Découvrez la SEEG, votre futur employeur
          </p>
        </div>

        {/* Présentation SEEG */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              À propos de la SEEG
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              La <strong>Société d'Énergie et d'Eau du Gabon (SEEG)</strong> est le principal fournisseur
              d'eau potable et d'électricité au Gabon. Depuis plus de 20 ans, nous desservons des millions
              de Gabonais avec des services essentiels de qualité.
            </p>
            <p>
              Notre mission est de fournir une énergie fiable et une eau potable de qualité à tous les Gabonais,
              tout en respectant les normes environnementales les plus strictes et en contribuant au développement
              durable du pays.
            </p>
          </CardContent>
        </Card>

        {/* Chiffres clés */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Chiffres Clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">2000+</div>
                <div className="text-sm text-muted-foreground">Employés</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">500K+</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-1">20+</div>
                <div className="text-sm text-muted-foreground">Années d'expérience</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nos valeurs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Nos Valeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Excellence</h3>
                <p className="text-sm text-muted-foreground">
                  Nous visons l'excellence dans tous nos services et opérations.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">
                  Nous innovons constamment pour améliorer nos services et notre efficacité.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Durabilité</h3>
                <p className="text-sm text-muted-foreground">
                  Nous nous engageons pour un développement durable et respectueux de l'environnement.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Intégrité</h3>
                <p className="text-sm text-muted-foreground">
                  Nous agissons avec intégrité, transparence et responsabilité.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunités de carrière */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Opportunités de Carrière
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              À la SEEG, nous croyons en l'investissement dans notre capital humain. Nous offrons:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Des programmes de formation continue et de développement professionnel</li>
              <li>Des opportunités d'évolution de carrière au sein de l'entreprise</li>
              <li>Un environnement de travail stimulant et collaboratif</li>
              <li>Des avantages sociaux compétitifs</li>
              <li>Un équilibre vie professionnelle/vie personnelle</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Nous Contacter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Siège Social: Libreville, Gabon</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>+241 01 76 70 00</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>contact@seeg.ga</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
}

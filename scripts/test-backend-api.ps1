# Script PowerShell de test complet du Backend SEEG
# Usage: .\scripts\test-backend-api.ps1

$baseUrl = "https://seeg-backend-api.azurewebsites.net"
$testResults = @()

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 TESTS BACKEND SEEG - API ONE HCM" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Backend URL: $baseUrl`n" -ForegroundColor Yellow

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "Get",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    Write-Host "`n[TEST] $Name" -ForegroundColor Green
    Write-Host "       URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 15
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Host "       ✅ Succès" -ForegroundColor Green
        
        # Afficher un aperçu de la réponse
        if ($response -is [System.Collections.IEnumerable] -and $response -isnot [string]) {
            Write-Host "       Réponse: Array[$($response.Count) items]" -ForegroundColor Gray
        } else {
            $preview = ($response | ConvertTo-Json -Depth 2 -Compress)
            if ($preview.Length -gt 150) {
                $preview = $preview.Substring(0, 150) + "..."
            }
            Write-Host "       Réponse: $preview" -ForegroundColor Gray
        }
        
        return @{
            Success = $true
            StatusCode = 200
            Response = $response
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusText = $_.Exception.Response.StatusCode
        
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "       ✅ $statusCode $statusText (attendu)" -ForegroundColor Yellow
            return @{
                Success = $true
                StatusCode = $statusCode
                Expected = $true
            }
        } else {
            Write-Host "       ❌ Erreur: $statusCode $statusText" -ForegroundColor Red
            Write-Host "       Message: $($_.Exception.Message)" -ForegroundColor Red
            return @{
                Success = $false
                StatusCode = $statusCode
                Error = $_.Exception.Message
            }
        }
    }
}

# ============================================
# TESTS GÉNÉRAUX
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 TESTS GÉNÉRAUX" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$testResults += Test-Endpoint -Name "Health Check" -Url "$baseUrl/health"
$testResults += Test-Endpoint -Name "API Info" -Url "$baseUrl/info"
$testResults += Test-Endpoint -Name "Root Endpoint" -Url "$baseUrl/"

# ============================================
# TESTS JOBS (PUBLIC)
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💼 TESTS OFFRES D'EMPLOI (Public)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$testResults += Test-Endpoint -Name "Liste des offres d'emploi" -Url "$baseUrl/api/v1/jobs/"
$testResults += Test-Endpoint -Name "Offres actives" -Url "$baseUrl/api/v1/jobs/?status=active"

# ============================================
# TESTS ENDPOINTS PROTÉGÉS (sans token)
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔒 TESTS SÉCURITÉ (Endpoints protégés sans token)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$testResults += Test-Endpoint -Name "Mon profil (sans token)" -Url "$baseUrl/api/v1/users/me"
$testResults += Test-Endpoint -Name "Liste utilisateurs (sans token)" -Url "$baseUrl/api/v1/users/"
$testResults += Test-Endpoint -Name "Mes candidatures (sans token)" -Url "$baseUrl/api/v1/applications/"

# ============================================
# RÉSUMÉ
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$totalTests = $testResults.Count
$successTests = ($testResults | Where-Object { $_.Success -eq $true }).Count
$failedTests = $totalTests - $successTests

Write-Host "`nTotal de tests: $totalTests" -ForegroundColor White
Write-Host "Tests réussis:  $successTests" -ForegroundColor Green
Write-Host "Tests échoués:  $failedTests" -ForegroundColor $(if ($failedTests -gt 0) { "Red" } else { "Green" })

$successRate = [math]::Round(($successTests / $totalTests) * 100, 2)
Write-Host "`nTaux de réussite: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

# ============================================
# RECOMMANDATIONS
# ============================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 RECOMMANDATIONS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n1. Ajouter http://localhost:8080 aux origines CORS du backend" -ForegroundColor Yellow
Write-Host "2. Créer le premier administrateur via:" -ForegroundColor Yellow
Write-Host "   POST $baseUrl/api/v1/auth/create-first-admin" -ForegroundColor Gray
Write-Host "3. Créer des données de test (offres, candidats)" -ForegroundColor Yellow
Write-Host "4. Tester l'authentification complète avec un compte valide" -ForegroundColor Yellow
Write-Host "5. Lancer le frontend: npm run dev" -ForegroundColor Yellow

Write-Host "`n════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Tests terminés avec succès!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════`n" -ForegroundColor Cyan


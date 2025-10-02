/**
 * Script de test de connexion Backend
 * Usage: node scripts/test-backend-connection.js
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://seeg-backend-api.azurewebsites.net';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🔍 Test: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, options);
    const status = response.status;
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (status >= 200 && status < 300) {
      console.log(`   ✅ Succès (${status})`);
      console.log(`   Réponse:`, JSON.stringify(data, null, 2).slice(0, 200));
      return { success: true, status, data };
    } else {
      console.log(`   ⚠️  Erreur HTTP (${status})`);
      console.log(`   Réponse:`, JSON.stringify(data, null, 2).slice(0, 200));
      return { success: false, status, data };
    }
  } catch (error) {
    console.log(`   ❌ Erreur réseau`);
    console.log(`   Message:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Test de connexion Backend SEEG');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Backend URL: ${API_BASE_URL}`);
  
  // Test 1: Health check
  await testEndpoint(
    'Health Check',
    `${API_BASE_URL}/health`
  );
  
  // Test 2: API Info
  await testEndpoint(
    'API Info',
    `${API_BASE_URL}/info`
  );
  
  // Test 3: Root endpoint
  await testEndpoint(
    'Root Endpoint',
    `${API_BASE_URL}/`
  );
  
  // Test 4: Liste des offres d'emploi (public)
  await testEndpoint(
    'Liste Offres d\'emploi',
    `${API_BASE_URL}/api/v1/jobs/`
  );
  
  // Test 5: Endpoint protégé (sans auth - doit retourner 401)
  await testEndpoint(
    'Endpoint protégé /users/me (sans token)',
    `${API_BASE_URL}/api/v1/users/me`
  );
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ Tests terminés');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Si tous les tests passent, le backend est accessible');
  console.log('   2. Tester l\'authentification avec des identifiants valides');
  console.log('   3. Démarrer le frontend: npm run dev');
  console.log('   4. Tester le flux complet dans l\'interface\n');
}

main().catch(console.error);


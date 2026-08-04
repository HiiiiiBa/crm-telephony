import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { requireRole } from '../middleware/role.middleware.js';
import { Role } from '../types/enums.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

async function runTests() {
  console.log('🧪 Démarrage des tests d\'authentification, de rôles et de sécurité...\n');
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failedCount++;
    }
  };

  try {
    // Nettoyage préalable d'un éventuel compte de test
    const testEmail = 'test.unique.user@crm-telephony.local';
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // TEST 1: Inscription d'un premier utilisateur (création automatique du workspace & rôle ADMIN)
    console.log('--- Test 1 : Inscription premier utilisateur ---');
    const regResult = await AuthService.register({
      firstName: 'Jean',
      lastName: 'Dupont',
      email: testEmail,
      password: 'SecurePassword123!',
      workspaceName: 'Test Workspace Inc',
    });

    assert(regResult.user.role === Role.ADMIN, 'Le 1er utilisateur devient automatiquement ADMIN');
    assert(Boolean(regResult.user.workspaceId), 'Un workspaceId a été attribué');
    assert(Boolean(regResult.token), 'Un token JWT valide a été généré à l\'inscription');
    assert((regResult.user as any).passwordHash === undefined, 'Le hash du mot de passe n\'est PAS exposé dans la réponse');

    // TEST 2: Email en doublon (devrait lever une erreur 409)
    console.log('\n--- Test 2 : Empêcher les doublons d\'email (409) ---');
    try {
      await AuthService.register({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: testEmail,
        password: 'AnotherPassword123!',
      });
      assert(false, 'L\'inscription avec un email déjà existant a échoué (aurait dû lever 409)');
    } catch (err: any) {
      assert(err.statusCode === 409, 'Rejet conforme avec le statut 409 Conflict pour email en doublon');
    }

    // TEST 3: Connexion avec identifiants valides
    console.log('\n--- Test 3 : Connexion valide ---');
    const loginResult = await AuthService.login({
      email: testEmail,
      password: 'SecurePassword123!',
    });

    assert(loginResult.user.email === testEmail, 'Email retourné correct');
    assert(Boolean(loginResult.token), 'Token JWT de connexion reçu');

    // Décodage et vérification de la péremption du JWT (7 jours)
    const decoded: any = jwt.verify(loginResult.token, env.JWT_SECRET);
    assert(decoded.userId === regResult.user.id, 'Payload JWT contient le bon userId');
    assert(decoded.role === Role.ADMIN, 'Payload JWT contient le bon rôle ADMIN');
    assert(Boolean(decoded.exp), 'Token contient un timestamp d\'expiration');

    // TEST 4: Connexion avec mot de passe erroné (devrait lever 401)
    console.log('\n--- Test 4 : Connexion avec mot de passe erroné (401) ---');
    try {
      await AuthService.login({
        email: testEmail,
        password: 'WrongPassword!',
      });
      assert(false, 'Le login avec mauvais mot de passe a échoué (aurait dû lever 401)');
    } catch (err: any) {
      assert(err.statusCode === 401, 'Rejet conforme avec le statut 401 Unauthorized pour mauvais mot de passe');
    }

    // TEST 5: Compte désactivé (devrait lever 403)
    console.log('\n--- Test 5 : Compte désactivé (403) ---');
    await prisma.user.update({
      where: { id: regResult.user.id },
      data: { isActive: false },
    });

    try {
      await AuthService.login({
        email: testEmail,
        password: 'SecurePassword123!',
      });
      assert(false, 'Le login d\'un compte désactivé a échoué (aurait dû lever 403)');
    } catch (err: any) {
      assert(err.statusCode === 403, 'Rejet conforme avec statut 403 Forbidden pour compte inactif');
    }

    // Ré-activation du compte pour les tests suivants
    await prisma.user.update({
      where: { id: regResult.user.id },
      data: { isActive: true },
    });

    // TEST 6: Récupération du profil connecté (getMe)
    console.log('\n--- Test 6 : Récupération profil (getMe) ---');
    const meProfile = await AuthService.getMe(regResult.user.id);
    assert(meProfile.email === testEmail, 'getMe renvoie l\'email de l\'utilisateur connecté');
    assert((meProfile as any).passwordHash === undefined, 'getMe ne renvoie jamais le mot de passe');

    // TEST 7: Contrôle des Rôles (requireRole Middleware)
    console.log('\n--- Test 7 : Middleware de rôle (requireRole) ---');
    const reqAdmin: any = { user: { role: Role.ADMIN } };
    const reqAgent: any = { user: { role: Role.AGENT } };
    const resMock: any = {
      status: (code: number) => ({
        json: (body: any) => ({ code, body }),
      }),
    };

    let adminPassed = false;
    const roleMiddlewareAdmin = requireRole(Role.ADMIN);
    roleMiddlewareAdmin(reqAdmin, resMock, () => {
      adminPassed = true;
    });
    assert(adminPassed, 'Un utilisateur ADMIN est autorisé sur une route requireRole("ADMIN")');

    let agentBlocked = false;
    roleMiddlewareAdmin(reqAgent, resMock, () => {
      agentBlocked = true;
    });
    assert(!agentBlocked, 'Un utilisateur AGENT est refusé avec 403 sur une route requireRole("ADMIN")');

    // Nettoyage final
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.workspace.deleteMany({ where: { id: regResult.user.workspaceId } });

    console.log(`\n📊 Résultats des tests : ${passedCount} réussis, ${failedCount} échoués.`);
    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur critique pendant les tests :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

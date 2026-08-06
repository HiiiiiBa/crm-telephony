import './setup.js';
import { prisma } from '../services/prisma.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UsersService } from '../modules/users/users.service.js';
import { Role } from '../types/enums.js';

async function runTests() {
  console.log('🧪 Tests module utilisateurs (invitation, rôles, désactivation)...\n');
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

  const adminEmail = 'users.test.admin@crm-telephony.local';
  const agentEmail = 'users.test.agent@crm-telephony.local';
  const managerEmail = 'users.test.manager@crm-telephony.local';

  try {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, agentEmail, managerEmail] } },
    });

    // Admin = premier compte du workspace
    console.log('--- Test 1 : Premier compte = ADMIN ---');
    const adminReg = await AuthService.register({
      firstName: 'Admin',
      lastName: 'Test',
      email: adminEmail,
      password: 'SecurePassword123!',
      workspaceName: 'Users Test Workspace',
    });
    assert(adminReg.user.role === Role.ADMIN, 'Le premier compte est ADMIN');

    const actorAdmin = {
      userId: adminReg.user.id,
      workspaceId: adminReg.user.workspaceId,
      role: Role.ADMIN,
    };

    // Invitation AGENT par défaut
    console.log('\n--- Test 2 : Invitation AGENT ---');
    const invitedAgent = await UsersService.invite(actorAdmin, {
      firstName: 'Julie',
      lastName: 'Agent',
      email: agentEmail,
      password: 'AgentPassword123!',
    });
    assert(invitedAgent.role === Role.AGENT, 'Compte invité = AGENT par défaut');
    assert(invitedAgent.workspaceId === adminReg.user.workspaceId, 'Agent dans le même workspace');

    const agentLogin = await AuthService.login({ email: agentEmail, password: 'AgentPassword123!' });
    assert(Boolean(agentLogin.token), 'Agent invité peut se connecter');

    // Invitation MANAGER par Admin
    console.log('\n--- Test 3 : Admin invite MANAGER ---');
    const invitedManager = await UsersService.invite(actorAdmin, {
      firstName: 'Marc',
      lastName: 'Manager',
      email: managerEmail,
      password: 'ManagerPassword123!',
      role: Role.MANAGER,
    });
    assert(invitedManager.role === Role.MANAGER, 'Admin peut inviter un MANAGER');

    // Manager ne peut inviter que des AGENT (rôle MANAGER ignoré)
    console.log('\n--- Test 4 : Manager limité aux AGENT ---');
    const actorManager = {
      userId: invitedManager.id,
      workspaceId: invitedManager.workspaceId,
      role: Role.MANAGER,
    };
    const managerInvite = await UsersService.invite(actorManager, {
      firstName: 'Paul',
      lastName: 'Agent',
      email: 'manager.invite.agent@crm-telephony.local',
      password: 'Password123!',
      role: Role.MANAGER,
    });
    assert(managerInvite.role === Role.AGENT, 'Manager crée toujours un AGENT même si MANAGER demandé');

    // Désactivation par Admin
    console.log('\n--- Test 5 : Désactivation compte (Admin) ---');
    await UsersService.update(actorAdmin, invitedAgent.id, { isActive: false });
    try {
      await AuthService.login({ email: agentEmail, password: 'AgentPassword123!' });
      assert(false, 'Login agent désactivé devrait échouer');
    } catch (err: any) {
      assert(err.statusCode === 403, '403 pour compte désactivé');
    }

    // Suppression par Admin
    console.log('\n--- Test 6 : Suppression compte (Admin) ---');
    await UsersService.delete(actorAdmin, invitedAgent.id);
    const deleted = await prisma.user.findUnique({ where: { email: agentEmail } });
    assert(deleted === null, 'Compte agent supprimé');

    // Nettoyage
    await prisma.user.deleteMany({
      where: { workspaceId: adminReg.user.workspaceId },
    });
    await prisma.workspace.delete({ where: { id: adminReg.user.workspaceId } });

    console.log(`\n📊 Résultats : ${passedCount} réussis, ${failedCount} échoués.`);
    if (failedCount > 0) process.exit(1);
  } catch (error) {
    console.error('❌ Erreur critique :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

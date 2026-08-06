import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../services/prisma.js';
import { env } from '../../config/env.js';
import { Role } from '../../types/enums.js';
import { RegisterDTO, LoginDTO, AuthResponse, PublicUser, UserJwtPayload } from './auth.types.js';
import { AppError } from '../../middleware/errorHandler.js';

const sanitizeUser = (user: any): PublicUser => {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
};

export class AuthService {
  /**
   * Inscription publique :
   * - 1er compte ever → ADMIN + création de l'espace de travail
   * - Comptes suivants → AGENT dans le même espace (visible page Équipe)
   */
  static async register(data: RegisterDTO): Promise<AuthResponse> {
    const emailNormalized = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      const error: AppError = new Error('Un compte existe déjà avec cette adresse email.');
      error.statusCode = 409;
      throw error;
    }

    const totalUsers = await prisma.user.count();
    const allowMultiWorkspace = process.env.ALLOW_MULTI_WORKSPACE_REGISTER === 'true';

    let targetWorkspaceId: string;
    let assignedRole: Role;

    if (totalUsers === 0) {
      const workspaceName = data.workspaceName?.trim() || `Espace ${data.firstName} ${data.lastName}`;
      const newWorkspace = await prisma.workspace.create({
        data: { name: workspaceName },
      });
      targetWorkspaceId = newWorkspace.id;
      assignedRole = Role.ADMIN;
    } else if (allowMultiWorkspace && data.workspaceName?.trim()) {
      const newWorkspace = await prisma.workspace.create({
        data: { name: data.workspaceName.trim() },
      });
      targetWorkspaceId = newWorkspace.id;
      assignedRole = Role.ADMIN;
    } else {
      const workspace = await prisma.workspace.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!workspace) {
        const error: AppError = new Error('Aucun espace de travail disponible.');
        error.statusCode = 500;
        throw error;
      }
      targetWorkspaceId = workspace.id;
      assignedRole = Role.AGENT;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: emailNormalized,
        passwordHash,
        role: assignedRole,
        isActive: true,
        phoneExtension: data.phoneExtension || null,
        workspaceId: targetWorkspaceId,
      },
    });

    // 5. Générer le JWT valide 7 jours
    const payload: UserJwtPayload = {
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Connexion utilisateur via email et mot de passe.
   */
  static async login(data: LoginDTO): Promise<AuthResponse> {
    const emailNormalized = data.email.trim().toLowerCase();

    // 1. Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      const error: AppError = new Error('Identifiants incorrects.');
      error.statusCode = 401;
      throw error;
    }

    // 2. Vérifier si le compte est actif
    if (!user.isActive) {
      const error: AppError = new Error('Ce compte a été désactivé. Veuillez contacter votre administrateur.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Comparer les mots de passe hachés avec bcrypt
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: AppError = new Error('Identifiants incorrects.');
      error.statusCode = 401;
      throw error;
    }

    // 4. Générer le JWT valide 7 jours
    const payload: UserJwtPayload = {
      userId: user.id,
      workspaceId: user.workspaceId,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      user: sanitizeUser(user),
      token,
    };
  }

  /**
   * Récupération du profil de l'utilisateur connecté via son id.
   */
  static async getMe(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workspace: true,
        team: true,
      },
    });

    if (!user) {
      const error: AppError = new Error('Utilisateur introuvable.');
      error.statusCode = 404;
      throw error;
    }

    return sanitizeUser(user);
  }

  /**
   * Membres du workspace visibles pour assignation (filtré par rôle).
   */
  static async getWorkspaceMembers(
    workspaceId: string,
    auth?: { userId: string; role: string }
  ): Promise<PublicUser[]> {
    const baseWhere = { workspaceId, isActive: true };

    if (!auth || auth.role === Role.ADMIN) {
      const users = await prisma.user.findMany({
        where: baseWhere,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });
      return users.map(sanitizeUser);
    }

    if (auth.role === Role.MANAGER) {
      const manager = await prisma.user.findFirst({
        where: { id: auth.userId, workspaceId },
        select: { teamId: true },
      });

      if (!manager?.teamId) {
        const self = await prisma.user.findFirst({ where: { id: auth.userId, ...baseWhere } });
        return self ? [sanitizeUser(self)] : [];
      }

      const users = await prisma.user.findMany({
        where: { ...baseWhere, teamId: manager.teamId },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      });
      return users.map(sanitizeUser);
    }

    const self = await prisma.user.findFirst({ where: { id: auth.userId, ...baseWhere } });
    return self ? [sanitizeUser(self)] : [];
  }

  /** Indique si c'est le tout premier compte (création espace + Admin). */
  static async getSetupStatus(): Promise<{ isFirstUser: boolean }> {
    const totalUsers = await prisma.user.count();
    return { isFirstUser: totalUsers === 0 };
  }
}

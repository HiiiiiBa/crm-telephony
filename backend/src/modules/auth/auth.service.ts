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
   * Inscription d'un nouvel utilisateur.
   * Si aucun workspaceId n'est fourni, un nouvel espace de travail est créé
   * et l'utilisateur devient automatiquement ADMIN de son workspace.
   */
  static async register(data: RegisterDTO): Promise<AuthResponse> {
    const emailNormalized = data.email.trim().toLowerCase();

    // 1. Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      const error: AppError = new Error('Un compte existe déjà avec cette adresse email.');
      error.statusCode = 409;
      throw error;
    }

    let targetWorkspaceId = data.workspaceId;
    let assignedRole = data.role || Role.AGENT;

    // 2. Si pas de workspaceId fourni -> Créer un nouveau Workspace et nommer l'utilisateur ADMIN
    if (!targetWorkspaceId) {
      const workspaceName = data.workspaceName?.trim() || `Espace ${data.firstName} ${data.lastName}`;
      const newWorkspace = await prisma.workspace.create({
        data: { name: workspaceName },
      });
      targetWorkspaceId = newWorkspace.id;
      assignedRole = Role.ADMIN; // Premier compte du workspace = ADMIN
    } else {
      // Vérifier que le workspace existe
      const wsExists = await prisma.workspace.findUnique({ where: { id: targetWorkspaceId } });
      if (!wsExists) {
        const error: AppError = new Error('Espace de travail spécifié introuvable.');
        error.statusCode = 404;
        throw error;
      }
    }

    // 3. Hacher le mot de passe avec bcrypt
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4. Créer l'utilisateur
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
}

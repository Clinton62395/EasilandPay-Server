// =============================================
// SERVICES/USER.SERVICE.JS
// Toute la logique métier pour les utilisateurs
// =============================================

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import { AppError } from "../utils/appError.utils.js";

class UserService {
  // ============================================
  // CRÉER UN NOUVEL UTILISATEUR
  // ============================================
  async createUser(userData) {
    // Commencer une transaction MongoDB
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        email,
        password,
        role,
        firstName,
        lastName,
        phone,
        companyInfo,
        realtorInfo,
      } = userData;

      // 1. Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        throw new AppError("Email already registered", 400);
      }

      // 2. Créer l'utilisateur
      const newUser = await User.create(
        [
          {
            email,
            password,
            role,
            firstName,
            lastName,
            phone,
            companyInfo: role === "company" ? companyInfo : undefined,
            realtorInfo: role === "realtor" ? realtorInfo : undefined,
          },
        ],
        { session }
      );

      // 3. Créer le wallet automatiquement pour certains rôles
      const rolesWithWallet = ["buyer", "realtor", "company"];
      if (rolesWithWallet.includes(role)) {
        await Wallet.create(
          [
            {
              userId: newUser[0]._id,
              balanceInKobo: 0,
              lockedInKobo: 0,
            },
          ],
          { session }
        );
      }

      // 4. Valider la transaction
      await session.commitTransaction();

      // Retourner l'utilisateur sans le password
      return newUser[0];
    } catch (error) {
      // Si erreur, annuler tout
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // RÉCUPÉRER UN UTILISATEUR PAR ID
  // ============================================
  async getUserById(userId) {
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // RÉCUPÉRER UN UTILISATEUR PAR EMAIL
  // ============================================
  async getUserByEmail(email) {
    // Inclure le password pour vérification lors du login
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    return user;
  }

  // ============================================
  // METTRE À JOUR LE PROFIL
  // ============================================
  async updateUserProfile(userId, updates) {
    // Empêcher la modification de certains champs sensibles
    const forbiddenFields = ["password", "email", "role", "createdAt"];
    forbiddenFields.forEach((field) => delete updates[field]);

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      {
        new: true, // Retourner le document mis à jour
        runValidators: true, // Valider les données
      }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // CHANGER LE MOT DE PASSE
  // ============================================
  async updatePassword(userId, currentPassword, newPassword) {
    // Récupérer l'utilisateur avec son password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Vérifier que le mot de passe actuel est correct
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Mettre à jour le nouveau mot de passe
    user.password = newPassword;
    await user.save(); // Le hook pre-save va hasher automatiquement

    return { message: "Password updated successfully" };
  }

  // ============================================
  // RÉCUPÉRER TOUS LES UTILISATEURS AVEC FILTRES
  // ============================================
  async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { role, isActive, search } = filters;

    // Construire la query de filtrage
    const query = {};

    // Filtrer par rôle
    if (role) {
      query.role = role;
    }

    // Filtrer par statut actif/inactif
    if (isActive !== undefined) {
      query.isActive = isActive === "true" || isActive === true;
    }

    // Recherche par nom ou email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Calculer le nombre d'éléments à sauter pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer les utilisateurs
    const users = await User.find(query)
      .select("-password") // Ne pas retourner le password
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 }); // Les plus récents d'abord

    // Compter le total pour la pagination
    const total = await User.countDocuments(query);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    };
  }

  // ============================================
  // RÉCUPÉRER LES UTILISATEURS PAR RÔLE
  // ============================================
  async getUsersByRole(role) {
    const validRoles = ["buyer", "realtor", "company", "staff", "admin"];
    if (!validRoles.includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const users = await User.find({ role, isActive: true })
      .select("-password")
      .sort({ createdAt: -1 });

    return users;
  }

  // ============================================
  // SUSPENDRE UN UTILISATEUR
  // ============================================
  async suspendUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // ACTIVER UN UTILISATEUR
  // ============================================
  async activateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: true,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // SUPPRIMER UN UTILISATEUR
  // ============================================
  async deleteUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Vérifier que l'utilisateur existe
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // 2. Vérifier que le wallet est vide (sécurité importante)
      const wallet = await Wallet.findOne({ userId }).session(session);
      if (wallet && wallet.balanceInKobo > 0) {
        throw new AppError(
          "Cannot delete user with non-zero wallet balance. Please withdraw all funds first.",
          400
        );
      }

      // 3. Supprimer le wallet s'il existe
      if (wallet) {
        await Wallet.findByIdAndDelete(wallet._id).session(session);
      }

      // 4. Supprimer l'utilisateur
      await User.findByIdAndDelete(userId).session(session);

      // 5. Valider la transaction
      await session.commitTransaction();

      return { message: "User deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // METTRE À JOUR LES INFOS BANCAIRES (REALTOR)
  // ============================================
  async updateRealtorBankDetails(realtorId, bankDetails) {
    const user = await User.findById(realtorId);

    if (!user) {
      throw new AppError("Realtor not found", 404);
    }

    if (user.role !== "realtor") {
      throw new AppError("User is not a realtor", 400);
    }

    // Mettre à jour les informations bancaires
    user.realtorInfo = {
      ...user.realtorInfo,
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        bankCode: bankDetails.bankCode,
        bankName: bankDetails.bankName,
        accountName: bankDetails.accountName,
      },
    };

    await user.save();

    return user;
  }

  // ============================================
  // RÉCUPÉRER LES STATISTIQUES DES UTILISATEURS
  // ============================================
  async getUserStatistics() {
    // Total d'utilisateurs
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Utilisateurs par rôle
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ["$isActive", 1, 0] },
          },
        },
      },
    ]);

    // Nouveaux utilisateurs (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Utilisateurs les plus récents
    const recentUsers = await User.find()
      .select("firstName lastName email role createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      newUsersLast30Days: newUsers,
      recentUsers,
    };
  }

  // ============================================
  // METTRE À JOUR LA DERNIÈRE CONNEXION
  // ============================================
  async updateLastLogin(userId) {
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
    });
  }
}

export default new UserService();

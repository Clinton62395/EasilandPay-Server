// middleware/profileValidation.js
/**
 * Middleware pour vérifier que l'utilisateur a un profil actif
 * Utilisé pour les routes sensibles
 */
export const requireActiveProfile = async (req, res, next) => {
  try {
    const user = req.user;

    // Récupérer le profil utilisateur depuis la base de données
    const userProfile = await Profile.findOne({ user: user.id });

    if (!userProfile) {
      return res.status(403).json({
        success: false,
        message: "Profil non trouvé. Veuillez compléter votre profil.",
      });
    }

    if (userProfile.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Votre profil est ${userProfile.status}. Accès non autorisé.`,
        status: userProfile.status,
      });
    }

    next();
  } catch (error) {
    console.error("Erreur de validation du profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la validation du profil",
    });
  }
};

/**
 * Middleware spécifique pour les realtors (création de propriétés)
 */
export const canCreateProperty = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.type !== "realtor") {
      return res.status(403).json({
        success: false,
        message: "Cette fonctionnalité est réservée aux realtors",
      });
    }

    const profile = await Profile.findOne({ user: user.id });

    if (!profile || profile.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Profil non actif. Vous ne pouvez pas créer de propriétés.",
        status: profile?.status || "none",
      });
    }

    req.userProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware spécifique pour les companies (investissements)
 */
export const canInvest = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.type !== "company") {
      return res.status(403).json({
        success: false,
        message: "Cette fonctionnalité est réservée aux entreprises",
      });
    }

    const profile = await Profile.findOne({ user: user.id });

    if (!profile || profile.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Profil non actif. Vous ne pouvez pas investir.",
        status: profile?.status || "none",
      });
    }

    req.userProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

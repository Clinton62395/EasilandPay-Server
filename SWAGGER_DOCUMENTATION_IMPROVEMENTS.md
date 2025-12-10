# Documentation Swagger - Améliorations Apportées à `auth.routes.js`

## Résumé des changements

La documentation Swagger du fichier `src/routes/auth.routes.js` a été complètement révisée et enrichie. Tous les endpoints sont désormais entièrement documentés avec des descriptions détaillées, paramètres, et réponses HTTP.

## 🔧 Problèmes corrigés

### 1. **Doublons supprimés**

- Suppression des doublons de documentation Swagger pour `/register`, `/login`, et `/me` (lignes 170-250)
- Consolidation en une seule documentation claire par endpoint

### 2. **Routes sans documentation → Documentées**

- ✅ `/profile` (PUT) - Mise à jour du profil utilisateur
- ✅ `/change-password` (POST) - Changement de mot de passe
- ✅ `/send-verification-email` (POST) - Renvoi d'email de vérification
- ✅ `/realtor/:id/bank-details` (PUT) - Mise à jour coordonnées bancaires
- ✅ `/users` (GET) - Liste tous les utilisateurs
- ✅ `/users/role/:role` (GET) - Filtrer utilisateurs par rôle
- ✅ `/users/:id` (GET) - Détails utilisateur
- ✅ `/statistics` (GET) - Statistiques utilisateurs
- ✅ `/users/:id/suspend` (PATCH) - Suspension utilisateur
- ✅ `/users/:id/activate` (PATCH) - Activation utilisateur
- ✅ `/users/:id` (DELETE) - Suppression utilisateur

### 3. **Incohérences d'authentification corrigées**

- ❌ `/forgot-password` et `/reset-password` **ne requièrent plus** `authenticate` (logique incorrecte : on ne peut pas s'authentifier si on a oublié le mot de passe)
  - Ancien : `router.post("/forgot-password", authenticate, ...)`
  - **Nouveau** : `router.post("/forgot-password", ...)` (public)
- ❌ `/verify-email/{token}` **ne requiert plus** `authenticate`
  - Ancien : `router.get("/verify-email/:token", authenticate, ...)`
  - **Nouveau** : `router.get("/verify-email/:token", ...)` (public)

## 📋 Structure de la documentation

Chaque endpoint documenté inclut maintenant :

1. **Summary** - Description brève en français
2. **Tags** - Catégorie (Auth / Realtor / Admin) pour Swagger UI
3. **Description** - Explication détaillée si nécessaire
4. **Parameters** - Tous les paramètres (path, query) avec types et descriptions
5. **RequestBody** - Schéma JSON avec propriétés requises/optionnelles
6. **Responses** - Codes HTTP avec descriptions :
   - **200/201** - Succès
   - **400** - Données invalides
   - **401** - Non authentifié
   - **403** - Accès refusé (permissions insuffisantes)
   - **404** - Ressource non trouvée
   - **500** - Erreur serveur

## 📝 Exemple de documentation complète

```yaml
@swagger
/change-password:
  post:
    summary: Change le mot de passe de l'utilisateur connecté
    tags: [Auth]
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - oldPassword
              - newPassword
              - confirmPassword
            properties:
              oldPassword:
                type: string
                description: Ancien mot de passe
              newPassword:
                type: string
                description: Nouveau mot de passe
              confirmPassword:
                type: string
                description: Confirmation du nouveau mot de passe
    responses:
      200:
        description: Mot de passe changé avec succès
      400:
        description: Données invalides ou ancien mot de passe incorrect
      401:
        description: Non authentifié
```

## 🔒 Groupes d'endpoints par catégorie

### **PUBLIC ROUTES** (sans authentification)

- `POST /register` - Créer un compte
- `POST /login` - Se connecter
- `POST /forgot-password` - Demander réinitialisation mot de passe
- `POST /reset-password` - Réinitialiser mot de passe
- `GET /verify-email/{token}` - Valider email

### **PROTECTED ROUTES** (authentification requise)

- `POST /refresh-token` - Renouveler token
- `POST /logout` - Déconnexion
- `GET /me` - Profil utilisateur
- `PUT /profile` - Modifier profil
- `POST /change-password` - Changer mot de passe
- `POST /send-verification-email` - Renvoyer email de vérification

### **REALTOR ROUTES** (realtor + admin)

- `PUT /realtor/{id}/bank-details` - Mettre à jour coordonnées bancaires

### **ADMIN ROUTES** (admin uniquement)

- `GET /users` - Liste utilisateurs (paginée, filtrable)
- `GET /users/role/{role}` - Filtrer par rôle
- `GET /users/{id}` - Détails d'un utilisateur
- `GET /statistics` - Statistiques globales
- `PATCH /users/{id}/suspend` - Suspendre un utilisateur
- `PATCH /users/{id}/activate` - Activer un utilisateur
- `DELETE /users/{id}` - Supprimer un utilisateur

## ✨ Points clés de la documentation

1. **Cohérence des codes HTTP** - Tous les endpoints suivent la même convention de codes HTTP
2. **Sécurité** - Clairement indiqué quels endpoints requièrent authentification/autorisation
3. **Filtrage & Pagination** - Documenté pour les endpoints de liste (page, limit, search, status)
4. **Descriptions en français** - Adapté aux utilisateurs francophones
5. **Schémas JSON détaillés** - Chaque request/response inclut le schéma complet

## 🚀 Prochaines étapes recommandées

1. **Valider les contrôleurs** - Vérifier que `AuthController` implémente tous les endpoints documentés
2. **Ajouter des exemples de réponse** - Enrichir avec des exemples JSON concrets
3. **Documenter les autres routes** - Appliquer le même modèle à :
   - `payment.routes.js`
   - `escrow.routes.js`
   - `transaction.routes.js`
   - `wallet.routes.js`
   - etc.
4. **Configurer Swagger UI** - S'assurer que la documentation est accessible via `/api-docs`
5. **Tester les endpoints** - Valider que les réponses correspondent aux schémas documentés

## 📖 Validation

Pour vérifier que votre documentation Swagger est valide :

```bash
# Installer swagger-cli (optionnel)
npm install -g swagger-cli

# Valider la documentation
swagger-cli validate src/docs/swagger.js
```

---

**Dernière mise à jour** : Décembre 2025
**Fichier modifié** : `src/routes/auth.routes.js`
**Lignes concernées** : 1-756 (totalité du fichier)

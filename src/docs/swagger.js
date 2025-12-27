import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Real Estate Transaction Platform API",
      version: "1.0.0",
      description: `
        Complete API documentation for the Real Estate Transaction Platform.
        
        ## Features
        - User management (Buyers, Realtors, Companies, Staff, Admin)
        - Property listings
        - Escrow transactions with payment plans
        - Commission management for realtors
        - Payment plans and installments
        - Content management (Editor)
        - Dispute resolution
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your_token>\`
      `,
      contact: {
        name: "API Support",
        email: "support@admin.com",
        url: "https://easilandpay-server.onrender.com",
      },
      license: {
        name: "MIT",
        url: "https://easilandpay-server.onrender.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url:
          process.env.PRODUCTION_URL ||
          "https://easilandpay-server.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                  },
                  message: {
                    type: "string",
                  },
                },
              },
            },
          },
        },

        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
            },
          },
        },

        PaginationInfo: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            count: {
              type: "integer",
              description: "Number of items in current page",
            },

            total: {
              type: "integer",
              description: "Total number of items",
            },

            page: {
              type: "integer",
              description: "Current page number",
            },

            pages: {
              type: "integer",
              description: "Total number of pages",
            },

            data: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },

        // User schemas (aligned with route request/response bodies)
        User: {
          type: "object",
          required: ["email", "role"],
          properties: {
            _id: { type: "string", description: "User ID" },
            name: {
              type: "string",
              example: "John Doe",
              description: "Full name (used in request bodies)",
            },
            fullName: { type: "string", example: "bill doumbouya" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            role: {
              type: "string",
              enum: ["buyer", "realtor", "company", "staff", "admin"],
              example: "buyer",
            },
            phone: {
              type: "string",
              example: "08012345678",
              description: "Phone as used in request bodies",
            },
            phoneNumber: { type: "string", example: "08012345678" },
            avatar: {
              type: "string",
              description: "URL or base64 avatar string",
            },
            isActive: { type: "boolean", default: true },
            isVerified: { type: "boolean", default: false },
            companyInfo: {
              type: "object",
              properties: {
                name: { type: "string" },
                registrationNumber: { type: "string" },
                address: { type: "string" },
                employeeCount: { type: "number" },
              },
            },
            realtorInfo: {
              type: "object",
              properties: {
                licenseNumber: { type: "string" },
                paystackSubaccountCode: { type: "string" },
                totalCommissionEarned: { type: "number" },
                totalCommissionPaid: { type: "number" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },

        // Authentication request/response schemas (matching route bodies)
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: { type: "string", example: "StrongP@ssw0rd" },
            role: {
              type: "string",
              enum: ["buyer", "realtor", "company"],
              example: "buyer",
            },
            phone: { type: "string", example: "08012345678" },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: { type: "string", example: "StrongP@ssw0rd" },
          },
        },

        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
          },
        },

        ResetPasswordRequest: {
          type: "object",
          required: ["token", "newPassword", "confirmPassword"],
          properties: {
            token: {
              type: "string",
              description: "Reset token received by email",
            },
            newPassword: { type: "string" },
            confirmPassword: { type: "string" },
          },
        },

        ChangePasswordRequest: {
          type: "object",
          required: ["oldPassword", "newPassword", "confirmPassword"],
          properties: {
            oldPassword: { type: "string" },
            newPassword: { type: "string" },
            confirmPassword: { type: "string" },
          },
        },

        UpdateProfileRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            avatar: { type: "string", description: "URL or base64" },
          },
        },

        RealtorBankDetailsRequest: {
          type: "object",
          required: ["bankName", "accountNumber", "accountHolder"],
          properties: {
            bankName: { type: "string" },
            accountNumber: { type: "string" },
            accountHolder: { type: "string" },
            iban: { type: "string" },
            bic: { type: "string" },
          },
        },

        // Escrow schemas
        Escrow: {
          type: "object",
          required: [
            "propertyId",
            "buyerId",
            "totalAmountInKobo",
            "paymentPlan",
          ],
          properties: {
            _id: {
              type: "string",
            },
            propertyId: {
              type: "string",
              description: "Property ID",
            },
            buyerId: {
              type: "string",
              description: "Buyer user ID",
            },
            realtorId: {
              type: "string",
              description: "Realtor user ID (optional)",
            },
            totalAmountInKobo: {
              type: "integer",
              description: "Total amount in kobo (1 NGN = 100 kobo)",
              example: 50000000,
            },
            paidAmountInKobo: {
              type: "integer",
              default: 0,
            },
            lockedAmountInKobo: {
              type: "integer",
              default: 0,
            },
            status: {
              type: "string",
              enum: [
                "CREATED",
                "ACTIVE",
                "COMPLETED",
                "DISPUTED",
                "CANCELLED",
                "REFUNDED",
              ],
              default: "CREATED",
            },
            paymentPlan: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "weekly",
                    "monthly",
                    "quarterly",
                    "bi-annual",
                    "yearly",
                    "outright",
                  ],
                },
                installments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dueDate: { type: "string", format: "date" },
                      amountInKobo: { type: "integer" },
                      status: {
                        type: "string",
                        enum: ["PENDING", "PAID", "OVERDUE", "SKIPPED"],
                      },
                    },
                  },
                },
              },
            },
            commission: {
              type: "object",
              properties: {
                percentage: { type: "number", default: 5 },
                amountInKobo: { type: "integer" },
                paidToRealtor: { type: "boolean", default: false },
              },
            },
            progressPercentage: {
              type: "integer",
              description: "Payment progress (0-100)",
            },
            totalAmount: {
              type: "number",
              description: "Total amount in Naira",
            },
            remainingAmount: {
              type: "number",
              description: "Remaining amount in Naira",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // Commission schemas
        Commission: {
          type: "object",
          required: [
            "realtorId",
            "escrowId",
            "propertyId",
            "buyerId",
            "totalCommissionInKobo",
            "commissionPercentage",
          ],
          properties: {
            _id: { type: "string" },
            realtorId: { type: "string" },
            escrowId: { type: "string" },
            propertyId: { type: "string" },
            buyerId: { type: "string" },
            totalCommissionInKobo: {
              type: "integer",
              example: 250000,
            },
            paidCommissionInKobo: {
              type: "integer",
              default: 0,
            },
            commissionPercentage: {
              type: "number",
              example: 5,
            },
            status: {
              type: "string",
              enum: ["PENDING", "PARTIAL", "PAID", "CANCELLED"],
              default: "PENDING",
            },
            totalCommission: {
              type: "number",
              description: "Total commission in Naira",
            },
            pendingCommission: {
              type: "number",
              description: "Pending commission in Naira",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // Plan schemas
        Plan: {
          type: "object",
          required: ["name", "minAmount", "maxAmount", "duration", "planType"],
          properties: {
            _id: { type: "string" },
            name: {
              type: "string",
              example: "12-Month Installment Plan",
            },
            description: { type: "string" },
            minAmount: {
              type: "integer",
              description: "Minimum amount in kobo",
              example: 1000000,
            },
            maxAmount: {
              type: "integer",
              description: "Maximum amount in kobo",
              example: 50000000,
            },
            duration: {
              type: "integer",
              description: "Duration in days",
              example: 365,
            },
            interestRate: {
              type: "number",
              example: 10,
            },
            planType: {
              type: "string",
              enum: [
                "installment",
                "savings",
                "mortgage",
                "investment",
                "rental",
              ],
            },
            numberOfInstallments: { type: "integer" },
            installmentFrequency: {
              type: "string",
              enum: [
                "daily",
                "weekly",
                "biweekly",
                "monthly",
                "quarterly",
                "yearly",
              ],
            },
            isActive: { type: "boolean", default: true },
            durationInMonths: {
              type: "number",
              description: "Duration in months (calculated)",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // Payment schemas
        TransactionResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                status: { type: "string", example: "SUCCESS" },
                transaction: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
        },

        PaymentInitializeRequest: {
          type: "object",
          required: ["amountInNaira", "user"],
          properties: {
            amountInNaira: {
              type: "number",
              example: 5000,
              description: "Amount in Nigerian Naira",
            },
            user: {
              type: "string",
              example: "64a1b2c3d4e5f67890123456",
            },
          },
        },

        PaymentInitializeResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "Payment initialized successfully",
            },
            data: {
              type: "object",
              properties: {
                paymentLink: {
                  type: "string",
                  example:
                    "https://checkout.flutterwave.com/v3/hosted/pay/abc123",
                },
                reference: {
                  type: "string",
                  example: "FLW_CREDIT_1681234567890_1234",
                },
                transactionId: {
                  type: "string",
                  example: "64a1b2c3d4e5f67890123456",
                },
              },
            },
          },
        },

        WithdrawalRequest: {
          type: "object",
          required: ["amountInNaira", "account_bank", "account_number"],
          properties: {
            amountInNaira: {
              type: "number",
              example: 10000,
              minimum: 100,
            },
            account_bank: {
              type: "string",
              example: "044",
              description: "Bank code (044 for Access Bank)",
            },
            account_number: {
              type: "string",
              example: "0690000032",
            },
            beneficiary_name: {
              type: "string",
              example: "John Doe",
            },
            user: {
              type: "string",
              example: "64a1b2c3d4e5f67890123456",
            },
          },
        },

        WebhookHeader: {
          type: "object",
          properties: {
            "verif-hash": {
              type: "string",
              description: "Flutterwave webhook signature",
              example: "flw_verif_hash_abc123",
            },
          },
        },

        // Si le schéma Transaction n'existe pas, ajoute-le aussi :
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            type: {
              type: "string",
              enum: [
                "WALLET_DEPOSIT",
                "WALLET_WITHDRAWAL",
                "ESCROW_DEPOSIT",
                "ESCROW_RELEASE_SELLER",
                "ESCROW_RELEASE_REALTOR",
                "ESCROW_REFUND",
                "COMMISSION_PAYMENT",
                "PLATFORM_FEE",
                "PROCESSING_FEE",
              ],
            },
            amountInKobo: { type: "number" },
            reference: { type: "string" },
            status: {
              type: "string",
              enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
            },
            balanceAfter: { type: "number" },
            description: { type: "string" },
            metadata: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // Editor schemas
        Editor: {
          type: "object",
          required: ["AuthorId", "title", "content"],
          properties: {
            _id: { type: "string" },
            AuthorId: { type: "string" },
            title: {
              type: "string",
              example: "Complete Guide to Real Estate Investment",
            },
            content: { type: "string" },
            paymentMethod: {
              type: "array",
              items: {
                type: "string",
                enum: ["card", "bank_transfer", "paystack", "wallet", "cash"],
              },
            },
            status: {
              type: "string",
              enum: ["draft", "published", "archived"],
              default: "draft",
            },
            tags: {
              type: "array",
              items: { type: "string" },
            },
            viewCount: { type: "integer", default: 0 },
            readTimeMinutes: {
              type: "integer",
              description: "Estimated read time (calculated)",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },

      // Common parameters
      parameters: {
        PageParam: {
          in: "query",
          name: "page",
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          description: "Page number",
        },
        LimitParam: {
          in: "query",
          name: "limit",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          description: "Number of items per page",
        },
        IdParam: {
          in: "path",
          name: "id",
          required: true,
          schema: {
            type: "string",
          },
          description: "MongoDB ObjectId",
        },
      },

      // Common responses
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Unauthorized - Invalid or missing token",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Resource not found",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Validation failed",
                errors: [
                  {
                    field: "email",
                    message: "Please provide a valid email address",
                    value: "invalid-email",
                  },
                ],
              },
            },
          },
        },
      },
    },

    // Global security (can be overridden per route)
    security: [
      {
        bearerAuth: [],
      },
    ],

    // Tags for grouping endpoints
    tags: [
      {
        name: "Auth",
        description: "User management endpoints",
      },
      {
        name: "Escrows",
        description: "Escrow transaction management",
      },
      {
        name: "Commissions",
        description: "Realtor commission management",
      },
      {
        name: "Realtors",
        description: "Realtor  management endpoint",
      },
      {
        name: "Plans",
        description: "Payment plan management",
      },
      {
        name: "Editor",
        description: "Content management",
      },
      {
        name: "Admin",
        description: "Authentication endpoints",
      },
      {
        name: "Payments",
        description: "Payment processing with Flutterwave",
      },
    ],
  },

  // Files to scan for @swagger comments
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function setupSwagger(app) {
  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Real Estate API Docs",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
      },
    })
  );

  // JSON spec endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Health check for docs
  app.get("/api-docs/health", (req, res) => {
    res.json({
      success: true,
      message: "Swagger documentation is running",
      environment: NODE_ENV,
    });
  });

  logger.info(
    `📚 Swagger Documentation available at: http://localhost:${PORT}/api-docs`
  );
  logger.info(
    `📄 Swagger JSON spec available at: http://localhost:${PORT}/api-docs.json`
  );
}

export default setupSwagger;

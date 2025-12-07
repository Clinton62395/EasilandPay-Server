import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import { logger } from "./logger.js";

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
        email: "support@realestate.com",
        url: "https://realestate.com/support",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url: process.env.PRODUCTION_URL || "https://api.realestate.com",
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

        // User schemas
        User: {
          type: "object",
          required: ["email", "password", "role", "firstName", "lastName"],
          properties: {
            _id: {
              type: "string",
              description: "User ID",
            },
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
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            phoneNumber: {
              type: "string",
              example: "08012345678",
            },
            fullName: {
              type: "string",
              example: "John Doe",
            },
            isActive: {
              type: "boolean",
              default: true,
            },
            isVerified: {
              type: "boolean",
              default: false,
            },
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
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
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
        name: "Users",
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
        name: "Plans",
        description: "Payment plan management",
      },
      {
        name: "Editor",
        description: "Content management",
      },
      {
        name: "Authentication",
        description: "Authentication endpoints",
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

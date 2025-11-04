// server/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Participium API",
      version: "1.0.0",
      description: "REST API documentation for Participium",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", example: "mariorossi" },
            password: { type: "string", example: "password123" }
          }
        },
        UserResponse: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "mariorossi" },
            email: { type: "string", format: "email", example: "mario.rossi@polito.it" },
            first_name: { type: "string", example: "Mario" },
            last_name: { type: "string", example: "Rossi" },
            role: { type: "string", example: "municipality_user" }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "first_name", "last_name", "password"],
          properties: {
            username: { type: "string", example: "giuliabianchi" },
            email: { type: "string", format: "email", example: "giulia.bianchi@comune.it" },
            first_name: { type: "string", example: "Giulia" },
            last_name: { type: "string", example: "Bianchi" },
            password: { type: "string", example: "securePassword123" }
          }
        },
        MunicipalityUserRequest: {
          type: "object",
          required: ["username", "email", "first_name", "last_name", "role"],
          properties: {
            username: { type: "string", example: "lbianchi" },
            email: { type: "string", format: "email", example: "luca.bianchi@comune.torino.it" },
            first_name: { type: "string", example: "Luca" },
            last_name: { type: "string", example: "Bianchi" },
            role: { type: "string", example: "technical_office_public_lighting" },
            department: { type: "string", example: "Direzione Infrastrutture e Mobilità" },
            temporary_password: { type: "string", example: "Init#2025" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", description: "Error message" }
          }
        }
      },
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid"
        }
      }
    },
    tags: [
      { name: "Authentication", description: "User authentication operations" },
      { name: "Citizens", description: "Citizen registration and access" },
      { name: "Municipality Users", description: "Municipal internal user management" }
    ],
    paths: {
      "/api/sessions": {
        post: {
          tags: ["Authentication"],
          summary: "Login",
          description: "Login, create user session",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
                example: {
                  username: "mariorossi",
                  password: "password123"
                }
              }
            }
          },
          responses: {
            200: {
              description: "Login successful - returns user data",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" },
                  example: {
                    id: 1,
                    username: "mariorossi",
                    email: "mario.rossi@polito.it",
                    first_name: "Mario",
                    last_name: "Rossi",
                    role: "municipality_user"
                  }
                }
              }
            },
            401: {
              description: "Unauthorized - invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    error: "Invalid credentials"
                  }
                }
              }
            },
            500: {
              description: "Internal Server Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    error: "Internal server error"
                  }
                }
              }
            }
          }
        }
      },
      "/api/sessions/current": {
        get: {
          tags: ["Authentication"],
          summary: "Get current user",
          description: "Get authenticated user information",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Success - returns authenticated user data",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" },
                  example: {
                    id: 1,
                    username: "mariorossi",
                    email: "mario.rossi@polito.it",
                    first_name: "Mario",
                    last_name: "Rossi",
                    role: "municipality_user"
                  }
                }
              }
            },
            401: {
              description: "Unauthorized - not authenticated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    error: "Not authenticated"
                  }
                }
              }
            },
            500: {
              description: "Internal Server Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    error: "Internal server error"
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ["Authentication"],
          summary: "Logout",
          description: "Logout - destroy user session",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Logout successful",
              content: {
                "application/json": {
                  example: {}
                }
              }
            },
            500: {
              description: "Internal Server Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                  example: {
                    error: "Internal server error"
                  }
                }
              }
            }
          }
        }
      },

      // 🧍 Citizen Registration
      "/api/users": {
        post: {
          tags: ["Citizens"],
          summary: "Register new citizen",
          description: "Register as a citizen to access Participium and submit reports",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } }
            }
          },
          responses: {
            201: {
              description: "Citizen registered successfully",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } }
              }
            },
            400: { description: "Validation error" },
            409: { description: "Username or email already exists" }
          }
        }
      },

      "/api/municipality-users": {
        post: {
          tags: ["Municipality Users"],
          summary: "Create a new municipality user",
          description: "Allows admin to set up internal municipality accounts",
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/MunicipalityUserRequest" } }
            }
          },
          responses: {
            201: {
              description: "Municipality user created",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } }
              }
            },
            400: { description: "Bad Request" },
            401: { description: "Unauthorized" }
          }
        },
        get: {
          tags: ["Municipality Users"],
          summary: "List municipality users",
          description: "Returns all municipality users (admin only)",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "List of municipality users",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/UserResponse" } }
                }
              }
            },
            401: { description: "Unauthorized" }
          }
        }
      },
      "/api/municipality-users/{id}": {
        get: {
          tags: ["Municipality Users"],
          summary: "Get municipality user by ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "User found",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } }
              }
            },
            404: { description: "User not found" }
          }
        },
        put: {
          tags: ["Municipality Users"],
          summary: "Update municipality user",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/MunicipalityUserRequest" } }
            }
          },
          responses: {
            200: { description: "User updated" },
            404: { description: "User not found" }
          }
        },
        delete: {
          tags: ["Municipality Users"],
          summary: "Delete municipality user",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          security: [{ cookieAuth: [] }],
          responses: {
            204: { description: "User deleted" },
            404: { description: "User not found" }
          }
        }
      }
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi, swaggerSpec };
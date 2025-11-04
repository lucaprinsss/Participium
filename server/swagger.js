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
            username: {
              type: "string",
              example: "mariorossi",
              description: "User unique username"
            },
            password: {
              type: "string",
              example: "password123",
              description: "User password"
            }
          }
        },
        UserResponse: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
              description: "User ID"
            },
            username: {
              type: "string",
              example: "mariorossi",
              description: "User unique username"
            },
            email: {
              type: "string",
              format: "email",
              example: "mario.rossi@polito.it",
              description: "User email address (not unique)"
            },
            first_name: {
              type: "string",
              example: "Mario",
              description: "User first name"
            },
            last_name: {
              type: "string",
              example: "Rossi",
              description: "User last name"
            },
            role: {
              type: "string",
              example: "municipality_user",
              description: "User role"
            }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "first_name", "last_name", "password"],
          properties: {
            username: {
              type: "string",
              example: "giuliabianchi",
              description: "User unique username"
            },
            email: {
              type: "string",
              format: "email",
              example: "giulia.bianchi@comune.it",
              description: "User email address (not unique)"
            },
            first_name: {
              type: "string",
              example: "Giulia",
              description: "User first name"
            },
            last_name: {
              type: "string",
              example: "Bianchi",
              description: "User last name"
            },
            password: {
              type: "string",
              example: "securePassword123",
              description: "User password"
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message"
            }
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
      {
        name: "Authentication",
        description: "User authentication operations"
      }
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
                schema: {
                  $ref: "#/components/schemas/LoginRequest"
                }
              }
            }
          },
          responses: {
            200: {
              description: "Login successful - returns user data",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UserResponse"
                  },
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
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
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
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
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
          description: "Get authenticated user",
          security: [{ cookieAuth: [] }],
          responses: {
            200: {
              description: "Success - returns authenticated user data",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UserResponse"
                  },
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
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
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
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
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
                  schema: {
                    type: "object",
                    properties: {}
                  }
                }
              }
            },
            500: {
              description: "Internal Server Error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
                  example: {
                    error: "Internal server error"
                  }
                }
              }
            }
          }
        }
      },
      "/api/users": {
        post: {
          tags: ["Authentication"],
          summary: "Register new user",
          description: "Create a new user account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterRequest"
                }
              }
            }
          },
          responses: {
            201: {
              description: "Registration successful - returns created user data",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UserResponse"
                  },
                  example: {
                    id: 5,
                    username: "giuliabianchi",
                    email: "giulia.bianchi@comune.it",
                    first_name: "Giulia",
                    last_name: "Bianchi",
                    role: "municipality officer"
                  }
                }
              }
            },
            400: {
              description: "Bad Request - validation error or username already exists",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
                  example: {
                    error: "Username already exists"
                  }
                }
              }
            },
            500: {
              description: "Internal Server Error",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse"
                  },
                  example: {
                    error: "Internal server error"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerUi, swaggerSpec };

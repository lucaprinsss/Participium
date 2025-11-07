// server/swagger.js
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3001;

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Participium API",
      version: "1.0.0",
      description: "REST API documentation for Participium",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session-based cookie authentication. The cookie is set automatically after login."
        },
      },
    },
    security: [
        {
            cookieAuth: [],
        },
    ],
  },
  // Paths to files containing OpenAPI (JSDoc) annotations
  apis: ["./src/routes/**/*.ts", "./src/models/dto/**/*.ts", "./src/models/entity/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export { swaggerUi, swaggerSpec };

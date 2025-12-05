// server/swagger.js
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from 'dotenv';
import { Application } from 'express';
import fs from 'node:fs';
import path from 'node:path';


dotenv.config({ debug: false });

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
  },
  // Paths to files containing OpenAPI (JSDoc) annotations
  apis: ["./src/routes/**/*.ts", "./src/models/dto/**/*.ts", "./src/models/entity/**/*.ts"],

  
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

if (process.env.NODE_ENV !== 'test') {
  const outputPath = path.join(__dirname, '..', '..', 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
  console.log('OpenAPI specification exported to openapi.json');
}

export const setupSwagger = (app: Application) => {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
  
  // UI Swagger
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerSpec));
};

export { swaggerUi, swaggerSpec };

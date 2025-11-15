"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = exports.swaggerUi = exports.setupSwagger = void 0;
// server/swagger.js
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const port = process.env.PORT || 3001;
const swaggerOptions = {
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
exports.swaggerSpec = swaggerSpec;
if (process.env.NODE_ENV !== 'test') {
    const outputPath = path_1.default.join(__dirname, '..', '..', 'openapi.json');
    fs_1.default.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log('OpenAPI specification exported to openapi.json');
}
const setupSwagger = (app) => {
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(swaggerSpec);
    });
    // UI Swagger
    app.use('/api-docs', swagger_ui_express_1.default.serve);
    app.get('/api-docs', swagger_ui_express_1.default.setup(swaggerSpec));
};
exports.setupSwagger = setupSwagger;

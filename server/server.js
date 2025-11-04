// server/server.js
import express from "express";
import cors from "cors";

import { swaggerUi, swaggerSpec } from "./swagger.js"; 

// List of imported routes


const app = express();
app.use(cors());
app.use(express.json());

// Swagger UI route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// List of API routes
//for example: app.use("/api/tickets", ticketRoutes);

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${PORT} is already in use!`);
    console.error(`Please stop the other server or use a different port.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

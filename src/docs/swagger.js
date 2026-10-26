import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-News & ePaper Studio API Documentation',
      version: '1.0.0',
      description: 'Enterprise REST API Documentation for E-News Platform & 8-Column Broadsheet ePaper Studio Engine'
    },
    servers: (() => {
      const serversList = [];
      if (env.API_BASE_URL) {
        const clean = env.API_BASE_URL.replace(/\/$/, '');
        const prodUrl = clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
        serversList.push({
          url: prodUrl,
          description: `Live Server (${clean})`
        });
      }
      serversList.push({
        url: `http://localhost:${env.PORT || 5000}/api/v1`,
        description: 'Localhost Development Server'
      });
      return serversList;
    })(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../modules/*/*.routes.js').replace(/\\/g, '/')
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📖 Swagger API Documentation initialized at /api-docs');
};

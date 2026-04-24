const path = require('path');
const fs = require('fs');
const userRoutes = require('./users');
const authRoutes = require('./auth');
const authService = require('../services/auth');
const claimsRoutes = require('./claims');
const caseFilesRoutes = require('./case-files');
const approvalsRoutes = require('./approvals');
const documentsRoutes = require('./documents');
const auditRoutes = require('./audit');
const { requireAuth } = require('../middleware/auth');

function initRoutes(app) {
    app.use('/api/v1/auth', authRoutes);
    // Compat mobile (repo école): POST /login -> POST /api/v1/auth/login
    app.post('/login', authService.login);

    // Swagger UI (sans dépendance) pour rendre le Swagger testable au navigateur
    app.get('/api/v1/docs', (req, res) => {
        res.type('text/html; charset=utf-8');
        return res.send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>AssurMoi API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0b1020; }
      .topbar { display:none; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/v1/docs/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`);
    });

    app.get('/api/v1/docs/openapi.yaml', (req, res) => {
        const filePath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'OpenAPI file not found' });
        }
        res.type('text/yaml; charset=utf-8');
        return res.send(fs.readFileSync(filePath, 'utf8'));
    });

    app.use('/api/v1/claims', claimsRoutes);
    app.use('/api/v1/case-files', caseFilesRoutes);
    app.use('/api/v1/approvals', approvalsRoutes);
    app.use('/api/v1', documentsRoutes);
    app.use('/api/v1/audit', auditRoutes);

    app.use('/user', requireAuth, userRoutes);

    app.get('/', (req, res, next) => {
        console.log('middleware 1 homepage');
        next();
    }, (req, res) => {
        console.log('Controller homepage');
        res.status(200).json({
            message: "Bienvenu sur la route d'accueil",
            api: '/api/v1',
            docs: '/api/v1/docs',
            openapi: '/api/v1/docs/openapi.yaml',
        });
    });
}

module.exports = initRoutes;

const path = require('path');
const fs = require('fs');
const userRoutes = require('./users');
const authRoutes = require('./auth');
const claimsRoutes = require('./claims');
const caseFilesRoutes = require('./case-files');
const approvalsRoutes = require('./approvals');
const documentsRoutes = require('./documents');
const auditRoutes = require('./audit');
const { requireAuth } = require('../middleware/auth');

function initRoutes(app) {
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/claims', claimsRoutes);
    app.use('/api/v1/case-files', caseFilesRoutes);
    app.use('/api/v1/approvals', approvalsRoutes);
    app.use('/api/v1', documentsRoutes);
    app.use('/api/v1/audit', auditRoutes);

    app.use('/user', requireAuth, userRoutes);

    app.get('/api/v1/docs/openapi.yaml', (req, res) => {
        const filePath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'OpenAPI file not found' });
        }
        res.type('text/yaml; charset=utf-8');
        return res.send(fs.readFileSync(filePath, 'utf8'));
    });

    app.get('/', (req, res, next) => {
        console.log('middleware 1 homepage');
        next();
    }, (req, res) => {
        console.log('Controller homepage');
        res.status(200).json({
            message: "Bienvenu sur la route d'accueil",
            api: '/api/v1',
            openapi: '/api/v1/docs/openapi.yaml',
        });
    });
}

module.exports = initRoutes;

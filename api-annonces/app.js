const express = require('express')
const app = express();
const path = require('path');
require('dotenv').config()
const cors = require('cors')
const initRoutes = require('./routes');

const PORT = process.env.PORT || 3000
app.use(express.json());

// Serve uploaded files (local dev storage)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  cors({
    // Ne pas utiliser origin="*" avec credentials=true (bloqué par les navigateurs).
    // On autorise le front Vite en dev + autres origines dev courantes.
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/Postman
      const allowed = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://example.com',
      ];
      if (allowed.includes(origin)) return cb(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
  })
);

initRoutes(app);

app.listen(PORT, () => {
    console.log('server running on port ', PORT)
})

module.exports = app;

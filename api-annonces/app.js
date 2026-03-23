const express = require('express')
const app = express();
require('dotenv').config()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log('server running on port ', PORT)
})

module.exports = app;

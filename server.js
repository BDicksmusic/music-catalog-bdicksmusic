const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('<h1>🎵 Music Catalog - Test Version</h1><p>Server is working!</p>');
});

app.get('/test', (req, res) => {
    res.send('<h1>TEST ROUTE WORKING!</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ SIMPLE SERVER RUNNING ON PORT: ${PORT}`);
});
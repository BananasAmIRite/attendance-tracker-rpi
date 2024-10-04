const express = require('express');
const path = require('path');

const app = express();
app.use(express.static('build'));
app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.resolve('build', 'index.html')));

app.listen(3000, () => {
    console.log('Frontend started on port 3000');
});

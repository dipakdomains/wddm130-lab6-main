const express = require('express');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
res.render('form');
});


app.listen(3000, () => {
console.log('Server running on http://localhost:3000');
});
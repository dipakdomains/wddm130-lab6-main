const express = require('express');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:false}));


app.get('/', (req, res) => {
    res.render('form');
});

//To handle the form info
app.post('/process', (req, res) => {
   
    var name = req.body.name;
    var email = req.body.email;
    var postal = req.body.postcode;
    var phNo = req.body.phone;
    var needLunch = req.body.lunch;
    var numTickets = req.body.tickets;
    var campus= req.body.campus;

    console.log(`${needLunch} -- ${numTickets} -- ${campus}`);

    res.redirect('/');
});





app.listen(3000, () => {
console.log('Server running on http://localhost:3000');
});
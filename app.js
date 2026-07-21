require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
app.use(fileUpload());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:false}));
const {check, validationResult} = require('express-validator');

mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});
mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB connection error:', err.message);
});

const Order = mongoose.model('Order', {
    name: String,
    email: String,
    phone: String,
    postcode: String,
    lunch: Boolean,
    tickets: Number,
    campus: String,
    subtotal: Number,
    tax: Number,
    total: Number,
    imPath: String,
    createdAt: { type: Date, default: Date.now }
});

app.get('/', (req, res) => {
    res.render('form');
});

//To handle the form info
app.post('/process',[
    check('name', 'Must have a name').notEmpty(),
    check('email', 'Must have email').isEmail(),
    check('lunch','Should Select (Lunch Yes/No)').notEmpty(),
    check('tickets','Should Select at least one Ticket').notEmpty(),
    check('campus','Should Select a campus').notEmpty(),
    check('postcode','Invalid Postal Code').matches(/^[a-zA-Z]\d[a-zA-Z]\s\d[a-zA-Z]\d$/),
    check('phone','Invalid Phone No').matches(/^\d{3}(\s|-)\d{3}(\s|-)\d{4}$/),
    check('tickets', 'Tickets must be a valid number.').isNumeric(),
    check('lunch').custom(async (val, { req })=>{
        if(val === "yes" && Number(req.body.tickets) < 3){
            throw new Error('Lunch can only be purchased when buying 3 or more tickets.');
        }
    }),
    check('tickets').custom(async (val) =>{
        if(isNaN(val) || Number(val) <= 0){
            throw new Error('Tickets must be a valid number.');
        }})
    ],
 (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        //when there are errors in form, re-render with entered values preserved
        res.render('form', {errorInfo: errors.array(), formData: req.body});
    }else{

        //when no errors in form
        var name = req.body.name;
        var email = req.body.email;
        var postal = req.body.postcode;
        var phNo = req.body.phone;
        var needLunch = req.body.lunch;
        var numTickets = Number(req.body.tickets);
        var campus = req.body.campus;

        //File Handling to accept and store the incoming image
        var imName = '';
        if (req.files && req.files.myImage) {
            imName = req.files.myImage.name;
            var image = req.files.myImage;
            var dest = 'public/images/' + imName;
            image.mv(dest, (err) => {
                if (err) console.log(err);
            });
        }

        var lunchCost = needLunch === "yes" ? 60 : 0;
        var ticketCost = numTickets * 100;
        var sub = lunchCost + ticketCost;
        var taxAmount = 0.13 * sub;
        var totalAmount = 1.13 * sub;

        var newOrder = new Order({
            name: name,
            email: email,
            phone: phNo,
            postcode: postal,
            lunch: needLunch === "yes",
            tickets: numTickets,
            campus: campus,
            subtotal: sub,
            tax: taxAmount,
            total: totalAmount,
            imPath: imName ? 'images/' + imName : ''
        });

        newOrder.save().then((data)=>{
            console.log("Data Saved to MongoDB");
        }).catch((err)=>{
            console.log("Error in saving to MongoDB:", err.message);
        });

        var recpt = {
            'name': name,
            'lunchCost': lunchCost,
            'ticketCost': ticketCost,
            'subTotal': sub,
            'taxes': taxAmount,
            'total': totalAmount,
            'image': imName ? 'images/' + imName : ''
        };
        res.render('form', {receipt: recpt});
    }

});

app.get('/submissions', (req, res) => {
    Order.find().sort({ createdAt: -1 }).then((data)=>{
        res.render('submissions', {orders: data});
    }).catch((err)=>{
        console.log("DB Reading Error:", err.message);
        res.render('submissions', {orders: []});
    });
});

app.listen(3001, () => {
  console.log("My app is running on http://localhost:3001");
});
const express = require('express');
const path = require('path');
const app = express();
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose'); //Adding mongoose to connect to MongoDb
app.use(fileUpload());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended:false}));
const {check, validationResult} = require('express-validator'); // ES6 standard for destructuring an object

mongoose.connect("mongodb+srv://gayan:1q2w3e4r@cluster0.ewtfalj.mongodb.net/Lab-7")

const Order = mongoose.model('Order', {
    name: String,
    email: String,
    phone: String,
    postcode: String,
    lunch:String,
    tickets:Number,
    campus:String,
    imPath:String
}

)

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

    check('lunch').custom(async (val, { req })=>{
        if(val == "yes" && req.body.tickets < 2){
            throw new Error('If lunch selected, need at least 2 tickets');
        }
    }),
    check('tickets').custom(async (val) =>{
        if(isNaN(val) || val < 0){
            throw new Error('Either the input is not a number or Number < 0');
        }})
    ],
 (req, res) => {
   
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        //when there are errors in form
        res.render('form', {errorInfo: errors.array()} );
    }else{

        //when no errors in form
        var name = req.body.name;
        var email = req.body.email;
        var postal = req.body.postcode;
        var phNo = req.body.phone;
        var needLunch = req.body.lunch;
        var numTickets = req.body.tickets;
        var campus= req.body.campus;

        //File Handling to accept and store the incoming image
        var imName = req.files.myImage.name;
        var image = req.files.myImage;
        var dest = 'public/images/'+imName;
        image.mv(dest,(err)=>{
            console.log(err);
        })

        var lunchCost = needLunch == "yes" ? 60: 0;
        var ticketCost = numTickets * 100;
        var sub = lunchCost+ticketCost;


        var newOrder = new Order({
            name: name,
            email: email,
            phone: phNo,   
            postcode: postal,
            lunch: needLunch === "yes",
            tickets: numTickets,
            campus: campus,
            imPath:""
        });

        newOrder.save().then((data)=>{
            console.log("Data Saved to MongoDB")
        }).catch((err)=>{
            console.log("Error in saving to MongoDB")
        })

        var recpt={
            'name': name,
            'lunchCost': lunchCost,
            'ticketCost': ticketCost,
            'subTotal': sub,
            'taxes': 0.13*sub,
            'total': 1.13*sub,
            'image':'images/'+imName
        }
        res.render('form',{receipt: recpt})


        //console.log(`${needLunch} -- ${numTickets} -- ${campus}`);
        //res.redirect('/');
    }

});

app.get('/all', (req, res) => {
    Order.find().then((data)=>{
        res.render('allOrder', {orders: data})
        }).catch((err)=>{
            console.log("DB Reading Error")
        })
})


app.listen(3001, () => {
  console.log("My app is running on http://localhost:3000");
});
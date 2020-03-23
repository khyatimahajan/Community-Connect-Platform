const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));


//Import routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/profRoute');
const feedPost = require('./routes/feedPost');
const profRoute = require('./routes/profRoute');

dotenv.config();

//Connect to DB
var mongoDB = 'mongodb://localhost:27017/Users';
mongoose.connect(mongoDB, { useNewUrlParser: true });

console.log("Connected to DB");

//Middlewares
app.use(express.json());
app.set('view engine','.ejs');
app.use('/style', express.static('style'));
app.use('/assets', express.static('assets'));
app.use('/lib', express.static('lib'));
app.use('/js', express.static('js'));


//Routes Middlewares
app.use('/user', authRoute);
app.use('/profile',profRoute);
app.use('/login',require('./routes/loginRoute'));
app.use('/login_s',require('./routes/loginSucc'));
app.use('/', require('./routes/loginRoute'));
app.listen(3000, () => console.log('Server running on 3000...'));

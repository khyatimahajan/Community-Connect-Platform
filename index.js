const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');

const authRoute = require('./routes/auth');
const postRoute = require('./routes/profRoute');
const feedPost = require('./routes/feedPost');
const profRoute = require('./routes/profRoute');
const loginRoutes = require('./routes/loginRoute');
const loginSuccessRoutes = require('./routes/loginSucc');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const User = require('./model/User');

const app = express();

app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }));

app.use(bodyParser.urlencoded({ extended: true }))

dotenv.config();

var mongoDB = 'mongodb://localhost/Users';

app.use(express.json());
app.set('view engine', '.ejs');
app.use('/style', express.static('style'));
app.use('/assets', express.static('assets'));
app.use('/lib', express.static('lib'));
app.use('/js', express.static('js'));

app.use(flash());


app.use((req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user._id)
            .then(user => {
                if (!user) {
                    next();
                } else {
                    req.user = user;
                    if ((req.originalUrl == "/admin/login" || req.originalUrl == "/login" || req.originalUrl == "/") && req.session.user.isAdmin) {
                        return res.redirect('/admin/dashboard');
                    } else {
                        next();
                    }
                }
            })
            .catch(err => {
                console.log(error);
                next();
            })
    } else {
        next();
    }
})

app.use('/user', authRoute);
app.use('/profile', profRoute);
app.use('/login', loginRoutes);
app.use('/login_s', loginSuccessRoutes);
app.use('/', loginRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.listen(5000, () => {
    console.log("Listening at port 5000")
    mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(async () => {
            console.log("Connected to DB");
            /* New admin creation */
            let isAdminExist = await User.findOne({ isAdmin: true });
            if (!isAdminExist) {
                const hashPassword = await bcrypt.hash("123456", 12);
                let admin = new User({
                    email: "admin@gmail.com",
                    password: hashPassword,
                    isAdmin: true
                }).save().then(() => console.log("Admin Created"))
                    .catch(err => console.log("Admin creation failed"))
            }
        })
});

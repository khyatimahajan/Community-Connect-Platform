const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const mongoDBStore = require('connect-mongodb-session')(session);
var uniqid = require('uniqid');

const authRoute = require('./routes/auth');
//const postRoute = require('./routes/profRoute');
const feedPost = require('./routes/feedPost');
//const profRoute = require('./routes/profRoute');
const loginRoutes = require('./routes/loginRoute');
const loginSuccessRoutes = require('./routes/loginSucc');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const User = require('./model/User');
const Group = require('./model/Group');
const errorRoutes = require('./routes/errors');

const MONGODB_URI = 'mongodb://localhost/Users';

const app = express();

const groups = [];

const store = new mongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

app.use(session({
    secret: 'ssshhhhh',
    saveUninitialized: false,
    resave: false,
    store: store
}));

app.use(bodyParser.urlencoded({ extended: false }))

dotenv.config();

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
                    next();
                }
            })
            .catch(err => {
                next(new Error(err));
            })
    } else {
        next();
    }
})
app.use('/', authRoute);
//app.use('/user', authRoute);
//app.use('/profile', profRoute);
app.use('/login', loginRoutes);
app.use('/login_s', loginSuccessRoutes);
// app.use('/', loginRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.use(errorRoutes);

app.use((err, req, res, next) => {
    console.log(err)
    res.render('./errors/500.ejs', {
        pageTitle: "Something went wrong"
    })
});;

let port = process.env.PORT || 1337;

app.listen(port, () => {
    console.log(`Listening at port ${port}`)
    mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(async () => {
            console.log("Connected to DB");
            /* New admin creation */
            let isAdminExist = await User.findOne({ isAdmin: true });
            if (!isAdminExist) {
                const hashPassword = await bcrypt.hash("123456", 12);
                let admin = new User({
                    EmailID: "admin@gmail.com",
                    password: hashPassword,
                    isAdmin: true
                }).save().then((admin) => {
                    console.log("Admin Created")
                    console.log(admin)
                    createGroups();
                })
                    .catch(err => console.log(err))
            }
        }).catch(err => {
            console.log(err)
        })
});


const createGroups = () => {

    let groupIndex = 0;

    for (let i = 0; i < 5; i++) {
        let group = new Group({
            group_id: Math.random().toString(32).substring(2),
            group_name: Math.random().toString(22).substring(10)
        }).save()
            .then((group) => {
                groupIndex++;
                groups.push(group.group_id);
                if (groupIndex == 5) {
                    //console.log("DONE GROUPS")
                    createUsers();
                }
            })
    }
}

const createUsers = () => {
    for (let i = 0; i < 25; i++) {
        let user = new User({
            user_id: `${uniqid('id_')}_${(Math.floor(Math.random() * 99) + 10)}_${uniqid()}`,
            isAdmin: false,
            group_id: groups[Math.floor(Math.random() * (4 - 0 + 1)) + 0]
        }).save()
            .then(user => {
                Group.findOne({ group_id: user.group_id })
                    .then(group => {
                        group.members.push(user._id);
                        group.save();
                    });
            })
    };
}
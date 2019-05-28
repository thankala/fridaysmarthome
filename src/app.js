const express = require('express')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session);

const hbs = require('hbs')
const path = require('path')
const flash = require('connect-flash')
const passport = require('passport')
const keys = require('./config/keys')
const publicPath = path.join(__dirname, "../public")
const viewsPath = path.join(__dirname, "../templates/views")
const partialsPath = path.join(__dirname, "../templates/partials")

const app = express()

const cookieParser = require('cookie-parser')

const PORT = process.env.PORT || 3000;

//Passport
require('./passport')(passport)

//Cookie parser
app.use(cookieParser(keys.secret));

// Handlebars View Engine for dynamic rendering
app.set('view engine', 'hbs')
app.set('views', viewsPath)


/* Parials setup and custom if Condition Statement for the dynamic
rendering of the pages */
hbs.registerPartials(partialsPath)
hbs.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});


//Never used
hbs.registerHelper('debug', function (optionValue) {
    console.log("Current Context");
    console.log("====================");
    console.log(this);

    if (optionalValue) {
        console.log("Value");
        console.log("====================");
        console.log(optionalValue);
    }
})


// Body-Parser
// app.use(require('body-parser').urlencoded({ extended: false }));
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// Connect flash
app.use(flash())

//Session Init
const sessionHandler = session({
    name: 'session',
    cookie: { path: '/', httpOnly: true, maxAge: 86400000 },
    rolling: true,
    secret: keys.secret,
    rolling: true,
    store: new MySQLStore({
        host: 'localhost',
        user: 'root',
        database: 'home',
        password: 'than2211',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        clearExpired: true,
        checkExpirationInterval: 86400000,
        expiration: 86400000
    }),
    resave: false,
    saveUninitialized: false
});

app.use(function (req, res, next) {
    // if path does not start with /error/, then invoke session middleware
    if (req.url.indexOf("/remotedevices") !== 0) {
        return sessionHandler(req, res, next);
    } else {
        next();
    }
});

// Globar Vars (Custom Middleware) for flash messages
app.use((req, res, next) => {
    if (req.url.indexOf("/remotedevices/") !== 0) {
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg')
        res.locals.error = req.flash('error')

    }
    next()
})

//Static Assets
app.use(express.static(publicPath))

//Passport Init (After Session init)
app.use(passport.initialize());
app.use(passport.session());


//Routes
app.use('/', require('./routes/index'))
app.use('/', require('./routes/users'))
app.use('/', require('./routes/dashboard'))
app.use('/', require('./routes/cameras'))
app.use('/', require('./routes/history'))
app.use('/', require('./routes/devices'))
app.use('/', require('./routes/recover'))
app.use('/', require('./routes/rooms'))
app.use('/', require('./routes/admin'))
app.use('/', require('./routes/home'))
app.use('/', require('./routes/remoteDevices'))

app.listen(PORT, console.log("Server started on port " + PORT));

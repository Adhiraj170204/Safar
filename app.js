let express = require('express')
let path = require('path')
let app = express()
let methodOverride = require('method-override')
let appError = require('./utility/appError')
let morgan = require('morgan')
let session = require('express-session')
let flash = require('express-flash')
let passport = require('passport')
let localStrategy = require('passport-local')
let User = require('./model/user')
let { wrapAsync } = require('./utility/middleware')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')
const db_Url = process.env.DB_Url || 'mongodb://localhost:27017/journey'
const secret = process.env.Secret || 'tomato is a fruit'
const MongoStore = require('connect-mongo')

let Safar = require('./model/safar')

let cityRoutes = require('./routes/city')
let reviewRoutes = require('./routes/review')
let userRoutes = require('./routes/user')

const mongoose = require('mongoose')
mongoose.connect(db_Url, {                              
})
    .then(() => {
        console.log('Mongo Connection Successful')
    })
    .catch((err) => {
        console.log('Mongo Connection Failed')
        console.log(err)
    })




app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'partials')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.use(mongoSanitize());
app.use(helmet());


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://ka-f.fontawesome.com/"
];

const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
    "https://stackpath.bootstrapcdn.com/",
    "https://ka-f.fontawesome.com/"
];


const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
    "https://cdnjs.cloudflare.com",
    "https://ka-f.fontawesome.com/"
];
const fontSrcUrls = ["https://ka-f.fontawesome.com/"];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dvitogiav/", 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const store = MongoStore.create({
    mongoUrl: db_Url,
    touchAfter: 24 * 60 * 60, // in seconds
    crypto: {
        secret
    }
});

store.on('error',()=>{
 console.log('session store error',e)   
})

app.use(session({
    store,
    name : 'random',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 3000,
        httpOnly: true
    }
}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.msg = req.flash('success')
    res.locals.err = req.flash('error')
    next()
})

app.use('/city', cityRoutes)
app.use('/city/:id/review', reviewRoutes)
app.use('/', userRoutes)

app.get('/', wrapAsync(async (req, res, next) => {
    res.render('home')
}))

app.get('/index', wrapAsync(async (req, res) => {
    let c = await Safar.find()
    res.render('index', { c })
}))

app.all('*', (req, res, next) => {
    next(new appError(404, 'Page not found'))
})

app.use((err, req, res, next) => {
    const { status = 500, message = 'Something went wrong' } = err;
    res.status(status).render('error', { status, message });
});

app.listen(3000, () => {
    console.log('Live on 3000')
})
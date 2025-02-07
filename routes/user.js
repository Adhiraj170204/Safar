let express = require('express')
let router = express.Router()
let User = require('../model/user')
let passport = require('passport')
const {storeReturnTo, wrapAsync }= require('../utility/middleware')

router.get('/register', (req, res) => {
    res.render('user/register')
})

router.post('/register', wrapAsync(async (req, res, next) => {
    try {
        let { username, email, password } = req.body
        let user = new User({ username, email })
        let u = await User.register(user, password)
        req.login(u, (e) => {
            if (e) return next(e)
            req.flash('success', `Welcome to Safar ${username}`)
            res.redirect('/index')
        })

    }
    catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }

}))

router.get('/login', (req, res) => {
    res.render('user/login')
})

router.post('/login', storeReturnTo, passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', `Welcome back ${req.user.username}`)
    let url = res.locals.returnTo || '/index'
    res.redirect(url)
})

router.get('/logout', (req, res) => {
    let u = req.user.username
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', `Goodbye! ${u}`);
        res.redirect('/index');
    });
})

module.exports = router
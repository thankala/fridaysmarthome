const express = require('express')


const router = express.Router()
const pool = require('../db')
const validator = require('validator')


router.get('/', (req, res) => {
    if (req.cookies.jwt) {
        req.session.lastActivity = Date.now().toString()
        // console.log(req.user)
        const { fname } = req.user

        res.render('index', {
            sessionedRender: true,
            fname

        })
    } else {
        res.render('index', {
            sessionedRender: false
        })
    }

})


router.post('/contact', (req, res) => {
    const { name, email, message } = req.body
    let errors = []
    if (!name || !email || !message) {
        errors.push({ msg: 'Please fill out all the fields' })
    }

    if (!validator.isEmail(email)) {
        errors.push({ msg: 'Invalid email address' })
    }

    if (errors.length > 0) {
        req.flash('error_msg', 'Please fill out the form correctly')
        res.redirect('/#contact')
    }

    else {
        pool.execute('INSERT INTO Contact (email,message,name,messageDate) VALUES (?,?,?,?)', [email, message, name, new Date(Date.now())],
            (errors, results, fields) => {
                req.flash('success_msg', 'A message has been sent to the admins of the site. They will contact you soon')
                res.redirect('/')

            })
    }
})

module.exports = router
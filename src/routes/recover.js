const express = require('express')
const validator = require('validator')
const crypto = require('crypto')
const bcrypt = require('bcrypt')

const router = express.Router()

const pool = require('../db')
const transporter = require("../config/nodemailer")


router.get('/recover', (req, res) => {

    res.render('forgot_password')

})

router.post('/recover', (req, res) => {

    const { email } = req.body;
    let errors = []


    if (!validator.isEmail(email)) {
        errors.push({ msg: 'Invalid email address' })
    }

    if (errors.length > 0) {
        res.render('forgot_password', {
            errors,
            email

        })

        errors = []

    } else {
        pool.execute('SELECT userID FROM users WHERE email=?', [email],
            (error, results, fields) => {
                if (error) throw error
                if (results.length < 1) {
                    req.flash("error_msg","Email not found")
                    res.redirect('/recover')
                } else {
                    var token = crypto.randomBytes(15).toString('hex')
                    var expire = Date.now() + 360000
                    
                    pool.execute('UPDATE users SET resetPasswordToken=?, resetPasswordExpires=? WHERE userID=?', [token, expire, results[0].userID],
                        (error, results, fields) => {
                            const mailOptions = {
                                from: 'Friday Smart Home', // sender address
                                to: email, // list of receivers
                                subject: 'Friday - Recover Password', // Subject line
                                html: `You are receiving this because you (or someone else) have reqeusted the reset of the password for your account. \n\n` +
                                    `Please visit this link to recover your password: http://localhost:3000/account/recovery/?token=${token}`
                            };
                            transporter.sendMail(mailOptions, function (err, info) {
                                if (err)
                                    console.log(err)
                            });
                            req.flash('success_msg', 'Plase check your email for instructions')
                            res.redirect('/')

                        })


                }
            })
    }
})

router.get('/account/recovery/', (req, res) => {
    
    token = req.query.token
    res.cookie('token', token)
    res.render('recover')


})

router.post('/account/recovery/', (req, res) => {

    let errors = [];

    token = req.cookies.token

    const { password, password2 } = req.body

    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' })
    }

    if (!password || !password2) {
        errors.push({ msg: 'Please fill out all the fields' })
    }

    if (errors.length > 0) {
        res.render('recover', {
            errors,
        })

        errors = []


    } else {
        pool.execute('SELECT username,resetPasswordExpires FROM users WHERE resetPasswordToken=?', [token], (errors, results, fields) => {
            username = results[0].username
            if (results[0].resetPasswordExpires > Date.now()) {
                bcrypt.genSalt(10, (error, salt) => {
                    bcrypt.hash(password, salt, (error, hash) => {
                        if (error) throw error;
                        pool.execute('UPDATE users SET password=? WHERE username=?', [hash, username],
                            (errors, results, fields) => {
                                pool.execute('UPDATE users SET resetPasswordToken=?, resetPasswordExpires=? WHERE username=?', ["NULL", "NULL", username],
                                    (errors, results, fields) => {
                                        res.clearCookie('token');
                                        req.flash('success_msg', 'You have successfully reset your password')
                                        res.redirect('/')

                                    })
                            })
                    })

                }
                )
            } else {
                res.send("Expired Token")
            }
        })
    }
})

module.exports = router
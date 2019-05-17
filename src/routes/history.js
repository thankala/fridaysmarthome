const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/history',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { username } = user
     
        pool.execute('SELECT * FROM users WHERE username=?', [username],
            (error, results, fields) => {
                if (error) throw error
                const { username, fname, lname, email } = results[0]
                res.render('history', {
                    username,
                    fname,
                    lname,
                    email,
                    sessionedRender: true
                })

            })
    })

module.exports = router
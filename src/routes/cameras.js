const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')

router.get('/cameras',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { fname, userID } = user

        pool.execute('SELECT * FROM Devices LEFT JOIN Rooms on Devices.roomID = Rooms.roomID WHERE Devices.userID=? and Devices.type=?', [userID, 'camera'],
            (error, results, fields) => {
                if (error) throw error
                res.render('cameras', {
                    fname,
                    sessionedRender: true,
                    cameras: results
                })

            }
        )
    }
)

module.exports = router
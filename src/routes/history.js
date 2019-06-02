const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/history',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT JSON_OBJECT("deviceID", Devices.deviceID,"deviceType", Devices.type, "deviceValue" , Devices.value) as devices FROM Devices WHERE userID=? AND (type="thermometer" OR type="rainsensor" OR type="hsensor")', [userID],
            (errors, results, fields) => {
                if (errors) throw error
                const devices = results
                res.render('history', {
                    devices,
                    fname,
                    sessionedRender: true
                })
            }
        )
    }
)

module.exports = router
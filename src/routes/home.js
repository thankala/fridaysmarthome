const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/home',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, username } = user
        req.session.lastActivity = Date.now().toString()

        pool.execute(`SELECT Rooms.roomID as roomID, Rooms.name as roomName, Rooms.longName as roomLongName, JSON_ARRAYAGG(JSON_OBJECT('deviceName', Devices.name,  'deviceID', Devices.deviceID,'deviceType', Devices.type, 'deviceState' , Devices.state)) as devices FROM Rooms LEFT JOIN Devices ON Rooms.roomID = Devices.roomID WHERE Rooms.userID=${userID} GROUP BY Rooms.roomID`, [],
            (error, results, fields) => {
                if (error) throw error
                res.render('home', {
                    rooms: results,
                    sessionedRender: true
                })

            }
        )
    }
)

module.exports = router
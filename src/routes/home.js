const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/home',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, username, fname } = user

        pool.execute('SELECT Rooms.roomID as roomID, Rooms.name as roomName, Rooms.longName as roomLongName, JSON_ARRAYAGG(JSON_OBJECT("deviceName", Devices.name,  "deviceID", Devices.deviceID,"deviceType", Devices.type, "deviceState" , Devices.state, "deviceValue", JSON_EXTRACT(`value`,CONCAT("$[",JSON_LENGTH(`value` ->> "$")-1,"]")))) as devices FROM Rooms LEFT JOIN Devices ON Rooms.roomID = Devices.roomID WHERE Rooms.userID=? GROUP BY Rooms.roomID', [userID],
            (error, results, fields) => {
                if (error) throw error
                // res.status(200).send(results)
                res.render('home', {
                    rooms: results,
                    sessionedRender: true,
                    fname
                })

            }
        )
    }
)

module.exports = router
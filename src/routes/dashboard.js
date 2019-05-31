const express = require('express')
const passport = require('passport')



const router = express.Router()

const pool = require('../db')


router.get('/dashboard',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, username } = user

        pool.execute('SELECT fname,lname,email,registerDate FROM users WHERE userID = ?', [userID],
            (error, results, fields) => {
                if (error) throw error;
                var { fname, lname, email, registerDate } = results[0]
                const regDate = new Date(registerDate)
                pool.execute('SELECT COUNT(roomID) AS numOfRooms FROM Rooms WHERE userID = ?', [userID],
                    (errors, results, fields) => {
                        if (errors) throw error;
                        const numOfRooms = results[0].numOfRooms
                        pool.execute('SELECT COUNT(deviceID) AS numOfDevices FROM Devices WHERE userID = ?', [userID],
                            (errors, results, fields) => {
                                if (errors) throw errors
                                const numOfDevices = results[0].numOfDevices
                                pool.execute('SELECT Rooms.roomID as roomID, Rooms.name as roomName, Rooms.longName as roomLongName, JSON_ARRAYAGG(JSON_OBJECT("deviceName", Devices.name,  "deviceID", Devices.deviceID,"deviceType", Devices.type, "deviceState" , Devices.state, "deviceSrc", Devices.src_link_of_live_streaming,  "deviceValue" , JSON_EXTRACT(`value`,CONCAT("$[",JSON_LENGTH(`value` ->> "$")-1,"]")))) as devices FROM Rooms LEFT JOIN Devices ON Rooms.roomID = Devices.roomID WHERE Rooms.userID=? GROUP BY Rooms.roomID', [userID],
                                    (errors, results, fields) => {
                                        if (errors) throw errors;
                                        const rooms = results
                                        pool.execute('SELECT JSON_OBJECT("deviceID", Devices.deviceID,"deviceType", Devices.type, "deviceValue" , Devices.value) as devices FROM Devices WHERE userID=? AND (type="thermometer" OR type="rainsensor" OR type="hsensor")', [userID],
                                            (errors, results, fields) => {
                                                if (errors) throw errors;
                                                const devices = results
                                                res.render('dashboard', {
                                                    username,
                                                    fname,
                                                    lname,
                                                    email,
                                                    numOfDevices,
                                                    numOfRooms,
                                                    registerDate: regDate.toDateString(),
                                                    rooms,
                                                    devices,
                                                    sessionedRender: true
                                                })
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
            }
        )
    }
)

module.exports = router
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
                                pool.execute(`SELECT Rooms.roomID as roomID, Rooms.name as roomName, Rooms.longName as roomLongName, JSON_ARRAYAGG(JSON_OBJECT('deviceName', Devices.name,  'deviceID', Devices.deviceID,'deviceType', Devices.type)) as devices FROM Rooms LEFT JOIN Devices ON Rooms.roomID = Devices.roomID WHERE Rooms.userID=${userID} GROUP BY Rooms.roomID`, [],
                                    (errors, results, fields) => {
                                        if (errors) throw errors;
                                        const rooms = results
                                        res.render('dashboard', {
                                            username,
                                            fname,
                                            lname,
                                            email,
                                            numOfDevices,
                                            numOfRooms,
                                            registerDate: regDate.toDateString(),
                                            rooms,
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

module.exports = router
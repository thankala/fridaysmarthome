const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/rooms',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname, username } = user
        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT name,type,roomID FROM Rooms WHERE userID=?', [userID],
            (error, results, fields) => {
                if (error) throw error
                res.render('rooms', {
                    sessionedRender: true,
                    rooms: results,
                    fname,
                    username
                })

            }
        )
    }
)

router.get('/rooms/add',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT name FROM Rooms WHERE userID', [userID],
            (error, results, fields) => {
                if (error) throw error
                res.render('add_room', {
                    sessionedRender: true,
                    fname

                })

            }
        )
    }
)

router.post('/rooms/add',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID } = user
        const { option, name } = req.body

        req.session.lastActivity = Date.now().toString()

        type = option.replace(/\s/g, '').toLowerCase();

        pool.execute('INSERT INTO Rooms (name,type,userID,longName) VALUES (?,?,?,?)', [name, type, userID, option],
            (error, results, fields) => {
                if (error) throw error
                req.flash('success_msg', "Room added!")
                res.redirect('/rooms')

            }
        )
    }
)

router.get('/rooms/*room',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        const roomID = req.query.id
        const category = req.originalUrl

        req.session.lastActivity = Date.now().toString()


        pool.execute('SELECT Rooms.roomID as roomID, Rooms.name as roomName, Rooms.longName as roomLongName, Devices.type as deviceType, Devices.name as deviceName, Devices.deviceID as deviceID, Devices.state as deviceState, JSON_EXTRACT(`value`,CONCAT("$[",JSON_LENGTH(`value` ->> "$")-1,"]")) as deviceValue' + ' FROM Rooms LEFT JOIN Devices on Rooms.roomID = Devices.roomID WHERE Rooms.roomID=? AND Rooms.userID=?', [roomID, userID],
            (error, results, fields) => {
                if (error) throw error
                // console.log(results)
                res.render('room', {
                    devices: results,
                    sessionedRender: true,
                    roomName: results[0].roomName,
                    roomType: results[0].roomLongName,
                    roomID: results[0].roomID,
                    category,
                    fname

                })

            }
        )
    }
)

router.get('/rooms/*room/delete',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID } = user
        const roomID = req.query.id
        req.session.lastActivity = Date.now().toString()

        pool.execute('DELETE FROM Rooms WHERE roomID=? AND userID=?', [roomID, userID],
            (error, results, fields) => {
                if (error) throw error
                req.flash('success_msg', 'Room Deleted Successfuly')
                res.redirect('/rooms')

            }
        )
    }
)




module.exports = router
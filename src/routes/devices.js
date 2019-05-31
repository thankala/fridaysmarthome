const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


function search_array(array, valuetofind) {
    for (i = 0; i < array.length; i++) {
        if (array[i].roomID == valuetofind) {
            array[i].selected = true;
        }
    }

}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


router.get('/devices',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user

        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT Rooms.name as roomName, Rooms.longName as roomLongName,Rooms.type as roomType, Devices.type as deviceType, Devices.name as deviceName, Devices.deviceID as deviceID, Devices.state as deviceState, JSON_EXTRACT(`value`,CONCAT("$[",JSON_LENGTH(`value` ->> "$")-1,"]")) as deviceValue FROM Devices JOIN Rooms ON Devices.roomID = Rooms.roomID WHERE Devices.userID=?', [userID],
            (error, results, fields) => {
                if (error) throw error
                for (k = 0; k < results.length; k++) {
                    results[k].category = '/devices'
                }
                res.render('devices', {
                    devices: results,
                    sessionedRender: true,
                    fname
                })

            })
    })


router.get('/devices/add',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        const deviceType = req.query.deviceType;
        const category = req.query.category
        const room = req.query.roomID

        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT roomID, type as roomType, name as roomName,longName as roomLongName,userID FROM Rooms WHERE userID=?', [userID],
            (error, results, fields) => {
                if (error) throw error
                if (room) {
                    search_array(results, room)
                }
                // console.log(results)
                res.render('add_device', {
                    rooms: results,
                    sessionedRender: true,
                    deviceType,
                    category,
                    fname,
                    room
                })

            })
    })
router.post('/devices/add',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        let { user } = req
        let { username, userID } = user
        let room = req.query.category
        let { name, camera_link } = req.body
        try {
            let [deviceType, roomID] = req.body.option
            if (!(isNumber(roomID))) {
                req.flash('error_msg', 'Error adding device')
                res.redirect(req.originalUrl)
            } else {
                if (camera_link == undefined) {
                    camera_link = ""
                }
                pool.execute('INSERT INTO Devices(type,src_link_of_live_streaming,name,userID,roomID) VALUES (?,?,?,?,?)', [deviceType, camera_link, name, userID, roomID],
                    (error, results, fields) => {
                        if (error) throw error
                        pool.execute('SELECT type,roomID From Rooms WHERE roomID=?', [roomID],
                            (error, results, fields) => {
                                const url = '/rooms/' + results[0].type + '/?id=' + results[0].roomID
                                console.log(url)
                                if (room) {
                                    req.flash('success_msg', 'Device added successfully')
                                    res.redirect(room)

                                } else {
                                    req.flash('success_msg', 'Device added successfully')
                                    res.redirect(url)
                                }
                            }
                        )
                    }
                )
            }
        } catch (e) {
            req.flash('error_msg', 'Error adding device')
            res.redirect(req.originalUrl)
        }



    }
)

router.get('/devices/edit',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        const { id, category } = req.query

        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT Devices.type as deviceType, Devices.name as deviceName, Rooms.type as roomType, longName,Rooms.roomID FROM Rooms JOIN Devices on Rooms.roomID = Devices.roomID WHERE Rooms.userID=? AND Devices.deviceID=?', [userID, id],
            (error, results, fields) => {
                if (error) throw error
                const device = results
                pool.execute('SELECT roomID, longName as roomLongName, name as roomName, type as roomType From Rooms WHERE userID=?;', [userID],
                    (errors, results, fields) => {
                        res.render('edit_device', {
                            device,
                            sessionedRender: true,
                            deviceID: id,
                            category,
                            deviceType: device[0].deviceType,
                            fname,
                            rooms: results

                        })

                    })



            })
    }
)
router.post('/devices/delete',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, username } = user
        const { id, category } = req.query
        const { option } = req.body

        pool.execute('DELETE FROM Devices WHERE userID=? AND deviceID=?', [userID, id],
            (error, results, fields) => {
                pool.execute('SELECT roomID, longName as roomLongName, name as roomName, type as roomType From Rooms WHERE userID=? AND roomID=?;', [userID, option],
                    (error, results, fields) => {
                        if (error) throw error
                        const url = '/rooms/' + results[0].roomType + '/?id=' + results[0].roomID

                        if (category) {
                            req.flash('success_msg', 'Device deleted successfully')
                            res.redirect(category)

                        } else {
                            req.flash('success_msg', 'Device deleted successfully')
                            res.redirect(url)
                        }
                    }

                )
            }
        )
    }
)

router.post('/devices/update',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID } = user
        const { id, category } = req.query
        const { option, name, camera_link } = req.body

        console.log(req.body);
        pool.execute('UPDATE Devices SET roomID=? , src_link_of_live_streaming=? , name=? WHERE deviceID =? AND userID=?', [option, camera_link, name, id, userID],
            (errors, results, fields) => {
                pool.execute('SELECT type,roomID From Rooms WHERE roomID=?', [option],
                    (error, results, fields) => {
                        const url = '/rooms/' + results[0].type + '/?id=' + results[0].roomID
                        if (category) {
                            req.flash('success_msg', 'Device updated successfully')
                            res.redirect(category)
                        } else {
                            req.flash('success_msg', 'Device updated successfully')
                            res.redirect(url)
                        }
                    }
                )
            }
        )
    }
)
router.get('/devices/state',
    passport.authenticate('jwt', { session: true }),
    (req, res) => {
        const { user } = req
        const { userID } = user
        const deviceID = req.query.id
        const state = req.query.state

        pool.execute('UPDATE Devices SET state=? WHERE deviceID =? AND userID=?', [state, deviceID, userID],
            (errors, results, fields) => {
                if (errors) throw errors;
            })
    }
)

module.exports = router
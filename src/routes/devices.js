const express = require('express')
const passport = require('passport')

const router = express.Router()

const pool = require('../db')


router.get('/devices',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user

        pool.execute('SELECT Rooms.name as roomName, Rooms.longName as roomLongName,Rooms.type as roomType, Devices.type as deviceType, Devices.name as deviceName, Devices.deviceID as deviceID FROM Devices JOIN Rooms ON Devices.roomID = Rooms.roomID WHERE Devices.userID=?', [userID],
            (error, results, fields) => {
                if (error) throw error
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

        pool.execute('SELECT roomID, type as roomType, name as roomName,longName as roomLongName,userID FROM Rooms WHERE userID=?', [userID],
            (error, results, fields) => {
                // console.log(results)
                if (error) throw error
                res.render('add_device', {
                    rooms: results,
                    sessionedRender: true,
                    deviceType,
                    category,
                    fname
                })

            })
    })
router.post('/devices/add',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { username, userID } = user
        const room = req.query.category

        const { name, camera_link } = req.body
        const [deviceType, roomID] = req.body.option
        // console.log(room)


        pool.execute('INSERT INTO Devices(type,src_link_of_live_streaming,name,userID,roomID) VALUES (?,?,?,?,?)', [deviceType, camera_link, name, userID, roomID],
            (error, results, fields) => {
                if (error) throw error
                pool.execute('SELECT type,roomID From Rooms WHERE roomID=?', [roomID],

                    (error, results, fields) => {

                        const url = '/rooms/' + results[0].type + '/?id=' + results[0].roomID

                        if(room){
                            req.flash('success_msg', 'Device added successfully')
                            res.redirect(room)

                        }else{
                            req.flash('success_msg', 'Device added successfully')
                            res.redirect(url)
                        }
                        // req.flash('success_msg', 'Device added successfully')
                        // res.redirect(url)
                        // } else {
                        //     req.flash('success_msg', 'Device added successfully')
                        //     res.redirect(room)
                        // }

                        // } else {
                        //     res.redirect('/')
                        // }


                    }
                )
            })
    }
)

router.get('/devices/edit',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID, fname } = user
        const { id, category } = req.query

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



        pool.execute('DELETE FROM Devices WHERE userID=? AND deviceID=?', [userID, id],
            (error, results, fields) => {
                if (error) throw error
                req.flash('success_msg', 'Device deleted')
                res.redirect(category)

            })
    })
router.post('/devices/update',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID } = user
        const { id } = req.query
        const { option, name } = req.body

        pool.execute('UPDATE Devices SET roomID=? , name=? WHERE deviceID =? AND userID=?', [option, name, id, userID],
            (errors, results, fields) => {
                pool.execute('SELECT type,roomID From Rooms WHERE roomID=?', [option],
                    (error, results, fields) => {
                        const url = '/rooms/' + results[0].type + '/?id=' + results[0].roomID
                        req.flash('success_msg', 'Device updated successfully')
                        res.redirect(url)


                    })
            }
        )
    })

module.exports = router
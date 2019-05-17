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
                                // pool.execute('SELECT Rooms.roomID as roomID,Rooms.name AS roomName, Rooms.longName AS roomLongName, Devices.deviceID as deviceID, Devices.type as deviceType, Devices.name as deviceName FROM Rooms LEFT JOIN Devices ON Rooms.roomID = Devices.roomID WHERE Rooms.userID = ?', [userID],
                                pool.execute('SELECT roomID,name as roomName, longName as roomLongName  from Rooms WHERE userID=?', [userID],
                                    (errors, results, fields) => {
                                        if (errors) throw errors;
                                        const rooms = results;

                                        // console.log(results)

                                        let device = []
                                        for (i = 0; i < rooms.length; i++) {
                                            pool.execute('SELECT name as deviceName,type as deviceType, deviceID from Devices WHERE roomID=? AND userID=?', [rooms[i].roomID, userID],
                                                (errors, results, fields) => {
                                                    //  for (k=0;k<results.length;k++){
                                                    // const res=JSON.stringify(results[k])
                                                    //const dev = 'Device: ' + res
                                                    //const redev = JSON.parse(dev)

                                                    device.push(results)



                                                    // device.push(redev)

                                                    //  }

                                                    // const data = '{devices: ' + JSON.stringify(results)

                                                    //const data = JSON.parse('{device: ' + JSON.stringify(results)+'}')
                                                    //device.push(data)
                                                    // const deviceLOL =
                                                    //     device.push(data)
                                                })

                                                

                                           
                                            
                                        }

                                        //[{ devices: [{}, {}] }]

                                        pool.execute('SELECT roomID,name as roomName, longName as roomLongName from Rooms WHERE userID=?', [userID],
                                            (errors, results, fields) => {
                                                
                                                for(k=0;k<device.length;k++){
                                                    rooms[k].device = device[k]
                                                }
                                                console.log(rooms)


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
                                            })

                                    }
                                )

                            })
                    })

            })
    })

module.exports = router
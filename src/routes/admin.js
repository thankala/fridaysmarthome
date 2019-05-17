const express = require('express')

const router = express.Router()

const bcrypt = require('bcrypt')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')
const validator = require('validator')

const pool = require('../db')

function getDateTime(datetime) {

    var date = new Date(datetime);

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    // var year = date.getFullYear();

    // var month = date.getMonth() + 1;
    // month = (month < 10 ? "0" : "") + month;

    var day = date.toDateString()

    // var day = date.getDate();
    // day = (day < 10 ? "0" : "") + day;

    return day + " " + hour + ":" + min + ":" + sec;

}

router.get('/admin/login', (req, res) => {
    res.render('login', {
        postUrl: '/admin/login'
    });
})

router.get('/admin/dashboard',
    passport.authenticate('jwt', { session: true, failureRedirect: '/admin/login' }),
    (req, res) => {

        if (req.user.userType != 'admin') {
            res.status(403).send('Access Denied')
        }
        else {
            const { username, fname, userID } = req.user
            pool.execute('SELECT lname,email FROM users WHERE userID=?', [userID],
                (errors, results, fields) => {
                    const { lname, email } = results[0]
                    pool.execute('SELECT COUNT(userID) as numOfUsers FROM users WHERE userType = ?', ['user'],
                        (errors, results, fields) => {
                            const { numOfUsers } = results[0]
                            pool.execute('SELECT COUNT(deviceID) as numOfDevices FROM Devices JOIN users on Devices.userID = users.userID WHERE userType = ?', ['user'],
                                (errors, results, fields) => {
                                    const { numOfDevices } = results[0]
                                    pool.execute('SELECT COUNT(roomID) as numOfRooms FROM Rooms JOIN users on Rooms.userID = users.userID WHERE userType = ?', ['user'],
                                        (errors, results, fields) => {
                                            const { numOfRooms } = results[0]
                                            pool.execute('SELECT username,COUNT(Rooms.roomID) AS numOfRooms,COUNT(Devices.deviceID) AS numOfDevices, users.userID,fname,lname,email,registerDate,lastLogIn FROM users LEFT JOIN Rooms ON users.userID = Rooms.userID RIGHT JOIN Devices ON users.userID = Devices.userID WHERE userType=? GROUP BY Devices.deviceID UNION SELECT username,COUNT(Rooms.roomID),COUNT(DeviceID),users.userID,fname,lname,email,registerDate,lastLogIn FROM users RIGHT JOIN Rooms ON users.userID = Rooms.userID RIGHT JOIN Devices ON users.userID=Devices.userID GROUP BY Devices.deviceID'
                                                , ['user'],
                                                (errors, results, fields) => {
                                                    for (k = 0; k < results.length; k++) {
                                                        var registerDate = getDateTime(results[k].registerDate)
                                                        var lastLogIn = getDateTime(results[k].lastLogIn)
                                                        results[k].registerDate = registerDate
                                                        results[k].lastLogIn = lastLogIn
                                                    }
                                                    const users = results
                                                    pool.execute('SELECT username,messageDate,userID,name,Contact.email,message FROM Contact LEFT JOIN users ON Contact.email = users.email;',
                                                        (erros, results, fields) => {
                                                            for (k = 0; k < results.length; k++) {
                                                                var messageDate = new Date(results[k].messageDate);
                                                                results[k].messageDate = messageDate.toDateString()
                                                            }

                                                            res.render('admin_page', {

                                                                sessionedRender: true,
                                                                fname,
                                                                username,
                                                                fname,
                                                                lname,
                                                                email,
                                                                numOfUsers,
                                                                numOfDevices,
                                                                numOfRooms,
                                                                users,
                                                                contact: results

                                                            })

                                                        })


                                                })

                                        }
                                    )
                                }
                            )
                        }
                    )
                })
        }
    })

router.post('/admin/login', (req, res) => {
    passport.authenticate(
        'local',
        { session: true },
        (error, user) => {

            if (error || !user || user.userType != 'admin') {
                req.flash("error_msg", "Wrong Username or Password")
                res.redirect('/admin/login')
            } else {
                /** This is what ends up in our JWT */
                //DONT PASS SENSITIVE INFO ON JWT PAYLOAD FIXX
                const payload = {
                    username: user.username,
                    userID: user.userID,
                    fname: user.fname,
                    userType: user.userType
                };


                /** assigns payload to req.user */
                req.login(payload, { session: true }, (error) => {
                    if (error) {
                        res.send('error');
                    }

                    /** generate a signed json web token and return it in the response */
                    const token = jwt.sign(JSON.stringify(payload), keys.secret);

                    /** assign our jwt to the cookie */
                    res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 1800000 });
                    res.redirect('/admin/dashboard')
                });

            }


        },
    )(req, res);
});


module.exports = router






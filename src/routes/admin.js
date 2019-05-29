const express = require('express')

const router = express.Router()
const passport = require('passport')
const jwt = require('jsonwebtoken')
const keys = require('../config/keys')

const pool = require('../db')

function getDateTime(datetime) {
    if (typeof (datetime) == 'string' || typeof (datetime) == 'number') {
        var date = new Date(datetime);
        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var day = date.toDateString()

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;
        return day + " " + hour + ":" + min + ":" + sec;

    } else {
        return 0;
    }
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
                                            pool.execute('SELECT username,COUNT(DISTINCT(Rooms.roomID)) AS numOfRooms,COUNT(DISTINCT(Devices.deviceID)) as numOfDevices,users.userID,fname,lname,email,registerDate,lastLogIn,lastLogOut,CAST(JSON_EXTRACT(data,?) AS UNSIGNED) AS lastActivity FROM users LEFT JOIN Rooms ON users.userID = Rooms.userID LEFT JOIN Devices ON users.userID = Devices.userID  LEFT JOIN sessions ON users.userID = JSON_EXTRACT(data,?) WHERE userType = ? GROUP BY username,data;',
                                                ['$.lastActivity', '$.passport.user', 'user'],
                                                (errors, results, fields) => {
                                                    //If you ever see this code please forgive me im young and naive 
                                                    for (k = 0; k < results.length; k++) {
                                                        if (new Date(results[k].lastLogOut).valueOf() > new Date(results[k].lastActivity).valueOf()) {
                                                            delete results[k].lastActivity
                                                            if (new Date(results[k].lastLogOut).valueOf() < new Date(results[k].lastLogIn).valueOf()) {
                                                                delete results[k].lastLogOut
                                                            } else {
                                                                results[k].lastLogOut = getDateTime(results[k].lastLogOut)

                                                            }
                                                        } else {
                                                            delete results[k].lastLogOut
                                                            results[k].lastActivity = getDateTime(results[k].lastActivity)
                                                        }
                                                        results[k].registerDate = getDateTime(results[k].registerDate)
                                                        results[k].lastLogIn = getDateTime(results[k].lastLogIn)
                                                    }
                                                    const users = results
                                                    pool.execute('SELECT username,messageDate,userID,name,Contact.email,message FROM Contact LEFT JOIN users ON Contact.email = users.email;',
                                                        (erros, results, fields) => {
                                                            for (k = 0; k < results.length; k++) {
                                                                results[k].messageDate = new Date(results[k].messageDate).toDateString();
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
        }
    }
)

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
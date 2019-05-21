const express = require('express')

const router = express.Router()

const bcrypt = require('bcrypt')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const keys = require('../config/keys');
const validator = require('validator')

const pool = require('../db')
let errors = []

//Login
router.get('/login', (req, res) => {

    res.render('login', {
        postUrl: '/login'
    });
})

//Register
router.get('/register', (req, res) => {

    res.status(200).render('signup')
})


function checkUsername(username, callback) {
    errors = [];
    pool.execute(
        'SELECT userID FROM users WHERE username=?', [username],
        (err, results, fields) => {
            if (results.length < 1) {
                callback(true)
            } else {
                errors.push({ msg: "Username already exists" })
                callback(false)
            }
        }
    )
}

//Register handler
router.post('/register', (req, res) => {


    const { fname, lname, email, username, password, password2 } = req.body;

    //Server-side checks for correct credentials during user register
    if (!fname || !lname || !email || !username || !password || !password2) {
        errors.push({ msg: 'Please fill out all the fields' })
    }

    if (!validator.isEmail(email)) {
        errors.push({ msg: 'Invalid email address' })
    }

    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' })
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' })
    }

    if (errors.length > 0) {
        res.render('signup', {
            errors,
            fname,
            lname,
            email,
            username

        })

        errors = []

    } else {
        let emailOK = false;

        //Checking if email is in use
        pool.execute(
            'SELECT userID FROM users WHERE email=?', [email],
            (err, results, fields) => {
                if (results.length < 1) {
                    emailOK = true;
                } else {
                    errors.push({ msg: "Email is already in use" })
                }
            }
        )


        //Checking if username is in user (not ideal need to fix)    
        checkUsername(username, (userOK) => {
            if (userOK && emailOK) {

                //Hashing password using bcryptjs (unlike facebook)
                bcrypt.genSalt(10, (error, salt) => {
                    bcrypt.hash(password, salt, (error, hash) => {
                        if (error) throw error;
                        pool.execute('INSERT INTO users (username,password,userType,fname,lname,email,registerDate) VALUES (?,?,?,?,?,?,?)', [username, hash, 'user', fname, lname, email, new Date(Date.now())],
                            (error, results, fields) => {
                                if (error) throw error;
                                req.flash('success_msg', 'You are now registered! Please Login')
                                res.redirect('/login')
                            })
                    })
                })

            } else {
                res.render('signup', {
                    errors,
                    fname,
                    lname,
                })

                errors = []
            }
        })
    }
})


//Login Handler
router.post('/login', (req, res) => {
    passport.authenticate(
        'local',
        { session: true, failureRedirect: '/login' },
        (error, user) => {

            if (error || !user) {
                req.flash("error_msg", "Wrong Username or Password")
                res.redirect('/login')
            } else {
                pool.execute('UPDATE users SET lastLogIn=? WHERE userID=?', [new Date(), user.userID],
                    (errors, results, fields) => {
                        console.log('Date added')
                    })
                /** This is what ends up in our JWT */
                const payload = {
                    username: user.username,
                    userID: user.userID,
                    fname: user.fname,
                    userType: user.userType
                };

                /** Assigns payload to req.user */
                req.login(payload, { session: true }, (error) => {
                    if (error) {
                        res.send('error');
                    }

                    /** Generate a signed json web token and return it in the response */
                    const token = jwt.sign(JSON.stringify(payload), keys.secret);

                    /** Assign our jwt to the cookie */
                    res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 1800000 });
                    req.session.lastActivity = Date.now().toString()

                    res.redirect('/')

                });

            }


        },
    )(req, res);
});


//THIS IS STUPID
router.get('/account',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { username, userID } = user
        req.session.lastActivity = Date.now()


        pool.execute('SELECT * FROM users WHERE username=?', [username],
            (error, results, fields) => {
                if (error) throw error
                const { fname, lname, email, registerDate } = results[0]
                const newReg = new Date(registerDate)
                pool.execute('SELECT COUNT(roomID) AS numOfRooms FROM Rooms WHERE userID = ?', [userID],
                    (error, results, fields) => {
                        if (error) throw error;
                        const numOfRooms = results[0].numOfRooms
                        pool.execute('SELECT COUNT(deviceID) AS numOfDevices FROM Devices WHERE userID = ?', [userID],
                            (error, results, fields) => {
                                const numOfDevices = results[0].numOfDevices
                                if (error) throw error;
                                pool.execute('SELECT COUNT(deviceID) AS numOfCameras FROM Devices WHERE userID = ? AND type=?', [userID, 'camera'],
                                    (error, results, fields) => {
                                        res.render('account_page', {
                                            username,
                                            fname,
                                            lname,
                                            email,
                                            numOfRooms,
                                            numOfDevices,
                                            numOfCameras: results[0].numOfCameras,
                                            registerDate: newReg.toDateString(),
                                            sessionedRender: true
                                        })
                                    })
                            })
                    })
            })
    })

router.get('/account/edit',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { username } = user
        req.session.lastActivity = Date.now().toString()

        pool.execute('SELECT * FROM users WHERE username=?', [username],
            (error, results, fields) => {
                if (error) throw error
                const { username, fname, lname, email } = results[0]
                res.render('edit_account_page', {
                    username,
                    fname,
                    lname,
                    email,
                    sessionedRender: true
                })
            })
    })

router.post('/account/edit',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const { user } = req
        const { userID } = user

        const { username, fname, lname, email } = req.body
        pool.execute('UPDATE users SET lname=?,fname=?,username=?,email=? WHERE userID=?', [lname, fname, username, email, userID],
            (error, results, fields) => {
                if (error) {
                    req.flash('error_msg', 'Username or Email already exists')
                    return res.redirect('/account/edit')
                }

                const payload = {
                    username: username,
                    userID: user.userID,
                    userType: user.userType,
                    fname: fname
                };

                /* Loging Out The User And Loging him in with new credentials */
                res.clearCookie('jwt');
                req.logout();

                req.login(payload, { session: true }, (error) => {
                    if (error) {
                        res.send('error');
                    }

                    /* Generate a signed json web token and return it in the response */
                    const token = jwt.sign(JSON.stringify(payload), keys.secret);

                    /* Assign our jwt to the cookie */
                    res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 1800000 });
                    req.session.lastActivity = Date.now().toString()

                    /* Flash and Redirect */
                    req.flash("success_msg", "Account Updated")
                    res.redirect('/account')
                });


            })
    })

router.get('/users/delete',
    passport.authenticate('jwt', { session: true, failureRedirect: '/login' }),
    (req, res) => {
        const userID = req.query.id
        if (!(req.user.userType == 'admin')) {
            res.status(403).send('Unathorised')

        } else {
            pool.execute('DELETE FROM users WHERE userID=?', [userID],
                (errors, results, fields) => {
                    req.flash('success_msg', 'User deleted')
                    res.redirect('/admin/dashboard')

                }
            )
        }
    }
)

router.get('/logout', (req, res, next) => {
    const userID = req.user.userID
    if (req.session) {
        // delete session object
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            } else {

                pool.execute('UPDATE users SET lastLogOut=? WHERE userID=?', [new Date(), userID],
                    (errors, results, fields) => {
                    })
                res.clearCookie('jwt');
                res.clearCookie('session')
                req.logout();
                return res.redirect('/');

            }
        })
    }
})

module.exports = router
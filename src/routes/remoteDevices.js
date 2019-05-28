const express = require('express')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const keys = require('../config/keys');

const router = express.Router()

const pool = require('../db')


router.post('/remotedevices/login',
    (req, res) => {
        passport.authenticate(
            'local',
            { session: false },
            (error, user) => {


                if (error || !user) {
                    res.status(401).send("Wrong Username or Password")

                } else {
                    /** This is what ends up in our JWT */
                    const payload = {
                        username: user.username,
                        userID: user.userID,
                        fname: user.fname,
                        userType: user.userType
                    };

                    /** Assigns payload to req.user */
                    req.login(payload, { session: false }, (error) => {
                        if (error) {
                            res.send('error');
                        }

                        /** Generate a signed json web token and return it in the response */
                        const token = jwt.sign(JSON.stringify(payload), keys.secret);

                        /** Assign our jwt to the cookie */
                        res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 1800000 });

                        pool.execute(`SELECT deviceID, type FROM Devices WHERE userID=? AND (type='thermometer' OR type='rainsensor' OR type='hsensor')`, [user.userID],
                            (errors, results, fields) => {
                                if (errors) throw errors;
                                //Stringifying every row of the array (every json object MYSQL returns)
                                results = results.map(row => (row = JSON.stringify(row),row));
                                res.status(200).send(results)

                            }
                        )

                    });

                }


            },
        )(req, res);
    }
)
router.post('/remotedevices/',
    (req, res) => {
        // passport.authenticate('jwt', { session: false },
        //     (req, res) => {

        pool.execute('UPDATE Devices SET value = IF(value IS NULL OR JSON_TYPE(value) != "ARRAY", JSON_ARRAY(), value), value = JSON_ARRAY_APPEND(value,"$",JSON_OBJECT("data", ? , "time", ?)) WHERE deviceID=?', [req.body.data,req.body.time,req.query.id],
            (errors, results, fields) => {
                if (errors) throw errors;
                res.status(200).send(req.body)
            }
        )
    }
)
//     }
// )




module.exports = router
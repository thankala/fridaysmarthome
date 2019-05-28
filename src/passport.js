const pool = require('./db')
const localStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const bcrypt = require('bcrypt')

const { secret } = require('./config/keys');



module.exports = (passport) => {
    passport.use(
        'local',
        new localStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
            (username, password, cb) => {
                pool.execute('SELECT username,password,userID,fname,userType FROM users WHERE username=?', [username], (errors, results, fields) => {
                    if (errors) throw errors;

                    if (results.length < 1) {
                        return cb(null, false, { error_msg: 'User not found' })
                    }

                    bcrypt.compare(password, results[0].password, (err, isMatch) => {
                        if (err) throw error;
                        if (isMatch) {
                            return cb(null, results[0])
                        } else {
                            return cb(null, false, { error_msg: 'Password incorrect' })
                        }
                    })

                })

            }))

    passport.use(new JWTStrategy({
        jwtFromRequest: req => req.cookies.jwt,
        // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secret,
    },
        (jwtPayload, done) => {
            // console.log(jwtPayload)
            return done(null, jwtPayload);
        }
    ));

    passport.serializeUser(function (user, done) {

        done(null, user.userID);
    });

    passport.deserializeUser(function (id, done) {

        pool.execute('SELECT username,userID,fname,userType FROM users WHERE userID=?', [id], (errors, results, fields) => {
            done(errors, results[0]);
        });
    });
}
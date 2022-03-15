const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mysql = require('mysql');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'haider',
  password: 'haider',
  database: 'test'
});

passport.serializeUser(function (user, done) {
  done(null, user)
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: "802321816571-6o1t1hpjstj84665s76h43l7acsscrcd.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    pool.getConnection((err, connection) => {
      connection.query("SELECT Googleid FROM users WHERE Googleid = ? ", [profile.id], (err, rows) => {
        if (err) console.log(err);
        if (rows.length === 0) {
          console.log("row is empty");
          connection.query("INSERT INTO users (Googleid, Name,Email,profile) VALUES (?, ?, ?, ?)", [profile.id, profile.displayName, profile.emails[0].value, profile.photos[0].value]);
        }
      });
    });
    return done(null, profile);
  }
));
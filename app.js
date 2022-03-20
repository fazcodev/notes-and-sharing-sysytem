const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const ejs = require("ejs");
const passport = require('passport');
const cookieSession = require('cookie-session');
const fileUpload = require('express-fileupload');
require('./passport-setup');

const app = express();
app.use(fileUpload());




app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


const pool = mysql.createPool({
    host: 'localhost',
    user: 'haider',
    password: 'haider',
    database: 'test'
});



app.use(cookieSession({
    name: 'notes-sharing-system',
    keys: ['key1', 'key2']
}));

const isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.redirect('/');
    }
}

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.render("home",{user:req.user});
});

app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/explore' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/explore');
    });

app.get('/logout', (req, res) => {
    req.session = null;
    req.logout();
    res.redirect('/');
});

app.get('/about', (req, res) => {
    res.render('about',{user:req.user});
})

app.get('/contact', (req, res) => {
    res.render('contact',{user:req.user});
})
app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/explore', (req, res) => {
    pool.getConnection((err, connection) => {
        connection.query("select users.Googleid,users.Name,posts.id,posts.images, books.title,books.price,categories.subject,posts.postdate from posts join categories on posts.id=categories.postid join books on posts.id=books.postid join users on users.Googleid=posts.userid", (err, rows) => {
           
            if (err) {
                console.log(err);
            }
            else {
               
                 res.render('explore', { rows: rows,user:req.user });
            }

        });
    });

});

app.post('/explore',(req,res)=>{
    let searchItem=req.body.searchItem;
    let sql="select users.Googleid,users.Name,posts.id,posts.images, books.title,books.price,categories.subject,posts.postdate from posts join categories on posts.id=categories.postid join books on posts.id=books.postid join users on users.Googleid=posts.userid WHERE books.title LIKE ? OR books.description LIKE ?";
    pool.getConnection((err,connection)=>{
        connection.query(sql,[searchItem,searchItem],(err,rows)=>{
            if(err)console.log(err);
            res.render('explore', { rows: rows,user:req.user });
        })
    })
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    res.redirect("home");
});

app.get('/post', isLoggedIn, (req, res) => {
    res.render('post',{user:req.user});
});

app.get('/explore/:id', (req, res) => {
    let id = req.params.id;
    pool.getConnection((err, connection) => {
        connection.query("select users.Googleid,users.Name,posts.id,posts.images,books.description, books.title,books.price,categories.subject,posts.postdate from posts join categories on posts.id=categories.postid join books on posts.id=books.postid join users on users.Googleid=posts.userid where posts.id=?", [id], (err, rows) => {
         
            res.render('item-details',{rows,user:req.user});
            
        });
    });
});

app.get('/user/:id',(req,res)=>{
    let id = req.params.id;
    pool.getConnection((err, connection) => {
        connection.query("select * from users where Googleid=?", [id], (err, row) => {
            
        
        connection.query("select posts.id,posts.images,posts.postdate,books.price,books.description from posts join books on posts.id=books.postid  where posts.userid=?", [id], (err, rows) => {
            
            
           res.render('seller',{rows:rows,row:row})
        });
    });
    });
})


app.post("/post", (req, res) => {

    let data = req.body;
    let d = new Date();
    let NoTimeDate = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("no file uploaded");

    }
    let uploadPath = __dirname + "/public/post-images/" + req.files.sampleFile.name;
    console.log(req.files);
    console.log(uploadPath);

    req.files.sampleFile.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
    });

    pool.getConnection((err, connection) => {
        if (err)
            console.log('connected post page');
        connection.query("INSERT INTO posts (images, userid ,postdate) VALUES (?,?,?)", [req.files.sampleFile.name, req.user.id, NoTimeDate], (err, rows) => {
            console.log('posts');
            if (err) console.log(err);
            console.log(rows);
            let post_id = rows.insertId;
            console.log(post_id);
                                                                                                                        
            console.log("connected book and categoty table");
            connection.query("INSERT INTO books (type,price,page,description,title, postid) VALUES (?,?,?,?,?,?)", [data.type, data.price, data.page, data.description, data.title, post_id], (err, rows) => {
                console.log('books');
                console.log(post_id);
                if (err) console.log(err);
            });

            connection.query("INSERT INTO categories (graduate,subject,postid) VALUES (?,?,?)", [data.graduate, data.subject, post_id], (err, rows) => {
                console.log('categories');
                console.log(post_id);
                if (err) console.log(err);
            });

        });



    });
    res.redirect('/explore');
});

app.listen(3000, function () {
    console.log("server is running at port 3000");
});
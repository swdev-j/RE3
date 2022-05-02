const express = require('express');
const app = express();
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const xss = require('xss'); // XSS 방지
const session = require('express-session');
const ios = require("express-socket.io-session");
const axios = require("axios");
const { sql_query, db } = require("./db");
const { Auth, sendmail } = require("./email");
require('dotenv').config();
const session_data = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
});

const getHtml = async (text) => {
  try {
    return await axios.get("https://spocjaxkrk.execute-api.ap-northeast-2.amazonaws.com/v1/detect?comment="+encodeURIComponent(text));
  } catch (error) {
    console.error(error);
  }
};

const sql = {
    'insert_data': 'INSERT INTO re22_chat (nickname,message,date,type) values (?, ?, now(), ?)',
    'insert_user': 'INSERT INTO re22_user (nickname, pw, email) values (?, password(?), ?)',
    'insert_type': 'UPDATE re22_chat SET type=? where id=?',
    'select_data': 'SELECT * FROM re22_chat WHERE ? <= id and id <= ?',
    'valid_name': 'SELECT * FROM re22_user WHERE nickname=?',
    'valid_email': 'SELECT * FROM re22_user WHERE email=?',
    'valid_login': 'SELECT * FROM re22_user WHERE nickname=? and pw=password(?)'
};

sql_key = Object.keys(sql);
console.log(sql_key);

console.log(__dirname)
app.set("view engine", "ejs");
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session_data);
io.use(ios(
    session_data, {
        autoSave: true
    }
))

let count=1;

let email_verify = {};

app.get("/",function(req, res){
    // if(req.session.name) {
        res.render("client", {name: req.session.name});
    // } else {
        //     res.redirect("/login");
        // }
});

app.get('/session', function(req,res) {
    req.session.name = "user" + count++;
    res.send('success');
})
    
app.get("/signup", function(req,res){
    if(req.session.name) {
        res.redirect("/");
    } else {
        res.sendFile(__dirname + "/public/login.html");
    }
});

app.post("/signup", function(req,res){
});

app.post('/check_email', function(req, res) {
    let email = req.body.email;
    let code = Auth();
    let status = sendmail(code, email);
    email_verify[email] = code;
    setTimeout(() => {
        delete email_verify[email];
    }, 10*60*1000);
    console.log(JSON.stringify(email_verify,null,4));
    if(status) {
        res.send('success');
    } else {
        res.send('fail');
    }
});

app.post('/verify_email', function(req, res) {
    let email = req.body.email;
    let code = req.body.code;
    if(email_verify[email] == code && email_verify[email] && email_verify[email].length == 29) {
        res.send('success');
    } else {
        res.send('fail');
    }
});

app.post('/same_name', function(req, res){
    let name = req.body.name;
    sql_query('valid_name', [name])
        .then(result => {
            if(result) {
                if(result.length == 0) {
                    res.send('success');
                } else if(result.length == 1) {
                    res.send('fail');
                } else {
                    console.log(result);
                    res.send('error');
                }
            } else {
                res.send('error');
            }
        })
});

app.post('/same_email', function(req, res){
    let email = req.body.email;
    sql_query('valid_email', [email])
        .then(result => {
            if(result) {
                if(result.length == 0) {
                    res.send('success');
                } else if(result.length == 1) {
                    res.send('fail');
                } else {
                    console.log(result);
                    res.send('error');
                }
            } else {
                res.send('error');
            }
        })
});

app.get("/signin", function(req,res){
    res.sendFile(__dirname + "/public/signin.html");
});

app.get("/forget", function(req,res){
    res.sendFile(__dirname + "/public/forget.html");
});

let chat_id = 0;

// db.query('select id from re22_chat order by id desc limit 1;', function (err, rows, fields) {
//     if (!err) {
//         if(rows == []) {
//             chat_id = 0;
//         } else {
//             chat_id = rows[0]['id'];
//         }
//     } else {
//         console.log('query error : ' + err);
//         console.log(err);
//     }
// });
io.on('connection', function(socket){
    console.log('user connected: ', socket.id);
    let name;
    console.log(socket.handshake.session.name);
    if(socket.handshake.session.name == undefined) {
        name = "user" + count++;
        socket.handshake.session.name = name;
        socket.handshake.session.save();
    } else {
        name = socket.handshake.session.name;
    }
    io.to(socket.id).emit('change name',name);

    socket.on('disconnect', function(){
        console.log('user disconnected: ', socket.id);
    });
    
    socket.on('send message', function(name,text){
        let chk_name = socket.handshake.session.name;
        if(name == chk_name) {
            chat_id++;
            if(text.trim() !== ''){
                let id = chat_id;
                let req_text = xss(text);
                // sql_query('insert_data', [name, req_text, -1]);
                io.emit('receive message', name, req_text, id);
                let msg = name + ':' + req_text;
                console.log(id + '.' + msg);
                getHtml(req_text)
                    .then(html => Object.values(html.data).reduce((a, b) => a + b))
                    .then(type => {
                        console.log(id, msg, type);
                        io.emit('receive type', type, id);
                        // sql_query('insert_type', [type, id]);
                    })
                    .catch(err => console.log(err))
            }
        } else {
            console.log(`invalid name!! ${chk_name} => ${name}`);
        }
    });
});

http.listen('3000', function(){
    console.log("server on!");
});

process.on('exit', (code)=>{
    console.log(`exit code : ${code}`);
    if(code !== 0) {
        logger.error({
            exitCode: code,
            message: "I'm gone",
            timestamp: new Date(),
        });
    }
});

process.once('SIGINT', ()=>{
    db.destroy();
    console.log("You've pressed Ctrl + C on this process.");
    process.exit();
})
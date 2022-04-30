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
const { db } = require("./db");
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
    'valid_email': 'SELECT * FROM user WHERE email=?',
    'valid_login': 'SELECT * FROM re22_user WHERE nickname=? and pw=password(?)'
};

sql_key = Object.keys(sql);
console.log(sql_key);

const sql_query = (sql_data, params) => {
    if(sql_key.includes(sql_data)) {
        if(sql_data.startsWith('insert')) {
            db.query(sql[sql_data], params, function (err, result) {
                if (!err) {
                    console.log(result);
                } else {
                    console.log('query error : ' + err);
                    console.log(err);
                }
            });
        } else {
            db.query(sql[sql_data], params, function (err, rows, fields) {
                if (!err) {
                    console.log(rows);
                    console.log(fields);
                    var result = 'rows : ' + JSON.stringify(rows) + '\n\n' + 'fields : ' + JSON.stringify(fields);
                    console.log(result);
                } else {
                    console.log('query error : ' + err);
                    console.log(err);
                }
            });
        }
    } else {
        return false;
    }
}

console.log(__dirname)
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
app.get("/",function(req, res){
    // if(req.session.name) {
        res.sendfile("public/client.html");
    // } else {
        //     res.redirect("/login");
        // }
});
    
app.get("/signin", function(req,res){
    if(req.session.name) {
        res.redirect("/");
    } else {
        res.sendfile("public/login.html");
    }
});

app.post("/signup", function(req,res){
    
});

app.get("/signin", function(req,res){
    res.sendfile("public/signin.html");
});

app.get("/forget", function(req,res){
    res.sendfile("public/forget.html");
});

let chat_id;

db.query('select id from re22_chat order by id desc limit 1;', function (err, rows, fields) {
    db.end();
    if (!err) {
        if(rows == []) {
            chat_id = 0;
        } else {
            chat_id = rows[0]['id'];
        }
    } else {
        console.log('query error : ' + err);
        console.log(err);
    }
});
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
                        io.emit('receive type', data, id);
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
    console.log("You've pressed Ctrl + C on this process.");
    db.end();
})
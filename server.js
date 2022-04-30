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

const getHtml = async (text) => {
  try {
    return await axios.get("https://spocjaxkrk.execute-api.ap-northeast-2.amazonaws.com/v1/detect?comment="+encodeURIComponent(text));
  } catch (error) {
    console.error(error);
  }
};

const sql = {
    'insert_data': 'INSERT INTO re22_chat (nickname,message,date,type) values (?, ?, now(), ?)',
    'insert_user': 'INSERT INTO re22_user (nickname, pw, email) values (?, ?, ?)',
    'select_data': 'SELECT * FROM re22_chat WHERE ? <= id and id <= ?',
    'valid_email': 'SELECT * FROM user WHERE email=?',
    'valid_login': 'SELECT * FROM re22_user WHERE nickname=? and pw=?'
};

console.log(__dirname)
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
io.use(ios(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true
    }), {
        autoSave: true
    }
))

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

let count=1;
let chat_id = 0;
io.on('connection', function(socket, session){
    console.log('user connected: ', socket.id);
    let name;
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
                let msg = name + ' : ' + req_text;
                io.emit('receive message', msg, id);
                console.log(id + '.' + msg);
                getHtml(req_text)
                    .then(html => Object.values(html.data).reduce((a, b) => a + b))
                    .then(data => {
                        console.log(id, msg, data);
                        io.emit('receive type', data, id);
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
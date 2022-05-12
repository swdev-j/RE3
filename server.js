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
const db = require("./db");
const { Auth, sendmail, sendNameMail } = require("./email");
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

let email_verify = {};

app.get("/",function(req, res){
    if(req.session.name) {
        chat_before = chat_id>15?chat_id-15:0;
        db.sql_query('select_data_by_id', [chat_before,chat_id])
            .then(result => {
                console.log(result);
                for(let i in result) {
                    result[i].date = result[i].date.toString().split(' ')[4];
                }
                res.render("client", {name: req.session.name, list:result});
            })
            .catch(result => {
                console.log(result);
                res.send('db error');
            })
    } else {
        res.redirect("/login");
    }
});
    
app.get("/login", function(req,res){ // login site
    if(req.session.name) {
        res.redirect("/");
    } else {
        res.sendFile(__dirname + "/public/login.html");
    }
});

app.post("/login", function(req,res){ // login site
    if(req.session.name) {
        console.log(req.session)
        res.redirect("/");
    } else {
        if(req.body && req.body.name && req.body.password) {
            console.log(req.body);
            db.sql_query('valid_login', [req.body.name, req.body.password])
                .then(result => {
                    if(result.length == 0) {
                        res.send('<script>alert("로그인 실패!");history.go(-1)</script>');
                    } else {
                        req.session.name = req.body.name;
                        res.redirect('/');
                    }
                })
        } else {
            res.redirect("/");
        }
    }
});

app.post("/add_content", function(req, res){
    if(req.session.name) {
        let id = req.body.id;
        db.sql_query('select_data_by_id', [id - 16, id-1])
            .then(result => {
                console.log(result);
                for(let i in result) {
                    result[i].date = result[i].date.toString().split(' ')[4];
                }
                res.json(result.reverse());
            })
        .catch(result => {
            console.log(result);
            res.json(['error']);
        })
    } else {
        res.json(['fail']);
    }
})

app.get("/logout", function(req,res){ // login site
    if(req.session.name) {
        req.session.destroy();
    }
    res.redirect("/login");
});

app.post('/check_email', function(req, res) { // email authentication code
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

app.post('/verify_email', function(req, res) { // email authentication code check
    let email = req.body.email;
    let code = req.body.code;
    if(email_verify[email] == code && email_verify[email] && email_verify[email].length == 29) {
        res.send('success');
    } else {
        res.send('fail');
    }
});

app.post('/same_name', function(req, res){ // check if the name of the same exist
    let name = req.body.name;
    db.sql_query('valid_name', [name])
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

app.post('/same_email', function(req, res){ // check if the email of the same exist
    let email = req.body.email;
    db.sql_query('valid_email', [email])
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

app.get("/signin", function(req,res){ // siginin site
    res.sendFile(__dirname + "/public/signin.html");
});

app.post("/signin", function(req,res){
    let name = req.body.name;
    let email = req.body.email;
    let code = req.body.email_verify;
    let pw = req.body.pw;
    let valid_pw = req.body.valid_pw;
    db.sql_query('valid_name', [name])
        .then(result => {
            if(result) {
                if(result.length == 0) {
                    return 'success';
                } else if(result.length == 1) {
                    throw new Error('name fail');
                } else {
                    console.log(result);
                    throw new Error(`name error1 ${result}`);
                }
            } else {
                throw new Error(`name error2 ${result}`);
            }
        })
        .then(() => db.sql_query('valid_email', [email]))
        .then(result => {
            if(result) {
                if(result.length == 0) {
                    return 'success';
                } else if(result.length == 1) {
                    throw new Error('email fail');
                } else {
                    console.log(result);
                    throw new Error(`email error1 ${result}`);
                }
            } else {
                throw new Error(`email error2 ${result}`);
            }
        })
        .then(() => {
            if(email_verify[email] == code && email_verify[email] && email_verify[email].length == 29) {
                return 'success';
            } else {
                throw new Error('verify email fail');
            }
        })
        .then(() => {
            if(pw === valid_pw && pw.length >= 8) {
                return 'success';
            } else {
                throw new Error('pw fail');
            }
        })
        .then(() => db.sql_query('insert_user', [name, pw, email]))
        .then(() => res.send('success'))
        .catch((err) => {
            console.log(err.message);
            res.send(err.message)
        })
    console.log(req.body);
});

app.get("/forget", function(req,res){
    if(req.session.name) {
        res.redirect('/');
    } else {
        res.sendFile(__dirname + "/public/forget.html");
    }
});

app.post("/forget", function(req,res){
    if(req.session.name) {
        res.redirect('/');
    } else {
        if(req.body && req.body.type && req.body.email && req.body.email_verify) {
            let type = req.body.type;
            let email = req.body.email;
            let code = req.body.email_verify;
            if(type == 'NameTarget') {
                if(email_verify[email] == code && email_verify[email] && email_verify[email].length == 29) {
                    //  sql 통해 닉네임 찾기
                    db.sql_query('valid_email', [email])
                        .then(result => {
                            console.log(result);
                            if(result) {
                                if(result.length == 1) {
                                    return result[0].nickname;
                                } else if(result.length == 0) {
                                    throw new Error('email fail');
                                } else {
                                    console.log(result);
                                    throw new Error(`email error1 ${result}`);
                                }
                            } else {
                                throw new Error(`email error2 ${result}`);
                            }
                        })
                        .then((result)=>sendNameMail(email, result))
                        .then(()=>res.send('success'))
                        .catch((err)=> {
                            console.log(err);
                            res.send('fail');
                        })
                } else {
                    res.send('fail')
                }
            } else if(type == 'PassTarget') {
                let pw = req.body.pw;
                let valid_pw = req.body.valid_pw;
                if(email_verify[email] == code && email_verify[email] && email_verify[email].length == 29) {
                    if(pw === valid_pw && pw.length >= 8) {
                        db.sql_query('change_pw', [pw,email])
                            .then(result => res.send('success'))
                            .catch((err)=> {
                                console.log(err);
                                res.send('error');
                            })
                    } else {
                        res.send('fail');
                    }
                } else {
                    res.send('fail');
                }
            }
        }
    }
});

let chat_id = 0;
let chat_before = 0;
db.sql_query('count_chat',[])
    .then(result => {
        if(result.length == 0) {
            chat_id = 0;
        } else {
            chat_id = result[0]['id'];
        }
    })

// db.db.query('select id from re22_chat order by id desc limit 1;', function (err, rows, fields) {
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
io.on('connection', function(socket) {
    console.log('user connected: ', socket.id);
    let name;
    console.log(socket.handshake.session.name);
    if(socket.handshake.session.name == undefined) {
        socket.disconnect(true);
    } else {
        name = socket.handshake.session.name;
    }
    io.to(socket.id).emit('change name',name);

    socket.on('disconnect', function(){
        console.log('user disconnected: ', socket.id);
    });
    
    socket.on('send message', function(name,text){
        let chk_name = socket.handshake.session.name;
        let time = new Date().toString().split(' ')[4];
        if(name == chk_name) {
            chat_id++;
            if(text.trim() !== ''){
                let id = chat_id;
                let req_text = xss(text);
                io.emit('receive message', name, req_text, id, time);
                db.sql_query('insert_data', [name, req_text, -1]);
                let msg = name + ':' + req_text;
                console.log(id + '.' + msg);
                getHtml(req_text)
                    .then(html => Object.values(html.data).reduce((a, b) => a + b))
                    .then(type => {
                        console.log(id, msg, type);
                        io.emit('receive type', type, id);
                        db.sql_query('insert_type', [type, id]);
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
    let t = new Date();
    console.log(t.toString());
    console.log(`exit code : ${code}`);
    if(code !== 0) {
        logger.error({
            exitCode: code,
            message: "I'm gone",
            timestamp: new Date(),
        });
    }
    db.db.end();
});

process.once('SIGINT', ()=>{
    db.db.end();
    console.log("You've pressed Ctrl + C on this process.");
    process.exit();
})
import { runInNewContext } from "vm";

var express = require('express');
let app = express();

// app.set('trustproxy', true);
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
    secret: 'resebud', 
    resave: false, 
    saveUninitialized: true, 
    cookie: {maxAge: 600000}, 
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: 'db/',
    })
}));

app.set('view engine', 'pug');
app.use(express.urlencoded({extended: true})); 

var Database = require('better-sqlite3');
let db = new Database('db/quiz.db');
// app.use("/public", express.static(__dirname + "/public"));

let port = 8008;

let changePass = db.prepare("UPDATE Users SET pass = ? WHERE name = ?");
let getUsers = db.prepare("SELECT * FROM Users");

let quizzes = db.prepare("SELECT * FROM Quizzes").all();
quizzes.forEach(quiz => {
    quiz.data = JSON.parse(quiz.data);
});
let quizNames = db.prepare("SELECT id, name FROM Quizzes").all();
let users = getUsers.all();

function getCompleted(userId) {
    let res = db.prepare('select idQ from Results where idU = ?').all(userId);
    let ret = Array.from({length: quizNames.length + 1}, (v, i) => 0);
    res.forEach(el => { ret[el] = 1; });
    return ret;
} 
// console.log(users);

app.get('/public/:file', function(req, res) {
    console.log(__dirname + '/public/' + req.params.file);
    res.sendFile(__dirname + '/public/' + req.params.file);
});

app.post('/login', function(req, res, next) {
    console.log("login", req.body);
    let name = req.body.name;
    let pass = req.body.pass;
    req.err = "Invalid username or password";
    users.forEach(el => {
        if(name == el.name && pass == el.pass) {
            req.session.user = name;
            req.session.idU = el.id;
            req.err = undefined;
        }
    });
    next();
});

app.post('/changePass', function(req, res, next) {
    console.log("change", req.body);
    let pass = req.body.pass;
    let passNew = req.body.passNew;
    req.err = "Invalid password";
    users.forEach(el => {
        if(req.session.user == el.name && pass == el.pass) {
            req.session.user = undefined;
            changePass.run(passNew, el.name);
            users = getUsers.all();
            req.err = undefined;
        }
    });
    next();
});

app.get('/logout', function(req, res, next) {
    req.session.user = undefined;
    console.log("logout");
    next();
});

app.get('/quiz/:quizId', function(req, res, next) {
    console.log('quiz', req.params)
    let qId = req.params.quizId;
    req.quiz = quizzes[qId-1];
    console.log(req.quiz);
    req.done = getCompleted(req.session.idU)[qId];
    next();
});

app.all('/*', function(req, res) {
    // console.log(req.session);
    console.log("star " + req.session.user);
    if(req.session.count) req.session.count ++;
    else req.session.count = 1;
    // let tdb = new Database('db/sessions.db');
    // console.log(tdb.prepare('select * from sessions').all());
    if(!req.msg)
        req.msg = "Visited " + req.session.count + " pages this session";
    let args: {[k: string]: any} = {msg: req.msg, err: req.err};
    let url = '/';
    let view;
    console.log(req.msg, req.err);
    if(req.session.user) {
        args.name = req.session.user;
        if(req.quiz) {
            args.quiz = req.quiz;
            args.done = req.done;
            req.session.timestamp = Date.now();
            view = 'quiz';
            url = '/quiz/' + req.quiz.id;
        } else {
            args.quizzes = quizNames;
            args.done = getCompleted(req.session.idU);
            view = 'me';
            url = '/me';
        }
    } else {
        view = 'login';
    }
    res.location(url);
    res.render(view, args);
});


// set up server
app.listen(port, function() {
    console.log('server is running on port ' + port);
});
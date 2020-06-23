var express = require('express');
let app = express();
var bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));
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
let addResult = db.prepare("INSERT INTO Results (idQ, idU, data, score) VALUES (?, ?, ?, ?)");
let addAnswer = db.prepare("INSERT INTO Answers (idQ, nr, data) VALUES (?, ?, ?)");
let getStats = db.prepare("SELECT data FROM Results WHERE idQ = ? AND idU = ?");
let getAverage = db.prepare("select nr, avg(data) as av from Answers where idQ = ? group by nr;");
let getHighScores = db.prepare(`SELECT name, score 
    FROM Users INNER JOIN Results ON Users.id = Results.idU
    WHERE idQ = ? ORDER BY score LIMIT 5`);

let quizzes = db.prepare("SELECT * FROM Quizzes").all();
quizzes.forEach(quiz => {
    quiz.data = JSON.parse(quiz.data);
});
let quizNames = db.prepare("SELECT id, name FROM Quizzes").all();
let users = getUsers.all();

function getCompleted(userId) {
    let res = db.prepare('select idQ from Results where idU = ?').all(userId);
    let ret = Array.from({length: quizNames.length + 1}, (v, i) => 0);
    res.forEach(el => { ret[el.idQ] = 1; });
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

app.post('/quiz/:quizId', express.json(), function(req, res, next) {
    if(req.session.user) {
        console.log("solve", req.body);
        // console.log(req);
        let result = req.body;
        let time = (Date.now() - req.session.timestamp) / 1000;
        // console.log(time);
        let currentQuiz = quizzes[req.params.quizId-1];
        type Row = {answer: string, time: any, correct: boolean};
        let score = 0;
        let stats: Row[] = result.map( (row, i) => {
            let corr: boolean = row.answer == currentQuiz.data[i].answer;
            let tTime = (row.timeF * time).toPrecision(4);
            score += row.timeF * time;
            if(!corr) score += currentQuiz.data[i].penalty;
            return <Row> {answer: row.answer, time: tTime, correct: corr};
        });
        console.log(stats);
        addResult.run(req.params.quizId, req.session.idU, JSON.stringify(stats), score);
        stats.forEach((row, i) => { 
            if(row.correct)
                addAnswer.run(req.params.quizId, i, row.time) 
        });
    }
    // res.send("OK");
    next();
});

app.get('/quiz/:quizId', function(req, res, next) {
    if(req.session.user) {
        console.log('quiz', req.params)
        let qId = req.params.quizId;
        req.quiz = { ...quizzes[qId-1]};
        // console.log(quizzes[qId-1]);
        req.done = getCompleted(req.session.idU)[qId];
        if(!req.done) { // remove excess information about quiz 
            req.quiz.data = quizzes[qId-1].data.map( el => el.text);
            req.quiz.topScores = undefined;
        } else {
            let stats = JSON.parse(getStats.pluck().get(req.quiz.id, req.session.idU));
            req.stats = [];
            let data = req.quiz.data;
            let avg = getAverage.all(qId);
            for(var i = 0;i<req.quiz.data.length;i++) {
                let row = {question: data[i].text, answer: data[i].answer, answerU: stats[i].answer, time: stats[i].time, penalty: data[i].penalty, avg: 0};
                avg.forEach( el => {
                    if(el.nr == i) row.avg = el.av.toPrecision(4);
                });
                if(stats[i].correct) row.penalty = 0;
                req.stats.push(row);
            }
        }
        // console.log(req.done, req.quiz);
    }
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
            // console.log(args);
            if(req.done) 
                args.stats = req.stats;
                args.highScores = getHighScores.all(args.quiz.id);
            console.log(args.stats);
            view = 'quiz';
            url = '/quiz/' + req.quiz.id;
        } else {
            args.quizzes = quizNames;
            args.done = getCompleted(req.session.idU);
            console.log(args.done);
            view = 'me';
            url = '/me';
        }
    } else {
        view = 'login';
    }
    console.log(args);
    res.location(url);
    res.render(view, args);
});

// set up server
app.listen(port, function() {
    console.log('server is running on port ' + port);
});
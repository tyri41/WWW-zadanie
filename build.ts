var fs = require('fs');
var Database = require('better-sqlite3');

var db = new Database('db/quiz.db');

let str = fs.readFileSync('db/init.sql').toString();
db.exec(str);
console.log("database created");

let add = db.prepare("INSERT INTO Quizzes (name, intro, data) VALUES (?, ?, ?)");
let f = JSON.parse(fs.readFileSync('db/samples.json'));
f.forEach(el => {
    // console.log(el);
    add.run(el.name, el.intro, JSON.stringify(el.questions));
});

console.log(f.length + " quizzes added");

let addUser = db.prepare("INSERT INTO Users (name, pass) VALUES (?, ?)");
addUser.run('user1', 'user1');
addUser.run('user2', 'user2');

console.log("2 users added");
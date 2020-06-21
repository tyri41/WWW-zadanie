let json = JSON.parse(`
{
    "data": [
        {
            "name": "two for two",
            "intro": "hello there!",
            "questions": [
                {"text": "2 + 2", "answer": "4", "penalty": 10},
                {"text": "2 * 2", "answer": "4", "penalty": 10},
                {"text": "2^2", "answer": "4", "penalty": 10},
                {"text": "2 + 2 * 2/2", "answer": "4", "penalty": 10}
            ]
        },
        {
            "name": "step up",
            "intro": "now for something harder",
            "questions": [
                {"text": "d/dx(x^2) at (x = 2)", "answer": "4", "penalty": 20},
                {"text": "d/dx(1/x) at (x = 1)", "answer": "-1", "penalty": 22},
                {"text": "d/dy(4x^2 + 3x - 5) at (x = 8)", "answer": "0", "penalty": 24},
                {"text": "d/dx 8/((x-1)^2) at (x = 3)", "answer": "-2", "penalty": 30}
            ]
        }
    ]
}
`);

let data = json.data;
let quiz = data[0];

function loadData(newQuiz) {
    data = [newQuiz];
}

function getNames() {
    let names = [];
    for (var q of data) {
        names.push(q.name);
    }
    return names;
}
let times = [];
let answers = []
let timer = null;
// let qNum;
function setQuiz(n, el) {
    quiz = data[n];
    console.log(n);
    el.textContent = quiz.intro;
    times = [];
    answers = [];
    for(var i = 0; i < quiz.questions.length;i++) {
        times[i] = 0;
        answers[i] = '';
    }
}

function setTimer(n, el) {
    if(timer != null) {
        clearInterval(timer);
    }
    times[n]++;
    el.textContent = times[n];
    timer = setInterval(() => {
        times[n]++;
        el.textContent = times[n];
    }, 1000);
}

function setAnswer(n, s, el) {
    answers[n] = s;
    for (var v of answers) if(v == "") return;
    el.style.visibility = 'visible';
}

//block: 0->time, 1->question, 2->answer, 3->prev, 4->current, 5->next
function setQuestion(n, block) {
    console.log("new question " + n);
    setTimer(n, block[0]);
    block[1].textContent = quiz.questions[n].text;
    if(n == 0) block[3].style.visibility = 'hidden';
    else block[3].style.visibility = 'visible';
    if(n == quiz.questions.length - 1) block[5].style.visibility = 'hidden';
    else block[5].style.visibility = 'visible';
    block[4].textContent = (n+1) + '/' + quiz.questions.length;
    block[2].value = answers[n];
    answer.focus();
}

function quitQuiz() {
    clearInterval(timer);
}
let last_result
function endQuiz() {
    clearInterval(timer);
    let result = {name: '', stats: [], total: 0};
    for(var [i, q] of quiz.questions.entries()) {
        let line = {
            answer: answers[i],
            correct: (answers[i] == q.answer),
            score: times[i],
            str: times[i] + ''
        };
        if(!line.correct) {
            line.score += q.penalty;
            line.str = times[i] + " + " + q.penalty;
        }

        result.stats.push(line);
        result.total += line.score;
    }
    console.log(result);
    last_result = result;
}

function getResults(table) {
    while(table.rows.length > 0) table.deleteRow(0);
    for (let [i, r] of last_result.stats.entries()) {
        let row = table.insertRow();
        let cell = row.insertCell();
        cell.textContent = quiz.questions[i].text;
        cell = row.insertCell();
        cell.textContent = r.answer;
        if(r.correct) {
            cell.style.color = 'green';
            cell.textContent += " \u2713";
        }
        else {
            cell.style.color = 'red';
            cell.textContent += " \u2715"
        }
        cell = row.insertCell();
        cell.textContent = r.str;
    }
    return last_result.total;
}
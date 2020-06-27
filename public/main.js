// let quiz;
let times = [];
let answers = []
let timer = null;

function load() {
    console.log(quiz);
    for(var i = 0; i < quiz.data.length;i++) {
        times[i] = 0;
        answers[i] = '';
    }
}
// let qNum;

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
    for (var v of answers) if(v == "") {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';
}

//block: 0->time, 1->question, 2->answer, 3->prev, 4->current, 5->next
function setQuestion(n, block) {
    console.log("new question " + n);
    setTimer(n, block[0]);
    block[1].textContent = quiz.data[n];
    if(n == 0) block[3].style.visibility = 'hidden';
    else block[3].style.visibility = 'visible';
    if(n == quiz.data.length - 1) block[5].style.visibility = 'hidden';
    else block[5].style.visibility = 'visible';
    block[4].textContent = (n+1) + '/' + quiz.data.length;
    block[2].value = answers[n];
    answer.focus();
}

function quitQuiz() {
    clearInterval(timer);
}
let last_result
function endQuiz() {
    clearInterval(timer);
    let totalTime = 0;
    times.forEach(el => totalTime += el);
    let result = [];
    for(let i = 0;i<quiz.data.length;i++) {
        result.push({answer: answers[i], timeF: times[i]/totalTime});
    }
    // let result = {times: times, answers: answers};
    console.log(result);
    fetch('/quiz/' + quiz.id, {
        method: 'POST',
        body: JSON.stringify(result),
        headers: { "Content-Type": "application/json"}
    }).then((res) => console.log('submitted!'))
}
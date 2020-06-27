// export TS_NODE_COMPILER_OPTIONS='{"lib": ["ES2015"]}' 

import {Builder, Capabilities} from 'selenium-webdriver';
import { expect } from 'chai';
import {assert, driver, IWebDriverOptionsCookie} from 'mocha-webdriver';
let active = [0, 1, 1];

describe('test sesji', function () {
    if(!active[0]) return;
    let allCookies;
    it('should open a page', async function() {
        await driver.get('http://localhost:8008/');
        expect(await driver.find('h1').getText()).to.include('log');
        // console.log(await driver.find('a').getText());
    });
    it('should log in', async function() {
        await driver.find('#login').sendKeys('user2');
        await driver.find('#pass').sendKeys('user2');
        await (await driver.find('button[type=submit]')).doClick();
        expect(await driver.find('a').getText()).to.include('user2');
        // console.log(await driver.find('a').getText());
    });
    it('should save a session', async function() {
        await driver.manage().getCookies().then( cookies => { allCookies = cookies; });
    });
    it('should open a second page', async function() {
        await driver.manage().deleteAllCookies();
        await driver.get('http://localhost:8008/');
        expect(await driver.find('h1').getText()).to.include('log');
    });
    it('should log in again', async function() {
        await driver.find('#login').sendKeys('user2');
        await driver.find('#pass').sendKeys('user2');
        await (await driver.find('button[type=submit]')).doClick();
        expect(await driver.find('a').getText()).to.include('user2');
    });
    it('should change password and be logged out', async function() {
        // await driver.manage().getCookies().then( cookies => { console.log(cookies[0].value); });
        await driver.find('input[name=pass]').sendKeys('user2');
        await driver.find('input[name=passNew]').sendKeys('user2');
        await (await driver.find('button[type=submit]')).doClick();
        expect(await driver.find('a').getText()).to.include('not logged in');
    });
    it('should restore saved cookies', async function() {
        await driver.manage().deleteAllCookies();
        // driver.manage().
        for (var key in allCookies) {
            // console.log(allCookies[key]);
            let t: IWebDriverOptionsCookie = {name: allCookies[key].name, value: allCookies[key].value};
            // console.log(t);
            await driver.manage().addCookie(t);
        }
    });
    it('should be logged out too', async function() {
        await driver.get('http://localhost:8008/');
        expect(await driver.find('a').getText()).to.include('not logged in');
    });
});

describe('test rozwiązywania quizu', function () {
    if(!active[1]) return;
    it('should open a page', async function() {
        this.timeout(5000);
        await driver.get('http://localhost:8008/');
        expect(await driver.find('h1').getText()).to.include('log');
    });
    it('should log in', async function() {
        this.timeout(5000);
        await driver.find('#login').sendKeys('user2');
        await driver.find('#pass').sendKeys('user2');
        await (await driver.find('button[type=submit]')).doClick();
        expect(await driver.find('a').getText()).to.include('user2');
    });
    it('should open a quiz', async function () {
        this.timeout(5000);
        await (await driver.find('#bToQuiz')).doClick();
        // await new Promise(r => setTimeout(r, 2000));
        expect(await driver.findWait('#tIntro', 2000, 'quiz not started').getText()).to.include('hello there!');
    });
    it('should complete a quiz', async function () {
        this.timeout(20000);
        // times will be 1 2 3 4
        for(var i = 0;i<4;i++) {
            if(i == 2)
                await driver.find('#answer').sendKeys('3');
            else
                await driver.find('#answer').sendKeys('4');
            await new Promise(r => setTimeout(r, 1000 * i + 20));
            expect(await driver.find('#timer').getText()).to.include(i+1);
            if(i != 3)
                await driver.find('#next').click();
        }
        await driver.find('#bDone').click();
    });
    it('should show the score', async function () {
        this.timeout(5000);
        await driver.find('#score').click();
        expect(await driver.find('h2').getText()).to.include('Your scores');
    });
});
describe('test ponownego rozwiązywania quizu', function () {
    if(!active[1]) return;
    it('should open main page', async function () {
        this.timeout(5000);
        await driver.get('http://localhost:8008/');
        expect(await driver.find('a').getText()).to.include('user2');
    });
    it('should be able to go to quiz', async function () {
        this.timeout(5000);
        await driver.find('#bToQuiz').click();
    });
    it('should be redirected to scores', async function () {
        this.timeout(5000);
        await driver.findWait('th', 2000, 'score not loaded');
        expect(await driver.find('h2').getText()).to.include('Your scores');
    });
});
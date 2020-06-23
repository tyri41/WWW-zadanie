DROP TABLE IF EXISTS Quizzes;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Results;
DROP TABLE IF EXISTS Answers;

CREATE TABLE Quizzes (
    id INTEGER NOT NULL,
    name TEXT NOT NULL,
    intro TEXT,
    data BLOB NOT NULL,
    topScores BLOB,
    PRIMARY KEY(id)
);

CREATE TABLE Users (
    id INTEGER NOT NULL,
    name TEXT NOT NULL,
    pass TEXT NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE Results (
    id INTEGER NOT NULL,
    idQ INTEGER NOT NULL,
    idU INTEGER NOT NULL,
    data BLOB,
    score REAL,
    PRIMARY KEY(id)
);

CREATE TABLE Answers (
    id INTEGER NOT NULL,
    idQ INTEGER NOT NULL,
    nr INTEGER NOT NULL,
    data BLOB,
    PRIMARY KEY(id)
);
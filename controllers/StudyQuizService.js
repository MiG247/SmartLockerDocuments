'use strict';

const fs = require('fs');
const Question = require('../models/Question.model');
const Quiz = require('../models/Quiz.model');
const User = require('../models/User.model');
const jwt = require('../jwt');
const sentry = require('raven');

exports.createQuestion = function (args, res, next) {
  /**
   * Create a new question.
   *
   * question Question Details of the new question
   * returns Question
   **/
  Question.createQuestion(args.question.value, (err, question) => {
    if (err) {
      return res.error(err);
    }
    return res.json(question, 200);
  });
};

exports.createQuiz = function (args, res, next) {
  /**
   * Create a new quiz.
   *
   * quiz Quiz Details of the new quiz
   * returns Quiz
   **/
  Quiz.create(args.quiz.value, (err, quiz) => {
    if (err) {
      return res.error(err);
    }
    res.json(quiz, 200);
  });
}

exports.createUser = function (args, res, next) {
  /**
   * Create a new user.
   *
   * user User Details of the new user
   * returns User
   **/
  User.createUser(args.user.value, (err, user) => {
    if (err) {
      return res.error(err);
    }
    var output = JSON.parse(JSON.stringify(user));
    jwt.sign({ userId: user._id }, (err, key) => {
      if (err) {
        sentry.captureException(err);
      }
      output.key = key;
      res.json(output, 200);
    });
  });
}

exports.deleteQuestion = function (args, res, next) {
  /**
   * Delete a question.
   *
   * questionId String The question identifier number
   * no response value expected for this operation
   **/
  Question.deleteQuestion(args.questionId.value, (err) => {
    if (err) {
      res.error(err);
    }
    res.status(200);
  });
}

exports.deleteQuiz = function (args, res, next) {
  /**
   * Delete a quiz.
   *
   * quizId String The quiz identifier number
   * no response value expected for this operation
   **/
  Quiz.deleteQuiz(args.quizId.value, (err) => {
    if (err) {
      return res.error(err);
    }
    res.status(200);
  });
}

exports.deleteUser = function (args, res, next) {
  /**
   * Delete a user.
   *
   * userId String The user identifier number
   * no response value expected for this operation
   **/
  User.deleteUser(args.userId.value, (err) => {
    if (err) {
      return res.error(err);
    }
    res.status(200);
  });
}

exports.getAllQuizzesOfUser = function (args, res, next) {
  /**
   * Gets all quizzes of a user.
   *
   * userId String The user identifier number
   * returns List
   **/
  Quiz.getUserQuizzes(args.userId.value, (err, quizzes) => {
    if (err) {
      return res.error(err);
    }
    res.json(quizzes, 200);
  })
}

exports.getHtml = function (req, res, next) {
  /**
   * Returns the landing page.
   *
   * no response value expected for this operation
   **/
   fs.readFile('web/index.html', 'utf8', (err, data) => {
     if (err) {
       return res.error({
         status: 500,
         message: 'File System Error',
         err: err
       });
     }
     // Replace Link Placeholder with rest of the url
     // this makes it possible to mantain querys
     data = data.replace(/{{link}}/g, req.url);
     res.statusCode = 200;
     res.end(data);
   });
}

exports.getQuestion = function (args, res, next) {
  /**
   * Gets basic information about a question.
   *
   * questionId String The question identifier number
   * returns Question
   **/
  Question.getQuestion(args.questionId.value, (err, question) => {
    if (err) {
      return res.error(err);
    }
    var out = JSON.parse(JSON.stringify(question));
    var newAnswers = [];
    var indexes = [];
    while (indexes.length !== 4) {
      var rand = Math.floor(Math.random() * 4);
      if (indexes.indexOf(rand) === -1) {
        indexes.push(rand);
      }
    }
    indexes.forEach((index) => {
      newAnswers.push(out.answer[index]);
    })
    out.answer = newAnswers;
    res.json(out, 200);
  })
}

exports.getQuestionArray = function (args, res, next) {
  /**
   * Gets a array of `question` objects.
   *
   * size Integer Size of array (optional)
   * offset Integer Start index (optional)
   * returns List
   **/
  Question.getQuestions(args.offset.value, args.size.value, (err, questions) => {
    if (err) {
      return res.error(err);
    }
    res.json(questions, 200);
  });
}

exports.getQuiz = function (args, res, next) {
  /**
   * Gets basic information about a quiz.
   *
   * quizId String The quiz identifier number
   * returns Quiz
   **/
  Quiz.getQuiz(args.quizId.value, (err, quiz) => {
    if (err) {
      return res.error(err);
    }
    res.json(quiz, 200);
  });
}

exports.getQuizArray = function (args, res, next) {
  /**
   * Gets a array of `quiz` objects.
   *
   * size Integer Size of array (optional)
   * offset Integer Start index (optional)
   * returns List
   **/
  Quiz.getQuizArray(args.size.value, args.offset.value, (err, quizzes) => {
    if (err) {
      return res.error(err);
    }
    res.json(quizzes);
  });
}

exports.getUser = function (args, res, next) {
  /**
   * Gets basic information about an user.
   *
   * userId String The user identifier number
   * returns User
   **/
  User.getUser(args.userId.value, (err, user) => {
    if (err) {
      return res.error(err);
    }
    return res.json(user, 200);
  })
}

exports.getUserArray = function (args, res, next) {
  /**
   * Gets a array of `user` objects.
   *
   * size Integer Size of array (optional)
   * offset Integer Start index (optional)
   * returns List
   **/
  User.getUsers(args.size.value, args.offset.value, (err, users) => {
    if (err) {
      return res.error(err);
    }
    res.json(users, 200);
  })
}

exports.updateQuestion = function (args, res, next) {
  /**
   * Update a question.
   *
   * questionId String The question identifier number
   * question Question Updated question details (optional)
   * no response value expected for this operation
   **/
  Question.updateQuestionById(args.questionId.value, args.question.value, (err, status) => {
    if (err) {
      return res.error(err);
    }
    res.status(status);
  });
}

exports.updateQuiz = function (args, res, next) {
  /**
   * Update a quiz.
   *
   * quizId String The quiz identifier number
   * quiz Quiz Updated quiz details (optional)
   * no response value expected for this operation
   **/
  var quiz = args.quiz.value;
  quiz._id = args.quizId.value;
  Quiz.update(quiz, (err) => {
    if (err) {
      return res.error(err);
    }
    res.status(200);
  })
}

exports.updateUser = function (args, res, next) {
  /**
   * Update a user.
   *
   * userId String The user identifier number
   * user User Updated user details (optional)
   * no response value expected for this operation
   **/
  User.updateUser(args.userId.value, args.user.value, (err) => {
    if (err) {
      return res.error(err);
    }
    res.status(200);
  });
}

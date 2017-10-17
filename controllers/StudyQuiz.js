'use strict';

const StudyQuiz = require('./StudyQuizService');
const jwt = require('../jwt');
const url = require('url');

function auth (req, res, backend, userId, cb) {
  var urlParts = url.parse(req.url, true);
  var query = urlParts.query;
  jwt.verify(req.headers['study-key'] || query.api_key, (err, token) => {
    if (err) {
      return res.status(403);
    }
    if (backend) {
      if (!token.backend) {
        return res.status(403);
      }
    } else {
      if (token.backend) {
        return cb(token);
      }
      if (!token.userId) {
        return res.status(403);
      }
      if (userId === 'noneed') {
        return cb(token);
      }
      if (token.userId !== userId) {
        return res.status(403);
      }
    }
    cb(token);
  });
}

module.exports.createQuestion = function createQuestion (req, res, next) {
  auth(req, res, false, req.swagger.params.question.value.userId, () => {
    StudyQuiz.createQuestion(req.swagger.params, res, next);
  });
};

module.exports.createQuiz = function createQuiz (req, res, next) {
  auth(req, res, false, req.swagger.params.quiz.value.challenger, () => {
    StudyQuiz.createQuiz(req.swagger.params, res, next);
  });
};

module.exports.createUser = function createUser (req, res, next) {
  StudyQuiz.createUser(req.swagger.params, res, next);
};

module.exports.deleteQuestion = function deleteQuestion (req, res, next) {
  auth(req, res, true, undefined, () => {
    StudyQuiz.deleteQuestion(req.swagger.params, res, next);
  });
};

module.exports.deleteQuiz = function deleteQuiz (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.deleteQuiz(req.swagger.params, res, next);
  });
};

module.exports.deleteUser = function deleteUser (req, res, next) {
  auth(req, res, true, undefined, () => {
    StudyQuiz.deleteUser(req.swagger.params, res, next);
  });
};

module.exports.getAllQuizzesOfUser = function getAllQuizzesOfUser (req, res, next) {
  auth(req, res, false, req.swagger.params.userId.value, () => {
    StudyQuiz.getAllQuizzesOfUser(req.swagger.params, res, next);
  });
};

module.exports.getHtml = function getHtml (req, res, next) {
  StudyQuiz.getHtml(req, res, next);
};

module.exports.getQuestion = function getQuestion (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.getQuestion(req.swagger.params, res, next);
  });
};

module.exports.getQuestionArray = function getQuestionArray (req, res, next) {
  auth(req, res, true, 'noneed', () => {
    StudyQuiz.getQuestionArray(req.swagger.params, res, next);
  });
};

module.exports.getQuiz = function getQuiz (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.getQuiz(req.swagger.params, res, next);
  });
};

module.exports.getQuizArray = function getQuizArray (req, res, next) {
  auth(req, res, true, 'noneed', () => {
    StudyQuiz.getQuizArray(req.swagger.params, res, next);
  });
};

module.exports.getUser = function getUser (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.getUser(req.swagger.params, res, next);
  });
};

module.exports.getUserArray = function getUserArray (req, res, next) {
  auth(req, res, true, 'noneed', () => {
    StudyQuiz.getUserArray(req.swagger.params, res, next);
  });
};

module.exports.updateQuestion = function updateQuestion (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.updateQuestion(req.swagger.params, res, next);
  });
};

module.exports.updateQuiz = function updateQuiz (req, res, next) {
  auth(req, res, false, 'noneed', () => {
    StudyQuiz.updateQuiz(req.swagger.params, res, next);
  });
};

module.exports.updateUser = function updateUser (req, res, next) {
  auth(req, res, false, req.swagger.params.userId.value, () => {
    StudyQuiz.updateUser(req.swagger.params, res, next);
  });
};

'use strict';

var mongoose = require('../mongoDB');
var ObjectId = mongoose.Schema.Types.ObjectId;
var objectId = mongoose.Types.ObjectId;
var Schema = mongoose.Schema;
var Question = require('./Question.model');
var sentry = require('raven');

var quizSchema = new Schema({
  questions: [ObjectId],
  configuration: String,
  subject: String,
  faculty: String,
  quizUrl: String,
  challenger: ObjectId,
  opponent: ObjectId,
  challengerPoints: Number,
  opponentPoints: Number,
  update: { type: Date, default: Date.now }
});

var CronJob = require('cron').CronJob;
var job = new CronJob('12 13 7 * * *', function () {
  var date = new Date(Date.now() - 604800000);
  Quiz.remove({
    update: {
      $lt: date.getTime()
    }
  }, (err) => {
    if (err) {
      sentry.captureException(err);
    }
  });
});
job.start();

// bei create aximal 3 anfragen entgegennehmen
quizSchema.statics.create = function (quiz, cb) {
  var temp = new Quiz({
    challenger: objectId(quiz.challenger),
    faculty: quiz.faculty,
    subject: quiz.subject,
    configuration: quiz.configuration
  });
  Question.getRandomQuestions(quiz.faculty, quiz.subject, 4, (err, questions) => {
    if (err) {
      return cb(err);
    }
    temp.questions = questions;
    temp.save((err) => {
      if (err) {
        return cb(err)
      }
      temp.quizUrl = `https://studyquiz.if.haw-landshut.de/?id=${temp._id}`;
      temp.save((err) => {
        if (err) {
          return cb(err);
        }
        return cb(false, temp);
      })
    });
  });
}

quizSchema.statics.update = function (quiz, cb) {
  var questionIds = [];
  if (quiz.questions) {
    quiz.questions.forEach((question) => {
      questionIds.push(objectId(question));
    });
  }
  var updates = {};
  if (questionIds.length !== 0) {
    updates.questions = questionIds;
  }
  if (quiz.quizUrl) {
    updates.quizUrl = quiz.quizUrl;
  }
  if (quiz.opponent) {
    updates.opponent = objectId(quiz.opponent);
  }
  if (quiz.challengerPoints) {
    updates.challengerPoints = quiz.challengerPoints;
  }
  if (quiz.opponentPoints) {
    updates.opponentPoints = quiz.opponentPoints;
  }
  updates.update = Date.now();

  Quiz.getQuiz(quiz._id, (err, old) => {
    if (err) {
      return cb(err);
    }
    if (updates.opponent && old.opponent) {
      return cb({
        status: 409,
        message: 'Opponent allready set'
      });
    }
    Quiz.findByIdAndUpdate(quiz._id, { $set: updates }, (err) => {
      if (err) return cb(err);
      cb();
    })
  });
}

quizSchema.statics.deleteQuiz = function (_id, cb) {
  Quiz.findById(_id, (err, quiz) => {
    if (err) {
      return cb(err);
    }
    if (!quiz) {
      return cb({
        status: 404,
        message: 'Quiz not found'
      });
    }
    quiz.remove((err) => {
      if (err) {
        return cb(err);
      }
      cb();
    })
  });
}

quizSchema.statics.getQuizArray = function (size, offset, cb) {
  var query = Quiz.find();
  query = query.sort({ update: -1 });
  if (offset) {
    query = query.skip(offset);
  }
  if (size) {
    query = query.limit(size);
  }
  query.exec((err, questions) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    cb(undefined, questions);
  });
}

quizSchema.statics.getUserQuizzes = function (userId, cb) {
  var query = Quiz.find({
    $or: [
      {
        challenger: objectId(userId)
      },
      {
        opponent: objectId(userId)
      }
    ]
  }).sort({ update: -1 });
  query.exec((err, quizzes) => {
    if (err) {
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    cb(undefined, quizzes);
  });
}

quizSchema.statics.getQuiz = function (id, cb) {
  Quiz.findById(id, (err, quiz) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    if (!quiz) {
      return cb({
        status: 404,
        message: 'Not found on Database'
      });
    }
    cb(undefined, quiz);
  });
}

var Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;

// TESTS
/*
quizModel.create({
  challenger: '58f89c7a2fbd2508ac4c7028',
  faculty: 'Buggy',
  subject: 'Eat Human'
}, (err, quiz) => {
  if (err) {
    return console.error(err);
  }
  console.log(quiz);

  quizModel.update({
    _id: quiz._id,
    questions          : ['58f89c7a2fbd2508ac4c7028','58f89c7a2fbd2508ac4c7028','58f89c7a2fbd2508ac4c7028'],
    quizUrl            : 'Baby dont hurt me',
    opponent           : '58f89c7a2fbd2508ac4c7028',
    challengerPoints   : 20,
    opponentPoints     : 30
  }, (err, quiz) => {
    if (err) {
      return console.error(err);
    }
    console.log(quiz);
    quizModel.deleteQuiz(quiz._id, (err) => {
      if (err) return console.error(err);
      console.log('Removed von db');
    });
  });
});
*/

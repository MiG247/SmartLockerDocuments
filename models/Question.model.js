'use strict';

const mongoose = require('../mongoDB');
const sentry = require('raven');
const ObjectId = mongoose.Schema.Types.ObjectId;
const objectId = mongoose.Types.ObjectId;

const MAX_RATEING = process.env.MAX_RATEING || 10;
const MIN_RATEING = process.env.MIN_RATEING || -10;

var questionSchema = new mongoose.Schema({
  question: String,
  answer: [{
    text: String,
    right: Boolean
  }],
  userId: ObjectId,
  category: String,
  faculty: String,
  subject: String,
  rating: { type: Number, default: 0, min: MIN_RATEING, max: MAX_RATEING }
});

function rf (model, field) {
  if (!model[field]) {
    return {
      status: 400,
      message: `Wrong ${field} field`
    }
  }
  return undefined;
}

questionSchema.statics.createQuestion = function (question, cb) {
  var error = rf(question, 'question') || rf(question, 'answer') || rf(question, 'category') ||
              rf(question, 'faculty') || rf(question, 'subject');
  if (error) {
    return cb(error);
  }
  if (!question.answer.find) {
    return cb({
      status: 400,
      message: 'answer field should be an Array'
    });
  }
  var answer = question.answer.find((ans) => ans.right);
  if (!answer) {
    return cb({
      status: 400,
      message: 'answers should contain right answer'
    });
  }

  var quest = new Question({
    question: question.question,
    answer: question.answer,
    userId: objectId(question.userId),
    category: question.category,
    faculty: question.faculty,
    subject: question.subject
  });
  quest.save(function (err) {
    if (err) return cb(err);
    cb(false, quest);
  });
}

questionSchema.statics.getRandomQuestions = function (faculty, subject, count, cb) {
  Question.find({
    faculty: faculty,
    subject: subject
  }, (err, questions) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    if (questions.length < count) {
      return cb({
        status: 404,
        message: 'Not enough Questions for this category'
      });
    }
    var out = [];
    while (out.length !== count) {
      var randomQuestion = questions[parseInt(Math.random() * questions.length)];
      if (out.indexOf(randomQuestion._id) === -1) {
        out.push(randomQuestion._id);
      }
    }
    cb(undefined, out);
  });
}

questionSchema.statics.updateQuestionById = function (id, question, cb) {
  Question.getQuestion(id, (err, quest) => {
    if (err) {
      return cb(err);
    }
    var update = {};
    if (question.question) {
      update.question = question.question;
    }
    if (question.answer) {
      update.answer = question.answer;
    }
    if (question.category) {
      update.category = question.category;
    }
    if (question.faculty) {
      update.faculty = question.faculty;
    }
    if (question.subject) {
      update.subject = question.subject;
    }
    if (question.rating) {
      update.$inc = {
        rating: question.rating
      };
    }
    quest.update(update, (err) => {
      if (err) {
        sentry.captureException(err);
        return cb({
          status: 500,
          message: 'Error on Database'
        });
      }
      if (quest.rating <= MIN_RATEING) {
        quest.remove();
        return cb(undefined, 204);
      }
      cb(undefined, 200);
    })
  });
}

questionSchema.statics.deleteQuestion = function (id, cb) {
  Question.findById(id, (err, quest) => {
    if (err) {
      return cb(err);
    }
    if (!quest) {
      return cb({
        status: 404,
        message: 'Question not found on Database'
      })
    }
    quest.remove((err) => {
      if (err) {
        return cb(err)
      }
      cb();
    })
  });
}

questionSchema.statics.getQuestion = function (id, cb) {
  Question.findById(id, (err, question) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    if (!question) {
      return cb({
        status: 404,
        message: 'Question not found on Database'
      })
    }
    cb(undefined, question);
  })
}

questionSchema.statics.getQuestions = function (offset, size, cb) {
  var query = Question.find();
  if (offset) {
    query.skip(offset);
  }
  if (size) {
    query.limit(size);
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

var Question = mongoose.model('Question', questionSchema);
module.exports = Question;

// Update Question:
// Question.updateQuestionById('58f783929a8ad13613d2933xxx', {question: 'Ist Andi Schwul?'}, console.log);

// Delete Question:
// Question.deleteQuestion('58ecce2c319ba8358b52830f', console.log);

/*
Find Question:
Question.findById('58f783689e9b4135f7e93326', console.log);
*/
// Create Questions:
/*
Question.createQuestion({
  question: 'Geben Sie an, welchen Wert folgender Ausdruck hat: 4 + 3.0 * 2',
  answer: [{text: '10', right: false}, {text: '10.0', right: true},{text: '14', right: false},{text: '10,0', right: false}],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Programmieren 1'
}, console.log);

Question.createQuestion({
  question: 'Geben Sie an, welchen Wert folgender Ausdruck hat: 4 + 5 % 2',
  answer: [{text: '5', right: true}, {text: '6', right: false}, {text: '6,5', right: false},{text: '4', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Programmieren 1'
}, console.log);
Question.createQuestion({
  question: 'Was wird von folgendem Programmfragment ausgegeben: \nint x=5; \nprintf("%d“, x++);\nprintf("%d“, ++x);',
  answer: [{text: '5\n7', right: true}, {text: '6\n7', right: false}, {text: '5\n5', right: false}, {text: '7\n7', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Programmieren 1'
}, console.log);
Question.createQuestion({
  question: 'Welches der folgenenden Prinzipien liegt den objektorientierten Sprachen zugrunde?',
  answer: [{text: 'Vererbung', right: true}, {text: 'Programm = Abfolge von Befehlen', right: false},{text: 'asieren auf dem sog. Lambda-Kalkül, z. B. λx.x', right: false},{text: 'Programmierung via Axiome und Inferenz', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Programmieren 1'
}, console.log);
Question.createQuestion({
  question: 'Was ist eine Phase der klassischen Software Entwicklung ?',
  answer: [{text: 'Planung', right: false}, {text: 'Implementierung', right: true}, {text: 'Sourcing', right: false}, {text: 'Management', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Software Engineering 1'
}, console.log);
Question.createQuestion({
  question: 'Welches Vorgehensmodell gibt es nicht ?',
  answer: [{text: 'V - Modell XT', right: false}, {text: 'Extreme programming', right: false}, {text: 'Wasserfallmodell', right: false}, {text: 'Low programming', right: true} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Software Engineering 1'
}, console.log);
Question.createQuestion({
  question: 'Was ist kein messbares Qualitätsmerkmal von SW ?',
  answer: [{text: 'Erweiterte Features', right: true}, {text: 'korrekte und zuverlässige Arbeitsweise', right: false}, {text: 'Robuste Reaktion auf Fehlereingaben', right: false}, {text: 'Ergonomische Benutzeroberfläche', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Software Engineering 1'
}, console.log);
Question.createQuestion({
  question: 'Was ist keine Aktivität des XP ?',
  answer: [{text: 'Codierung', right: false}, {text: 'Managen', right: true}, {text: 'Testen', right: false}, {text: 'Design', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Software Engineering 1'
}, console.log);
Question.createQuestion({
  question: 'Wofür steht die abkürzung NEA ?',
  answer: [{text: 'Nicht deterministischer endlicher Automat', right: true}, {text: 'deterministischer endlicher Automat', right: false}, {text: 'Nicht deterministischer Automat', right: false}, {text: 'Endlicher Automat', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Theories of Informatics'
}, console.log);
Question.createQuestion({
  question: 'Welche Sprachklasse gibt es in der Chomsky Hierarchie nicht ?',
  answer: [{text: 'Typ 4', right: true}, {text: 'Typ 0', right: false}, {text: 'DKF', right: false}, {text: 'Typ 2', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Theories of Informatics'
}, console.log);
Question.createQuestion({
  question: 'Welche Art von endlichen Automaten gibt es nicht?',
  answer: [{text: 'icht deterministischer endlicher Automat (NEA)', right: false}, {text: 'Deterministische Endliche Automaten (DEA)', right: false}, {text: 'Endliche Automaten mit Ausgabe (Moore)', right: false}, {text: 'Endliche Automaten mit Gruppen (EAG)', right: true} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Theories of Informatics'
}, console.log);
Question.createQuestion({
  question: 'Wofür steht folgender regulärer Ausdruck: rs',
  answer: [{text: 'entweder r oder s', right: false}, {text: 'wiederholt von rs', right: false}, {text: 'beide hintereinander', right: true}, {text: 'entweder s oder r', right: false} ],
  category: 'text',
  faculty: 'Informatics',
  subject: 'Theories of Informatics'
}, console.log);
*/

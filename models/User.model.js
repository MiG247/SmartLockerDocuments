'use strict';
// Schema and Models for User
var mongoose = require('../mongoDB');
var Schema = mongoose.Schema;
var objectId = mongoose.Types.ObjectId;
var sentry = require('raven');

var userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    dropDups: true
  },
  won: Number,
  lost: Number,
  token: {
    type: String,
    unique: true,
    dropDups: true
  }
});

// mongodb create function
userSchema.statics.createUser = function (user, cb) {
  var temp = new User({
    username: user.username,
    token: user.token
  });
  temp.save(function (err) {
    // throws code 11000 if name or token allready exists
    if (err && err.code === 11000) {
      return cb({
        status: 400,
        message: 'Database Error Username exists allready'
      });
    }

    if (err) {
      return cb({
        status: 500,
        message: 'Database Error on Save'
      });
    }

    cb(false, temp);
  });
}

// mongodb remove function
userSchema.statics.deleteUser = function (userId, cb) {
  try {
    userId = objectId(userId);
  } catch (err) {
    return cb({
      status: 400,
      message: 'UserId is no valid id'
    });
  }
  User.remove({
    _id: userId
  }, function (err) {
    if (err) {
      return cb({
        status: 500,
        message: 'Database Error on Remove'
      });
    }
    cb();
  });
}

// mongodb update function
userSchema.statics.updateUser = function (userid, user, cb) {
  var update = {};
  if (user.username) {
    update.username = user.username;
  }
  if (user.lost) {
    update.lost = user.lost;
  }
  if (user.won) {
    update.won = user.won;
  }
  if (user.token) {
    update.token = user.token;
  }
  try {
    userid = objectId(userid);
  } catch (err) {
    return cb({
      status: 400,
      message: 'UserId is no valid id'
    });
  }
  User.findOneAndUpdate({ _id: userid }, update, function (err, user) {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    if (!user) {
      return cb({
        status: 404,
        message: 'User not found on Database'
      });
    }
    cb();
  });
}

userSchema.statics.getUser = function (userId, cb) {
  User.findById(userId, (err, user) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    if (!user) {
      return cb({
        status: 404,
        message: 'Not found on Database'
      });
    }
    cb(undefined, user);
  });
}

userSchema.statics.getUsers = function (size, offset, cb) {
  var query = User.find();
  if (offset) {
    query.skip(offset);
  }
  if (size) {
    query.limit(size);
  }
  query.exec((err, users) => {
    if (err) {
      sentry.captureException(err);
      return cb({
        status: 500,
        message: 'Error on Database'
      });
    }
    cb(undefined, users);
  });
};

var User = mongoose.model('User', userSchema);
module.exports = User;

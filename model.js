var db = require('mongodb').Db;
var dbServer = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var projection = {fields: {'happybonus': 1, 'person': 1}};

var database = new db('sag-shops', new dbServer('localhost', 27017), {safe: false});
database.open (function (error, db) {
    if (error) { throw error; }
    collection = db.collection('users_happy');
});

exports.getUsers = function (pattern, callback) {
    pattern = pattern.toLowerCase().replace(/\s+/, '|');
    pattern = new RegExp(pattern);
    var query = {'person': {$exists: 1}, 'happybonus': {$exists: 1}, 'meta': pattern};
    collection.find(query, projection).toArray(callback);
};
exports.getUser = function (id, callback) {
    var query = {'person': {$exists: 1}, 'happybonus': {$exists: 1}, '_id': ObjectID(id)};
    collection.findOne(query, projection, callback);
};
exports.editUser = function (id, points, callback) {
    var query = {'_id': ObjectID(id)};
    collection.update(query, {$set: {'happybonus.points': parseInt(points)}}, callback);
};
exports.transfer = function (ids, points, callback) {
    var convertPoints = function (points) {
        if (isNaN(parseInt(points))) { return 0 };
        return parseInt(points);
    };

    points = convertPoints(points);

    var query = {'_id': ObjectID(ids[0])};
    collection.findOne(query, projection, function (error, doc) {
        var diff = convertPoints(doc['happybonus']['points']) - points;

        if (diff < 0) { callback('User has not enough points', 'done'); }
        else {
            collection.update(query, {$set: {'happybonus.points': diff}}, function (error, result) {
                query = {'_id': ObjectID(ids[1])};

                collection.findOne(query, projection, function(error, doc) {
                    var sum = convertPoints(doc['happybonus']['points']) + points;
                    collection.update(query, {$set: {'happybonus.points': sum}}, callback);
                });
            });
        }
    });
};

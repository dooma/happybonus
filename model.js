var db = require('mongodb').Db;
var dbServer = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var projection = {fields: {'happybonus': 1, 'person': 1}};

var database = new db('sag-shops', new dbServer('localhost', 27017), {safe: false});
database.open (function (error, db) {
    if (error) { throw error; }
    collection = db.collection('users_happy');
});

module.exports = {
    getUsers: function (pattern, callback) {
        pattern = pattern.toLowerCase().replace(/\s+/, '|');
        pattern = new RegExp(pattern, 'i');
        var query = {'person': {$exists: 1}, 'happybonus': {$exists: 1}, 'meta': pattern};
        collection.find(query, projection).toArray(callback);
    },
    getUser: function (pattern, callback) {
        var query = {'person': {$exists: 1}, 'happybonus': {$exists: 1}, '_id': ObjectID(pattern)};
        collection.findOne(query, projection, callback);
    },
    editUser: function (pattern, points, callback) {
        var query = {'person': {$exists: 1}, 'happybonus': {$exists: 1}, '_id': ObjectID(pattern)};
        collection.update(query, {$set: {'happybonus.points': parseInt(points)}})//, callback)
    }
}

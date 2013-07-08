var http = require('http');
var db = require('mongodb').Db;
var dbServer = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var projection = {fields: {'happybonus': 1, 'person': 1}};
var url = require('url');
var Functions = require('./functions.js');

var database = new db('sag-shops', new dbServer('localhost', 27017), {safe: false});
database.open (function (error, db) {
    if (error) { throw error; }
    collection = db.collection('users_happy');
});

var server = http.createServer(function (request, response) {
    response.writeHeader(200, {'Content-type': 'text/html'});
    var urlParsed = url.parse(request.url, true);
    if (urlParsed.pathname === '/' || urlParsed.pathname === '/index') {
    collection.find({}, projection).toArray(function (error, docs) {
        if (error) { throw error; }
        response.end(Functions.index(Functions.sortData(docs)));
    });
    } else if (urlParsed.pathname === '/show') {
        if (typeof(urlParsed.query) == 'object' && urlParsed.query !== null) {

            collection.findOne({_id: ObjectID(urlParsed.query['id'])}, projection, function (error, data) {
              if (error) { throw error; }
              response.end(Functions.show(data));
            });

    } else response.end('Sorry, you should pass an id!');
    } else if (urlParsed.pathname === '/remove') {
        if (typeof(urlParsed.query) === 'object' && urlParsed.query !== null) {

            collection.remove({_id: ObjectID(urlParsed.query['id'])}, function (error, doc) {
                if (error) { throw error; }
                response.end('Removed successfully');
            });

        }
    } else if (urlParsed.pathname === '/transfer') {
        collection.find({}, projection).toArray(function (error, docs) {
          response.end(Functions.transfer(docs));
        });
    }

    request.on('data', function (chunk) {
        var data = Functions.convertToObject(chunk.toString());

        if (urlParsed.pathname === '/edit') {
            if (typeof(urlParsed.query) == 'object' && urlParsed.query !== null) {

            collection.update({_id: ObjectID(urlParsed.query['id'])},
              {$set: {'happybonus.points': parseInt(data['points'])}},
              function (error, doc) {
                if (error) { throw error; }
                response.end('Updated successfully');
              });

            } else { response.end('Sorry, you could not edit this user!'); }
        } else if (urlParsed.pathname === '/transfer') {

          collection.findOne({_id: ObjectID(data['id'])}, projection, function (error, doc) {
            var difference = doc['happybonus']['points'] - parseInt(data['points'] || 0);
            if (difference >= 0) {

              collection.update({_id: doc['_id']}, {$set:{'happybonus.points': difference}}, function (error) {
                if (error) { throw error; }

                collection.findOne({_id: ObjectID(data['secondId'])}, projection, function (error, doc2) {
                  var sum = parseInt(doc2['happybonus']['points']) + parseInt(data['points'] || 0);

                  collection.update({_id: doc2['_id']}, {$set: {'happybonus.points': sum}}, function (error) {
                    if (error) { throw error; }
                    response.end('Transfered ' + data['points'] + ' points successfully to ' +
                      doc2['person']['fname'] + ' ' + doc2['person']['lname']);
                  });
                });
                response.write('Transfered ' + data['points'] + ' points successfully from ' +
                  doc['person']['fname'] + ' ' + doc['person']['lname'] + '<br>');
                });
            } else { response.end('User has not enough points'); }
          });
        }
    });
}).listen(8000);

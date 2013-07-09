var http = require('http');
var nodeStatic = require('node-static');
var url = require('url');
var Functions = require('./functions.js');
var pages = new nodeStatic.Server('./public');
var model = require('./model.js');

var server = http.createServer(function (request, response) {
    var urlParsed = url.parse(request.url, true);
    if (urlParsed.pathname === '/users') {
        response.writeHead(200, { 'Content-type': 'text/plain' });
        model.getUsers(urlParsed.query.query, function (error, data) {
            response.end(JSON.stringify(data));
        });
    } else if (urlParsed.pathname === '/user') {
        response.writeHead(200, { 'Content-type': 'text/plain' });
        model.getUser(urlParsed.query.id, function(error, data) {
            response.end(JSON.stringify(data));
        });
    } else pages.serve(request, response);

    request.on('data', function (chunk) {
        var data = Functions.convertToObject(chunk.toString());

        if (urlParsed.pathname === '/edit') {
            model.editUser(data.id, data.points, function (error, data) {
                response.writeHead(200, { 'Content-type': 'text/plain' });
                response.end('done');
            });
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

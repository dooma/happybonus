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
            model.transfer([data.firstId, data.secondId], data.points, function (error, data) {
                response.writeHead(200, { 'Content-type': 'text/plain' });
                response.end('done');
            });
        }
    });
}).listen(8000);

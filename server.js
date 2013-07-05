var http = require('http');
var db = require('mongodb').Db;
var dbServer = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var projection = {fields: {'happybonus': 1, 'person': 1}};
var url = require('url');

var database = new db('sag-shops', new dbServer('localhost', 27017), {safe: false});
database.open(function(error, db){
  if(error) throw error;
  collection = db.collection('users_happy');
});

var convertToObject = function(string){
  var object = new Object();
  if(typeof(string) !== 'string') return {};

  string = string.split('&');
  for(var i = 0; i < string.length; ++i){
    string[i] = string[i].split('=');
    object[string[i][0]] = string[i][1].split('+').join(' ');
  }
  return object;
}

var server = http.createServer(function(request, response){
  response.writeHeader(200, {'Content-type': 'text/plain'});
  var urlParsed = url.parse(request.url, true);
  if(urlParsed.pathname === '/' || urlParsed.pathname === '/index'){
    collection.find({}, projection).toArray(function(error, docs){
      if(error) throw error;
      for(var i = 0; i < docs.length; ++i)
        if(typeof(docs['happybonus']) === 'undefined' ||
          typeof(docs['person']) === 'undefined')
          docs.splice(i, 1);
      response.end(JSON.stringify(docs));
    });
  } else if(urlParsed.pathname === '/show'){
    if(typeof(urlParsed.query) == 'object' && urlParsed.query !== null){
      collection.findOne(
        {_id: ObjectID(urlParsed.query['id'])},
        projection,
        function(error, data){
          if(error) throw error;
          response.end(JSON.stringify(data));
        });
    } else response.end('Sorry, you should pass an id!');
  }
  request.on('data', function(chunk){
    var data = convertToObject(chunk.toString());
    if(urlParsed.pathname === '/edit'){
      if(typeof(urlParsed.query) == 'object' && urlParsed.query !== null){
        collection.update(
          {_id: ObjectID(urlParsed.query['id'])}, {$set:{'happybonus.points': parseInt(data['points'])}},
          function(error, doc){
            if(error) throw error;
            response.end('Updated successfully');
          });
      } else response.end('Sorry, you could not edit this user!');
    } else if(urlParsed.pathname === '/remove'){
    }
  });
}).listen(8000);

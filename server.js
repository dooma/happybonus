var http = require('http');
var db = require('mongodb').Db;
var dbServer = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;
var projection = {fields: {'happybonus': 1, 'person': 1}};
var url = require('url');
var jade = require('jade');

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

var readTemplate = function(){
  var fs = require('fs');
  var header = fs.readFileSync(__dirname + '/public/header.html');
  var footer = fs.readFileSync(__dirname + '/public/footer.html');
  return [header, footer]
}

var index = function(data){
  var template = readTemplate();
  var form = template[0] + '<a href="/transfer">Transfer points</a><ul>';
  for(var i = 0; i < data.length; ++i){
    form += '<li><a href="/show?id=' + data[i]['_id'] + '">'
      + data[i]['person']['fname'] + ' ' + data[i]['person']['lname'] +
      ' ' + (data[i]['happybonus']['points'] || 0) + '</a></li>';
  }
  form += '</ul>' + template[1];
  return form;
}

var sortData = function(docs){
  for(var i = 0; i < docs.length; ++i)
    if(typeof(docs[i]['happybonus']) === 'undefined' ||
      typeof(docs[i]['person']) === 'undefined'){
      docs.splice(i, 1);
      --i;
    }
  return docs;
}

var show = function(data){
  var template = readTemplate();
  var form = template[0] + data['person']['fname'] + ' ' + data['person']['lname']
    + '<form name="points" action="/edit?id=' + data['_id'] + '" method="POST">'
    + 'Points: <input type="text" name="points" placeholder="' + (data['happybonus']['points'] || 0) + '"> '
    + '<input type="submit" value="Change"></form>'
    + '<form name="remove" action="/remove?id=' + data['_id'] + '" method="GET">'
    + '<input type="submit" value="Remove"></form>'
    + template[1];
  return form;
}

var transfer = function(docs){
  var template = readTemplate();
  var form = template[0] + 'From: <select name="id" form="points">';
  var data = sortData(docs);
  for(var i = 0; i < data.length; ++i){
    form += '<option value="' + data[i]['_id'] + '">' + data[i]['person']['fname'] + ' ' +
      data[i]['person']['lname'] + ' ' + data[i]['happybonus']['points'] + '</option>';
  }
    form += '</select> to <select name="secondId" form="points">';
  for(var i = 0; i < data.length; ++i){
    form += '<option value="' + data[i]['_id'] + '">' + data[i]['person']['fname'] + ' ' +
      data[i]['person']['lname'] + ' ' + data[i]['happybonus']['points'] + '</option>';
  }
  form += '</select><form id="points" name="points" action="/transfer" method="POST">'
    + 'Points: <input type="text" name="points" placeholder="0"> '
    + '<input type="submit" value="Transfer"></form>'
    + template[1];
  return form;
}

var server = http.createServer(function(request, response){
  response.writeHeader(200, {'Content-type': 'text/html'});
  var urlParsed = url.parse(request.url, true);
  if(urlParsed.pathname === '/' || urlParsed.pathname === '/index'){
    collection.find({}, projection).toArray(function(error, docs){
      if(error) throw error;
      response.end(index(sortData(docs)));
    });
  } else if(urlParsed.pathname === '/show'){
    if(typeof(urlParsed.query) == 'object' && urlParsed.query !== null){
      collection.findOne(
        {_id: ObjectID(urlParsed.query['id'])},
        projection,
        function(error, data){
          if(error) throw error;
          response.end(show(data));
        });
    } else response.end('Sorry, you should pass an id!');
  } else if(urlParsed.pathname === '/remove'){
    if(typeof(urlParsed.query) === 'object' && urlParsed.query !== null){
      collection.remove({_id: ObjectID(urlParsed.query['id'])}, function(error, doc){
        if(error) throw error;
        response.end('Removed successfully');
      });
    }
  } else if(urlParsed.pathname === '/transfer'){
    collection.find({}, projection).toArray(function(error, docs){
      //console.log(transfer(docs));
      response.end(transfer(docs));
    });
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
    } else if(urlParsed.pathname === '/transfer'){
      collection.findOne(
        {_id: ObjectID(data['id'])}, projection, function(error, doc){
          var difference = doc['happybonus']['points'] - parseInt(data['points'] || 0);
          if(difference >= 0){
            collection.update({_id: doc['_id']},
              {$set:{'happybonus.points': difference}}, function(error){
                if(error) throw error;
                collection.findOne(
                  {_id: ObjectID(data['secondId'])},
                  projection, function(error, doc2){
                    var sum = parseInt(doc2['happybonus']['points']) + parseInt(data['points'] || 0);
                    collection.update({_id: doc2['_id']},
                      {$set:{'happybonus.points': sum}}, function(error){
                        if(error) throw error;
                        response.end('Transfered ' + data['points'] + ' points successfully to ' +
                          doc2['person']['fname'] + ' ' + doc2['person']['lname']);
                      });
                    });
                response.write('Transfered ' + data['points'] + ' points successfully from ' +
                  doc['person']['fname'] + ' ' + doc['person']['lname'] + '<br>');
              });
          } else {
            response.end('User has not enough points');
          }
        });
    }
  });
}).listen(8000);

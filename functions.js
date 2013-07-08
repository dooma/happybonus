exports.convertToObject = function (string) {
    var object = new Object();
    if (typeof(string) !== 'string') return {};

    string = string.split('&');
    for (var i = 0; i < string.length; ++i) {
        string[i] = string[i].split('=');
        object[string[i][0]] = string[i][1].split('+').join(' ');
    }
    return object;
};

exports.readTemplate = function () {
    var fs = require('fs');
    var header = fs.readFileSync(__dirname + '/public/header.html');
    var footer = fs.readFileSync(__dirname + '/public/footer.html');
    return [header, footer]
};

exports.index = function (data) {
    var template = this.readTemplate();
    var form = template[0] + '<a href="/transfer">Transfer points</a><ul>';
    for (var i = 0; i < data.length; ++i) {
        form += '<li><a href="/show?id=' + data[i]['_id'] + '">'
        + data[i]['person']['fname'] + ' ' + data[i]['person']['lname'] +
        ' ' + (data[i]['happybonus']['points'] || 0) + '</a></li>';
    }
    form += '</ul>' + template[1];
    return form;
};

exports.sortData = function (docs) {
    for (var i = 0; i < docs.length; ++i){
        if (typeof(docs[i]['happybonus']) === 'undefined' ||
            typeof(docs[i]['person']) === 'undefined') {
            docs.splice(i, 1);
            --i;
        }
    }
    return docs;
};

exports.show = function (data) {
    var template = this.readTemplate();
    var form = template[0] + data['person']['fname'] + ' ' + data['person']['lname']
    + '<form name="points" action="/edit?id=' + data['_id'] + '" method="POST">'
    + 'Points: <input type="text" name="points" placeholder="' + (data['happybonus']['points'] || 0) + '"> '
    + '<input type="submit" value="Change"></form>'
    + '<form name="remove" action="/remove?id=' + data['_id'] + '" method="GET">'
    + '<input type="submit" value="Remove"></form>'
    + template[1];
    return form;
};

exports.transfer = function (docs) {
    var template = this.readTemplate();
    var form = template[0] + 'From: <select name="id" form="points">';
    var data = this.sortData(docs);
    for (var i = 0; i < data.length; ++i) {
    form += '<option value="' + data[i]['_id'] + '">' + data[i]['person']['fname'] + ' ' +
        data[i]['person']['lname'] + ' ' + data[i]['happybonus']['points'] + '</option>';
    }
    form += '</select> to <select name="secondId" form="points">';
    for (var i = 0; i < data.length; ++i) {
    form += '<option value="' + data[i]['_id'] + '">' + data[i]['person']['fname'] + ' ' +
        data[i]['person']['lname'] + ' ' + data[i]['happybonus']['points'] + '</option>';
    }
    form += '</select><form id="points" name="points" action="/transfer" method="POST">'
    + 'Points: <input type="text" name="points" placeholder="0"> '
    + '<input type="submit" value="Transfer"></form>'
    + template[1];
    return form;
};

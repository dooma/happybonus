var hideContainers = function () {
    $('#changeContainer, #transferContainer').hide();
    $('.commit').hide();
    ids = [];
};

hideContainers();

$('#init #change').click(function () {
    hideContainers();
    $('#changeContainer').show();
});

$('#init #transfer').click(function () {
    hideContainers();
    $('#transferContainer').show();
});

var showChange = function (id) {
    $.get('/user', {id: id}, function (data) {
        ids = [data['_id']];
        $('#changeContainer input').val(data['person']['fname'] + ' ' + data['person']['lname']);
        $('#changeContainer .commit input').val(data['happybonus']['points'] || 0);
        $('#changeContainer .commit').show();
    });
};

$('.typeahead').typeahead({
    source: function (query, process) {
        $.get('/users', {query: query}, function (data) {
            ids = [];
            users = []
            for (var i = 0; i < data.length; ++i) {
                users.push(data[i]['person']['fname'] + ' ' + data[i]['person']['lname'] + ' ' + (data[i]['happybonus']['points'] || 0));
                ids.push(data[i]['_id']);
            }
            return process(users);
        });
    },
    updater: function (selection) {
        showChange(ids[users.indexOf(selection)]);
        ids = [];
    }
});

$('#changeContainer .commit button').click(function () {
    $.post('/edit', {points: $('#changeContainer .commit input').val(), id: ids[0] });
});

var setToFirstField = function (id) {
    $.get('/user', {id: id}, function (data) {
        ids[0] = data['_id'];
        $('#transferContainer #firstTypeahead').val(data['person']['fname'] + ' ' + data['person']['lname']);
        $('#transferContainer .commit input').val(data['happybonus']['points'] || 0);
    });
};

$('#firstTypeahead').typeahead({
    source: function (query, process) {
        $.get('/users', {query: query}, function (data) {
            ids = [];
            users = []
            for (var i = 0; i < data.length; ++i) {
                users.push(data[i]['person']['fname'] + ' ' + data[i]['person']['lname'] + ' ' + (data[i]['happybonus']['points'] || 0));
                ids.push(data[i]['_id']);
            }
            return process(users);
        });
    },
    updater: function(selection){
        setToFirstField(ids[users.indexOf(selection)]);
    }
});

$('#secondTypeahead').typeahead({
    source: function(query, process){
        $.get('/users', {query: query}, function (data) {
            ids = [];
            users = []
            for (var i = 0; i < data.length; ++i) {
                users.push(data[i]['person']['fname'] + ' ' + data[i]['person']['lname'] + ' ' + (data[i]['happybonus']['points'] || 0));
                ids.push(data[i]['_id']);
            }
            return process(users);
        });
    },
    updater: function(selection){
        setToSecondField(ids[users.indexOf(selection)]);
    }
});

var setToSecondField = function (id) {
    $.get('/user', {id: id}, function (data) {
        ids[1] = data['_id'];
        $('#transferContainer #secondTypeahead').val(data['person']['fname'] + ' ' + data['person']['lname']);
        $('#transferContainer .commit').show();
    });
};

$('#transferContainer .commit button').click(function () {
    $.post('/transfer', {points: $('#transferContainer .commit input').val(), firstId: ids[0], secondId: ids[1]});
});

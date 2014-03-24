'use strict';

var App = {};

App.init = function(){

    App.name = 'Flip.io';
    $('.title').text(App.name);

    App.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;

    if(window['Audio']){
        var audio = new Audio();
        var ext = '.wav';
        if(audio.canPlayType('audio/mp3')){
            ext = '.mp3';
        }
        App.sounds = {};

        var ding = new Audio();
        ding.src = './media/ding' + ext;
        ding.volume = 0.5;

        var sweep = new Audio();
        sweep.src = './media/sweep' + ext;
        sweep.volume = 0.3;

        App.sounds['sweep'] = sweep;
        App.sounds['ding'] = ding;
    }

    $('body').on('touchmove', function(e){

        if(e.target.style = 'clues'){

        } else {
            e.preventDefault();
        }
    });

    this.homeView = new App.HomeView();
    this.puzzleView = new App.PuzzleView();
    this.router = new App.Router();

    Backbone.history.start();

}

App.play = function(sound){
    if(App.sounds){
        var snd = App.sounds[sound];
        try{
            snd.pause();
            snd.currentTime = 0;
        } catch (err){}
        snd.play();

    }
}

App.addWin = function(puzNum){
    if(window['localStorage']){
        var wins = localStorage['wins'];
        if(!wins){
            wins = [];
        } else {
            wins = JSON.parse(wins);
        }
        wins.push(puzNum);
        localStorage['wins'] = JSON.stringify(wins);
    }
}

App.getWins = function(){
    if(window['localStorage']){
        var wins = localStorage['wins'];
        if(wins){
            wins = JSON.parse(wins);
        } else {
            wins = [];
        }
        return wins;
    } else {
        return [];
    }
}


App.Router = Backbone.Router.extend({

    currentView: null,

    routes: {
        '': 'showHome',
        ':number': 'showPuzzle',
    },

    clearCurrent: function(){
        if(this.currentView){
            this.currentView.$el.html('');
            this.currentView.remove();
        }
    },

    showHome: function() {

        $('.content').fadeOut(function(){

            App.router.clearCurrent();

            document.title = App.name;
             $('.titlenum').text('');

            App.homeView.render();

            $('.content').html(App.homeView.$el);

            App.router.currentView = App.homeView;

            $('.puznum').focus();

            $('.content').fadeIn();

        });


    },

    showPuzzle: function(puzNum) {

        $('.content').fadeOut(function(){

            App.router.clearCurrent();

            document.title = App.name + ' / Puzzle ' + puzNum;
             $('.titlenum').text('#' + puzNum);

            App.puzzleView.render(puzNum);

            $('.content').html(App.puzzleView.$el);

            App.router.currentView = App.puzzleView;

            $('.content').fadeIn();

       });

    }

});


App.HomeView = Backbone.View.extend({

    tagName: 'div',
    className: 'home',

    events: function() {

        var events;

        if(App.touch){
            events = {
                'keypress .puznum': 'checkField',
                'update .puznum': 'checkField',
                'submit .puz-form': 'loadPuzzle',
                'touchend .go-btn': 'loadPuzzle',
                'touchend .random-btn': 'randomPuzzle'
            }
        } else {
            events = {
                'keypress .puznum': 'checkField',
                'submit .puz-form': 'loadPuzzle',
                'click .go-btn': 'loadPuzzle',
                'click .random-btn': 'randomPuzzle'

            }
        }
        return events;
    },

    render: function() {

        this.delegateEvents();

        var tpl = $('.homeTemplate').text();
        var html = _.template(tpl, {});

        this.$el.html(html);

        $('.puznum').focus();

    },

    checkField: function(e){

        var keyCode = e.keyCode || e.charCode;

       //console.log(keyCode);

        if(keyCode == 13 || keyCode == 8 || keyCode == 46 || keyCode == 92 || keyCode == 39 || keyCode == 37){
            return true;
        }


        if(keyCode < 48 || keyCode > 57){
            return false;
        }

        var val = $('.puznum').val();

        if(val.length >= 3){
            return false;
        }


    },

    loadPuzzle: function(e){
        if(e){
            e.preventDefault();
        }

        var puzNum = parseInt($('.puznum').val());

        if(isNaN(puzNum) || puzNum < 1 || puzNum > 1000){

           $('.puznum').val('');

        } else {

            App.router.navigate(puzNum+'', {trigger: true});
        }

    },

    randomPuzzle: function(){

        var puzNum =  Math.floor( Math.random() * ( 1001) );

        $('.puznum').val(puzNum);

        // App.router.navigate(puzNum + "", {trigger: true});

    }


});


App.PuzzleView = Backbone.View.extend({

    tagName: 'div',
    className: 'puzzle',

    secs: 0,
    stop: false,
    intervalID: null,
    guessing: false,
    count: 0,
    total: 0,
    puzNum: 0,
    data: null,
    hinting: false,

    events: function(){

        var events;

        if(App.touch){
            events = {
                'touchend .shuffle' : 'doShuffle',
                'touchend .sort' : 'doSort',
                'touchend .hint' : 'doHint',
                'touchend .square' : 'doSquare',
                'touchend .reset': 'doReset',
                'touchend .restart': 'doRestart',
                'touchend .gohome': 'doHome',
                'touchend .next': 'doNext'
            }
        } else {
            events = {
                'click .shuffle' : 'doShuffle',
                'click .sort' : 'doSort',
                'click .hint' : 'doHint',
                'click .square' : 'doSquare',
                'click .reset': 'doReset',
                'click .restart': 'doRestart',
                'click .gohome': 'doHome',
                'click .next': 'doNext'
            }
        }
        return events;

    },

    render: function(puzNum) {

        this.delegateEvents();

        this.guessing = false;
        this.count = 0;

        this.puzNum = parseInt(puzNum);

        if(isNaN(puzNum) || puzNum < 1 || puzNum > 1000){
            App.router.navigate('', {trigger: true});
        }

        this.start = new Date();
        this.secs = 0;

        this.data = puzzles[puzNum];

        this.total = puzzles[puzNum]['clues'].length;

        var tpl = $('.puzzleTemplate').text();
        var html = _.template(tpl, this.data);

        this.$el.html(html);

        this.startTimer();


    },

    doHome: function(e){

        this.stopTimer();

        App.router.navigate('', {trigger: true});

    },

    doNext: function(e){
        App.router.navigate((App.puzzleView.puzNum +1)+'', {trigger: true});
    },

    doShuffle: function(e){
        App.puzzleView.redrawSquares('shuffle');
    },

    doSort: function(e){
        App.puzzleView.redrawSquares('sort');
    },

    redrawSquares: function(order){

        App.puzzleView.doReset();

        var squares = puzzles[App.puzzleView.puzNum]['squares'];

        if(order == 'sort'){
            squares.sort();
        } else {
            squares = shuffle(squares);
        }

        var hidden = [];
        $('.square:hidden').each(function(){
            hidden.push($(this).text());
        });
        hidden.sort();

        for(var i = 0; i < $('.square').length; i++){

            $('.square').eq(i).text(squares[i]);

            var h = hidden.indexOf(squares[i]);
            if(h !== -1){
                delete hidden[h];
                $('.square').eq(i).hide();
            } else {
                $('.square').eq(i).show();
            }

        }


    },

    doHint: function(e){

        if(this.hinting){
            return;
        }



        var active = [];

        $('.clues li').each(function(index){

            if($(this).data('answer') !== ''){
                active.push($(this));
            }

        });

        var rand = Math.floor(Math.random() * active.length);
        var $clue = active[rand];


        var answer = rot13($clue.data('answer'));

        var b = answer.substr(0,3);
        var view = this;

        $('.square').each(function(index){

            if($(this).data('guessed') !== 'true'){

                var s = $(this).text();
                var $square = $(this);

                if(b.indexOf(s) == 0){
                    view.hinting = true;
                    $clue.toggleClass('hint');
                    $square.toggleClass('hint');
                    setTimeout(function(){
                        $clue.toggleClass('hint');
                        $square.toggleClass('hint');
                        view.hinting = false;
                    }, 4000);
                    return false;
                }

            }

        });

    },

    doSquare: function(e){

      if(App.puzzleView.guessing == false){
            var sq = e.target;

            $(sq).data('guessed','true');

            $(sq).hide();

            var a = $('.answertext').text();

            a = a + $(sq).text();

            $('.answertext').html(a);

            if(a.length > 10){
                App.puzzleView.doReset(e);
            } else {
                App.puzzleView.doGuess(a);
            }
        }

    },

    doGuess: function(a){

        if(a == ''){
            return;
        }

        var $clues = $('.clues li');

        App.puzzleView.guessing = true;

        for(var i = 0; i < $clues.length; i++){

            var $clue = $clues.eq(i);

            var b = rot13($clue.data('answer'));

            if( a.toLowerCase() == b.toLowerCase()){

                App.play('ding');

                $clue.data('answer','');

                $('.answertext').fadeOut('fast',function(){
                    $('.answertext').html('');
                    $('.answertext').show();
                });

                $clue.find('.word').fadeOut(function(){
                    $(this).html(b).addClass('correct');
                    $(this).fadeIn();
                });

                $clue.find('.def').fadeOut(function(){
                    $(this).css({'text-decoration':'line-through','font-style':'italic'});
                    $(this).fadeIn();
                });

                $('.square').each(function(index){
                    $(this).data('guessed','');
                });

                App.puzzleView.count++;

                if(App.puzzleView.count == App.puzzleView.total){
                    App.puzzleView.doWin();
                    return;
                }

                break;

            }

        }

        App.puzzleView.guessing = false;


    },

    doWin: function(){

        App.puzzleView.stopTimer();

        App.addWin(App.puzzleView.puzNum);

        App.play('sweep');

        setTimeout(function() {

            $('.squares table').fadeOut();
            $('.hint').hide();
            $('.shuffle').hide();

            var tpl = $('.winTemplate').text();
            var html = _.template(tpl, {});

            $('.squares').html(html);

        }, 1000);

    },

    doRestart: function(e){

        App.puzzleView.secs = 0;

        App.puzzleView.render(App.puzzleView.puzNum);


    },

    doReset: function(e){

        $('.answertext').html('');
        //$('.answertext').css('color','');

        $('.square').each(function(index){

            if($(this).data('guessed') == 'true'){
                $(this).data('guessed','');
                $(this).fadeIn();
            }

        });
    },

    stopTimer: function(){
        clearInterval(App.puzzleView.intervalID);
        App.puzzleView.intervalID = null;
    },

    startTimer: function(){
        if(App.puzzleView.intervalID == null){
            App.puzzleView.intervalID = setInterval('App.puzzleView.timer()', 1000);
        }
    },

    timer: function(){
        App.puzzleView.secs = Math.floor(((new Date()) - App.puzzleView.start)/1000) ;

        $('.timer').text(formatTime(App.puzzleView.secs));
    }

});



// ----- misc functions

function formatTime(seconds){

    var hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    if (hours   < 10) {hours   = '0' + hours;}
    if (minutes < 10) {minutes = '0' + minutes;}
    if (seconds < 10) {seconds = '0' + seconds;}

    if(hours == '00'){
        hours = '';
    } else {
        hours = hours + ':';
    }

    return hours + minutes + ':' + seconds;

}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function(c) {
    return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
  });
}

function shuffle(arr) {
    for(var j, x, i = arr.length; i; j = parseInt(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
    return arr;
}




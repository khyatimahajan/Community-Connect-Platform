//console.log('hey you');

///TIME OUT
//setTimeout(function(){
  //console.log('3.5 seconds gone ');
//}, 3500);

////SET INTERVAL
//var time =0
//setInterval(function(){
//  time+=3
//  console.log(time + 'seconds have gone')
//}, 3000);


/////CLEAR INTERVAL
//var time =0
//var timer= setInterval(function(){
//  time+=3
//  console.log(time + ' seconds have gone');
//  if (time>10){
//    clearInterval(timer);
//  }
//}, 3000);


////TELLING THE DIRECTORY
//console.log(__dirname);

////TELLING THE FILENAME
//console.log(__filename);

//Normal Function statement
//function good_day(){
//  console.log('Good day');
//};

//good_day();

///function expression
//var say_bye = function(){
//  console.log(' bye bye ');
//};

//say_bye();
/////////
///// calling a function within a function
//function call_func(fun){
//  fun();
//};

///function expression
//var say_bye = function(){
//  console.log(' bye bye ');
//};

//say_bye();

//call_func(say_bye);

///Accessing a module in a dif JS FILE
//var counter = require('./count');

//console.log(counter(['a', 'b', 'c', 'd', 'e']));


///Accessing a module in a dif JS FILE
//var stuff = require('./stuff');

//console.log(stuff.counter(['a', 'b', 'c', 'd', 'e']));

//console.log(stuff.adder(a=10,b=20));

//console.log(stuff.pi);

//////////////
///EVENT EMITTER
/*
var events = require('events');
var util = require('util');

var person = function(name){
  this.name = name;
};

//var eventemitter = new events.EventEmitter();

util.inherits(person, events.EventEmitter);

var rahul = new person('rahul');
var ali = new person('ali');
var sayan = new person('sayan');

var people = [rahul,ali,sayan];

people.forEach(function(person){
  person.on('speak', function(message){
    console.log(person.name + ' said :' + message);
  });
});

rahul.emit('speak', 'it is chilly outside');
*/
////////loading a file
//var fs = require('fs');

////blocking i/o (blocks the code below it)
//var read = fs.readFileSync('trail.txt', 'utf8');
//console.log(read);

///nonblocking i/o (does not block the code)
//fs.readFile('trail.txt', 'utf8', function(err,data){
//  console.log(data);
//});

/////////writing a file

var fs = require('fs');
fs.readFile('trail.txt', 'utf8', function(err,data){
  fs.writeFile('trail_writeout.txt', data, function(err,data){
    if (err) console.log('error', err);
  });
});

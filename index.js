const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});


//-----------------------------------------------------
// You can POST to /api/users with form data username to create a new user.
// The returned response from POST /api/users with form data username will be an object with username and _id properties.
//-----------------------------------------------------

app.use(bodyParser.urlencoded({extended:true}));
// parse application/json
app.use(bodyParser.json());

let USERS = [];

app.post("/api/users", function (req, res) {
  // if username is neither empty or undefined
  if (req.body.username != "" && req.body.username != undefined){
    var id = uuidv4(); 
    var newUser = {username: req.body.username, _id: id};
    //order newUser by key
    const ordered = {};
    Object.keys(newUser).sort().forEach(function(key) {
      ordered[key] = newUser[key];
    });
    USERS.push(ordered);
    res.send(newUser);
  }
  // if username is empty or undefined
  else{
    res.send({error: "Username is required"});
  }
});


//-----------------------------------------------------
// You can make a GET request to /api/users to get a list of all users.
// The GET request to /api/users returns an array.
// Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.
//-----------------------------------------------------

app.get("/api/users", function (req, res) {
  res.send(USERS);
});


//-----------------------------------------------------
// You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
// The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.
// e.g. {"_id":"638919c03d266c0c1b38cf66","username":"mariamawit","date":"Thu Dec 01 2022","duration":12,"description":"run"}
// The description property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string.
// The duration property of any object in the log array that is returned from GET /api/users/:_id/logs should be a number.
// The date property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string. Use the dateString format of the Date API.
//-----------------------------------------------------
let LOGs = [];
app.post("/api/users/:_id/exercises", function (req, res) {
  // if neither description nor duration are neither empty or undefined
  if (req.body.description != "" && req.body.description != undefined && req.body.duration != "" && req.body.duration != undefined){
    var id = req.params["_id"];
    var searchInUser = USERS.filter((user) => Object.values(user).indexOf(id)>-1);
    // if id is correct
    if(searchInUser.length>0){
      //if date is not provided
      if(req.body.date == "" || req.body.date == undefined){
        req.body.date = new Date();
      }
      // if date is provided
      else{
        req.body.date = new Date(req.body.date);
        // if date provided is invalid
        if(req.body.date == "Invalid Date"){
          res.send({error: "Invalid date"});      
        }
      }
      var newFields = {
        date: req.body.date.toDateString(),
        duration: +req.body.duration,
        description: req.body.description        
      }
      
      // store exercise for user in logs
      // if LOGs has data 
      if(LOGs.length>0){
        var getIndexOfSearch = LOGs.map((item) => Object.values(item).indexOf(id)>-1);
        var searchInLog = getIndexOfSearch.indexOf(true);
        // if user already has an exercise logged
        if(searchInLog>-1){
          LOGs[searchInLog].log.push(newFields);
          LOGs[searchInLog].count += 1; 
        }
        // if user never stored an exercise
        else{
          logUser = {...searchInUser[0]};
          logUser["count"] = 1;
          logUser["log"] = [newFields];
          LOGs.push(logUser); 
        }
      }
      //if LOGs is empty
      else{
        logUser = {...searchInUser[0]};
        logUser["count"] = 1;
        logUser["log"] = [newFields];
        LOGs.push(logUser);   
      }
      console.log(LOGs)
      
      // return object with user info and exercise fields
      var exercice = {...searchInUser[0], ...newFields};
      // exercice["date"] = req.body.date.toDateString();
      // exercice["duration"] = +req.body.duration;
      // exercice["description"] = req.body.description;
      res.send(exercice);      
    }
    // if id is incorrect
    else{
      res.send({error: "Invalid id"});   
    }
  }
  // if Description and/or duration are empty or undefined
  else{
    res.send({error: "Description and duration are empty"});
  }
});


//-----------------------------------------------------
// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
// A request to a user's log GET /api/users/:_id/logs returns a user object with a count property representing the number of exercises that belong to that user.
// A GET request to /api/users/:_id/logs will return the user object with a log array of all the exercises added.
// Each item in the log array that is returned from GET /api/users/:_id/logs is an object that should have a description, duration, and date properties.
// You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
//-----------------------------------------------------
app.get("/api/users/:_id/logs", function (req, res) {
  console.log(req.query)
  // if LOGs is not empty
  if (LOGs.length>0) {
    var id = req.params["_id"];
    var searchInLOGs = LOGs.filter((item) => Object.values(item).indexOf(id)>-1);
    // if id is found
    if(searchInLOGs.length>0){
      var queryKeys = Object.keys(req.query);
      // if limit | to | from parameters are NOT added in path
      if(queryKeys.indexOf("to")<0 && queryKeys.indexOf("from")<0 && queryKeys.indexOf("limit")<0){
         res.send(searchInLOGs[0]);     
      }
      // if limit | to | from parameters are added 
      else{
        // if either from or to are added but not both
        var queryResult = {...searchInLOGs[0]};
        if( ( queryKeys.indexOf("from") * queryKeys.indexOf("to") ) < 0){
           res.send({error: "Either from or to are provided but not both id"});             
        }
        // if both from and to are added
        if( queryKeys.indexOf("from")>-1 && queryKeys.indexOf("to")>-1){
          var from = new Date(req.query.from.replace("-", "/"));
          var to = new Date(req.query.to.replace("-", "/"));
          // if from and date are NOT valid date strings
          if( from == "Invalid Date" || to == "Invalid Date"){
            res.send({error: "Either from or to are not correct date strings"});                        
          }
          // if from and date are valid date strings
          else{
            from = from.getTime();
            to = to.getTime();
            var logs = searchInLOGs[0].log
            datesInLog = logs.map((item) => new Date(item.date).getTime());
            filterDates = datesInLog.map((date) => date>=from && date<=to)
            // if no date found between from and to
            if(filterDates.indexOf(true)<0){
              res.send({error: "No exercise is found"});                      
            }
            // if date is found
            else{
              filteredLogs = logs.filter((item, idx) => filterDates[idx]);
              queryResult.log = filteredLogs;
            }
          }
        }
        // if limit is added
        if(queryKeys.indexOf("limit")>-1){
          var limit = +req.query.limit;
          queryResult.count = limit;
          queryResult.log = queryResult.log.slice(0,limit);
          console.log("i am here")
        }
        res.send(queryResult);
      }
    }
    // if id is not found
    else{
      res.send({error: "Invalid id"});        
    }   
  }
  // if LOGs is empty
  else{
    res.send({error: "Logs is empty"});
  }
});

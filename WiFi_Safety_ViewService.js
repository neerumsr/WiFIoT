// Wrapper to upload heartbeat and Respirator 

"use strict";

var huejay = require('huejay');
var client;

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const readline = require('readline');

const fileName='results.txt';

// This is test comment
const temp='Hello world';
//AMchange

//Bridge one is my Home bridge 
const bridgeHome = '001788FFFE10763A';

// Office bridge
const bridgeCSDK = '001788FFFE1224C4';

const interval=3000;
var ipAddress;
var preValue=0;

// Twilio account setup for SMS notifications
var accountSid = 'AC56131d27f1b72ef860b4378c1d3909f3'; // Your Account SID from www.twilio.com/console
var authToken = '3e01bd0d6d037efcb023cfaecd3b80d1';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var twclient = new twilio.RestClient(accountSid, authToken);



var Value = class Value{
  constructor(value){
    this.value=value;
  }
}

var Datapoint = class Datapoint {
    constructor(dataChnId, value) {
      this.dataChnId = dataChnId;
      this.values=value;
    }
  }

var Datapoints = class Datapoints{
  constructor(datapoints){
    this.datapoints=[];
    this.datapoints=datapoints;
  }
}  

// Hue discovery 

huejay.discover()
  .then(bridges => {
    for (var bridge of bridges) {
      console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
      if(bridge.id !== bridgeHome){
        continue;
      }
      console.log(`Iterating....`);

      ipAddress = bridge.ip;

          client = new huejay.Client({
          host:     ipAddress, // '10.194.183.188',
          port:     80,               // Optional
          username: '0THIoKqAlHZaphUvyMVFvY5B6343EQ2MzAGsGQXd', // Optional
          //timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
        });
        
    // alterLightProps(client,1);
    }
  })
  .catch(error => {
    console.log(`An error occurred: ${error.message}`);
  });

function readFirstLine(){
  const datapoints=[];
  //Reading firstline of file
  const rl = readline.createInterface({input: fs.createReadStream(fileName)});
  var index=0;
  rl.on('line', (line) => {
      if(index===0){
        index++;
        const lineSplit = line.split(';');
        for(var i=0;i<lineSplit.length;i++){
          var data = lineSplit[i].split(',');
          if(data.length){
            datapoints[i] = new Datapoint(data[0],new Value(data[1]));
            console.log(`Values are ${data[0]}, ${data[1]}`);
            if (preValue!= data[1] && (i==0)) {
              preValue = data[1];
              if (0 == preValue) {
                  alterLightProps(client,1,0); 
              } else {
                  alterLightProps(client,1,(Math.floor(Math.random()*(65000-1)+1))); 
                  sendSmsToOwner();
              }
            }
          }
        } 
        postData(new Datapoints(datapoints)); 
      }else{
        console.log('other lines');
        rl.close;
      }
  });
}


setInterval(function(){
  readFirstLine();
}, interval); 

var options = {
  host: 'api.mediatek.com',
  port: 443,
  method: 'POST',
  path: '/mcs/v2/devices/D5SG07kF/datapoints',
  headers: {
    'Content-Type': 'application/json',
    'deviceKey': 'fz2jnNhGKWHtvf0z'
  }
};

function postData(data){
  // request object
  var req = https.request(options, function (res) {
  var result = '';
  res.on('data', function (chunk) {
    result += chunk;
  });
  res.on('end', function () {
    console.log(result);
  });
  res.on('error', function (err) {
    console.log(err);
  })
});
 
// req error
req.on('error', function (err) {
  console.log(err);
});
 
//send request witht the postData 
console.log(JSON.stringify(data));
req.write(JSON.stringify(data));
req.end();
}

// Alter light values.
function alterLightProps(client,id,hue) {
  client.lights.getById(id)
  .then(light => {
    light.name = 'Living Room';

    light.brightness = 200;
    light.hue        = hue;
    light.saturation = 254;
    light.on = hue; //true;
    return client.lights.save(light);
  })
  .then(light => {
    console.log(`Updated light [${light.id}] with hue : ${hue} `);
  })
  .catch(error => {
    console.log('Something went wrong');
    console.log(error.stack);
  });
}

// Send SMS using Twilio service

function sendSmsToOwner(){
  twclient.messages.create({
    body: 'Motion detected while armed in your home',
    to: '+16504215228',  // Text this number
    from: '+16122605203' // From a valid Twilio number
  }, function(err, message) {
    if(err) {
        console.log(err.message);
    }
    if(message) {
            console.log(message.sid);
    }
  });
}

// Get requirements
var request = require("request");
var async = require('async');

/**
 * GET /visualizer
 * Visualizer index
 */

// Visualize the initial visualizer page with default config
exports.viewChart = (req, res) => {
	if (!req.user) {
    return res.redirect('/');
  }
  res.render('visualizer', {
    title: 'Visualizer',
    // Provide initial config
    config: "{ type: \'line\', data: { labels: [\"10%\", \"20%\", \"30%\", \"40%\", \"50%\", \"60%\", \"70%\", \"80%\", \"90%\", \"100%\"], datasets: [] }, options: { fontColor:\"#fff\", responsive: true, title:{ display:true, text:\'AppDynamics Visualizer\' }, tooltips: { mode: \'label\', callbacks: { } }, hover: { mode: \'dataset\' }, scales: { xAxes: [{ display: true, scaleLabel: { display: true, labelString: \'Percentage of time elapsed of time interval\' } }], yAxes: [{ display: true, scaleLabel: { display: true, labelString: \'Traffic\' }, ticks: { suggestedMin: 0, suggestedMax: 100, }}]}}}"
  });
};

/**
 * GET /api/visualizer/fetchMetricData
 * Metric data api request (fake data)
 */

// Spoof controller data for a prettier demo
exports.fakeApiCall = (req, res) => {
	res.send('{"title":"' + req.body.title + '","startTime":"' + req.body.startTimeInput + '","endTime":"' + req.body.endTimeInput + '","chartData":[{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"time":1468305600000,"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '},{"value":' + Math.random()*100 + '}],"maxValue":232}');
}

/**
 * GET /api/visualizer/fetchMetricData
 * Metric data api request (real data)
 */

// Call for metric data to add to the chart
exports.apiCall = (req, res) => {
	// Initiate respnse object
	var responseObject = {};
	responseObject.title = req.body.title;
	responseObject.startTime = req.body.startTimeInput;
	responseObject.endTime = req.body.endTimeInput;
  responseObject.chartData = new Array();

	// Get metric specification
	var hostInfo;
	var metricId;
	var entityId;
	var entityType;

	// Regex apiPreRegString if provided
	if (req.body.apiPreRegString){
		hostInfo = req.body.apiPreRegString.replace(/http:\/\/(.*?:.*?)\/.*/, "$1"); 
		entityType = req.body.apiPreRegString.replace(/.*?application=.*&metrics.*(?:=|,)(.*?)\..*?\.(?:....|...)$/, "$1");
		entityId = req.body.apiPreRegString.replace(/.*?application=.*&metrics.*(?:=|,).*?\.(.*?)\.(?:....|...)$/, "$1");   
		metricId = req.body.apiPreRegString.replace(/.*?application=.*&metrics.*(?:=|,).*?\..*?\.(....|...)$/, "$1");   
	} else {
		hostInfo = req.body.hostInfo;
		metricId = req.body.metricId;
		entityId = req.body.entityId;
		entityType = req.body.entityType;
	}

	// Get credential data
	console.log(hostInfo + "||" + metricId + "//" + entityId + "::" + entityType);
	var username = req.body.username;
	var accountName = req.body.accountName;
	var password = req.body.password;

	// Arbitrary increment call (10 time periods worth of metrics returned to requester)
	var incrementCall = 10;
	
	// Generate time objects
	var startTime = new Date(req.body.startTimeInput);
	var endTime = new Date(req.body.endTimeInput);
	// Total time interval in minutes:
	var totalTimeInterval =  ((endTime.getTime() - startTime.getTime())/1000)/60;
	// Partial time interval for collecting metrics (Split into 11 time periods, for 10 measurements)
	var varTimeInterval = totalTimeInterval / (incrementCall+1);

	// Communicating with metric controller
	async.waterfall([
	// Begin fulfilling authentication process
    function(callback) {
    	// Generate authentication key from 64 encoding + parsing credentials
			generateAuthKey(username, accountName, password, function(authenticationKey){
				callback(null, authenticationKey);
			});
    },
    function(authenticationKey, callback) {
    	// Pass on authentication key to authenticating user
    	authenticateUser(authenticationKey, hostInfo, function(error, cookieString){
     		if (error){
     			responseObject.error = error.toString();
					res.send(JSON.stringify(responseObject));
					return;
     		}
        callback(null, cookieString, authenticationKey);

      });
    },
    function(cookieString, authInfo, callback) {
    	// Do the actual metric browser data request
			authenticatedRequestOptionGen('http://' + hostInfo +'/controller/restui/metricBrowser/getMetricData', hostInfo, cookieString, authInfo, function(generatedOptions){
				callback(null, generatedOptions);
			});
    }
  // Now authentication should be complete
	], function (err, resultingOptions) {
	// Time to begin collecting metrics
		// Run metric data fetching for every time period 
		async.timesSeries(incrementCall, function(i, next) {
			// Define limits of time periods for metric requests
			var n = i+1;
			var shortEndTime = startTime.getTime() + (varTimeInterval * n * 60 * 1000);
			var shortStartTime = startTime.getTime() + (varTimeInterval * i * 60 * 1000);
			// Initiate metric requests
			metricBrowserDataRequest(resultingOptions, shortStartTime, shortEndTime, Math.round(varTimeInterval), metricId, entityId, entityType, function(error, requestResult){
				// Add to chart data array
        responseObject.chartData.push(requestResult);
        next();
			});
		// After completing all metric chart data requests
		}, function(error){
		  // Add maximum value in metric data to the returned responseObject
			responseObject.maxValue = Math.max.apply(Math, responseObject.chartData);
			// Log the response
			console.log("Our API Metric Request Response: " + JSON.stringify(responseObject));
			// Send out the response
			res.send(JSON.stringify(responseObject));      
		});
	});
// End of metric data requests api call exports
};


// Add zero to partial date strings if necessary
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

// Generate authentication key for login by base64 encoding a 
// combo of username+accountname+password; transition ex: 
// ez%40customer1:passw0rd -> Basic ZXolNDBjdXN0b21lcjE6NTU4MjA4MTIxMTIx
function generateAuthKey(username, accountname, password, cb){
	var authenticationKey = new Buffer(username + "%40" + accountname + ":" + password).toString('base64');
	cb(authenticationKey);
}

// Generate options for requests that are already authenticated
function authenticatedRequestOptionGen(url, hostInfo, cookieString, authInfo, cb){
	var options = {
		method: 'POST',
	  url: url,
	  gzip: true,
	  headers: 
	  { 
	    'cache-control': 'no-cache',
	    cookie: cookieString,
	    encoding: "utf8",
	    referer: 'http://' + hostInfo +'/controller/',
	    origin: 'http://' + hostInfo,
	    host: hostInfo,
	    'content-type': 'application/json;charset=UTF-8',
	    'content-length': '', // Fill with length of body content

	    connection: 'keep-alive',
	    authorization: 'Basic ' + authInfo,
	    'accept-language': 'en-US,en;q=0.8',
	    'accept-encoding': 'gzip, deflate',
	    'accept-charset': 'UTF-8',
	    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // Supposedly bad but meh idgaf
	    accept: 'application/json, text/plain, */*' 
	  },
	  body: '' 
	};
	cb(options);
}

// Authenticate user via login request, returns necessary _ga, jsessionid, 
// csrf, and connectsid cookies for authenticating later requests
function authenticateUser(authenticationKey, host, cb){
	// Prepare for request
	var options = { 
		method: 'GET',
	  url: 'http://' + host + '/controller/auth',
	  qs: { action: 'login' },
	  // Develop special headers for pre-authorization connections
	  headers: 
	  { 
	    'cache-control': 'no-cache',
	    authorization: 'Basic ' + authenticationKey, 
	    cookie: 'JSESSIONID=lmaolmao;', // Random, not like they check it lmao
	    'accept-language': 'en-US,en;q=0.8',
	    'accept-encoding': 'gzip, deflate, sdch',
	    referer: 'http://' + host + '/controller/',
	    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', 
	    accept: 'application/json, text/plain, */*',
	    connection: 'keep-alive',
	    host: host
	  } 
	};
	// Send authentication request
	request(options, function (error, response, body) {
		// Receieve response
		if (error){
			cb(error, null);
			return;
		}
		try{
			// We are assuming cookies were successfuly returned
		  // Grab the returned cookies
		 	var setCookieList = [];
		  response.headers["set-cookie"].forEach(
		    function ( cookiestr ) {
		    	// Parse the cookies (sometimes jsessionid cookie will have extraneous 
		    	// text at the end of it, so we get rid of the extra part if necessary)
		    	if (cookiestr != "HttpOnly"){
		    		setCookieList.push(cookiestr.replace('Path=/controller;','').replace('HttpOnly',''));
		    	}
		    	
		    	
		    }
		  );

		  var setCookies = setCookieList.join("; "); 
		  // Returns cookie header string
		  cb(null, setCookies.replace(null, ';  ;',';'));
		}
		catch (err){
			cb(err, null);
			return;
		}
	});
// End of authenticate user request function
}



// Send request for metric browser chart data, across a set time interval,
// returning a single data value for a short time interval that is used for plotting
function metricBrowserDataRequest(options, startTime, endTime, timeInterval, metricId, entityId, entityType, callback){

	// Build start and end time strings
	// EX "2016-07-10T06:08:00.000Z"
	var startTimeObj = new Date(startTime);
	var startTimeString = 
		startTimeObj.getFullYear() + "-" + 
		addZero(startTimeObj.getMonth()+1) + "-" + 
		addZero(startTimeObj.getDay()+10) + "T" + 
		addZero(startTimeObj.getHours()) + ":" + 
		addZero(startTimeObj.getMinutes()) + ":" +
		addZero(startTimeObj.getSeconds()) + ".000Z";
	var endTimeObj = new Date(endTime);
	var endTimeString = 
		endTimeObj.getFullYear() + "-" + 
		addZero(endTimeObj.getMonth()+1) + "-" + 
		addZero(endTimeObj.getDay()+10) + "T" + 
		addZero(endTimeObj.getHours()) + ":" + 
		addZero(endTimeObj.getMinutes()) + ":" +
		addZero(endTimeObj.getSeconds()) + ".000Z";

	// Build JSON payload for the metric requests
	options.body = '{"metricDataQueries":[{"metricId":' + metricId + ',"entityId":' + entityId + ',"entityType":"' + entityType + '"}],"timeRangeSpecifier":{"type":"BETWEEN_TIMES","startTime":"' + startTimeString + '","endTime":"' + endTimeString + '","durationInMinutes":' + Math.ceil(timeInterval) + '},"metricBaseline":null,"maxSize":1000}';

	// Get the length of metric request 
	options.headers["content-length"] = options.body.length;

	// Log the options that are used for the controller communication
	console.log("Controller communication option: " JSON.stringify(options));

	request(options, function (error, response, body) {
		// Response from metric browser retrieved
		if (error){
			callback(error, null);
			return;
		}
		var parsedResp = JSON.parse(body);
		// We only want to grab a single slice of data
		// because we already narrowed down the time interval 
		// so only the first item in the array is accepted
		try {
			var timeStamp = parsedResp[0].dataTimeslices[0].startTime;
			var value = parsedResp[0].dataTimeslices[0].metricValue.value;
		  callback(null, {"time": timeStamp, "value": value});
		}
		// Check if response was parsable
		catch (err){
			// Return a blank value, so that the chart can leave a blank
			// hole in the chart if no metric data responded
			console.log("Finding error");
			callback(error, {"value": null});
			return;
		}
	});
}



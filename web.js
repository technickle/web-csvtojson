var http = require('http');
var csv = require('csv');

//----- configuration block

// use this to configure this app instance
var config = {
	// configure the source CSV document
	httpSource: {
		// server to connect for CSV retrieval
		hostname: '207.251.86.229',
		// port number to connect to on the server (should normally be 80 or 443)
		port: 80,
		// path & file of CSV file to retrieve
		path: '/nyc-links-cams/LinkSpeedQuery.txt',
		// HTTP method to retrieve the file (should normally be 'GET')
		method: 'GET'
		// you can insert other HTTP options in here as needed
	},
	// configure csv parsing options
	csvParseOptions: {
		// true if the first row of the CSV contains column names to be mapped to JSON values
		columns: true,
		// character which delimits fields in the CSV
		delimiter: '\t'
		// length of time a retrieved CSV should be cached (in milliseconds)
	},
	cacheTime: 60000
};

//----- code block

//object to cache data (uses memory!)
function dataCache(configuration) {
	var _config = configuration		// store the constructor configuration parameters
	var _retrieved;					// timestamp of last retrieval
	var _expires;					// timestamp of expiration
	var _data;						// cache of data (stored as a JS object)
	this.config = function() {
		return _config;
	};
	this.retrieved = function() {
		return _retrieved;
	};
	this.expires = function() {
		return _expires;
	};
	this.getData = function (callback) {
		if (!_data || (new Date().getTime()>_expires)) {
			this.retrieveData(callback);
		} else {
			callback(_data);
		}
	}
	
	this.retrieveData = function(callback) {
		var request = http.request(_config.httpSource, function(response) {
			var responseBody;
			response.on('data', function(chunk) {
				responseBody += chunk;
			});
			response.on('end', function() {
				_retrieved = new Date().getTime();
				_expires = _retrieved + _config.cacheTime;
				csv()
					.from
					.string(responseBody, _config.csvParseOptions)
					.to.array(function(data,count) {
						_data = JSON.stringify(data, null, 2);
						callback(_data);
					});
			});
		});
		request.end();
	}
};

//
var dc = new dataCache(config);
http.createServer(function(req, res) {
	try {
		res.writeHead(200);
		dc.getData(function(result) {
			res.end(result);
		});
	} catch(e) {
		res.writeHead(500);
		red.end(e);
	}
}).listen(process.env.PORT || 5000);
var express = require("express"),
    querystring = require("querystring"),
	request = require("request"),
	profile = require(__dirname + "/profile.js"),
	domains = require(__dirname + "/domains.js"),
	submissions = require(__dirname + "/submissions.js"),
	users = require(__dirname + "/users.js"),
	data = require(__dirname + "/data.js"),
	port = process.env.PORT || 3000,
	crossdomainInsecure = "<?xml version=\"1.0\"?><!DOCTYPE cross-domain-policy SYSTEM \"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd\"><cross-domain-policy><site-control permitted-cross-domain-policies=\"master-only\" /><allow-access-from domain=\"*\" to-ports=\"*\" /><allow-http-request-headers-from domain=\"*\" headers=\"*\" /></cross-domain-policy>",
	crossdomainSecure = "<?xml version=\"1.0\"?><!DOCTYPE cross-domain-policy SYSTEM \"http://www.adobe.com/xml/dtds/cross-domain-policy.dtd\"><cross-domain-policy><site-control permitted-cross-domain-policies=\"master-only\" /><allow-access-from domain=\"*\" to-ports=\"*\" secure=\"false\" /><allow-http-request-headers-from domain=\"*\" headers=\"*\" /></cross-domain-policy>",
	XML_HEADER = {"Content-Type": "text/xml"},
	JSON_HEADER = {"Content-Type": "application/json"};
		
var app = express.createServer();
app.configure(function(){
    app.use(function(request, response, next) {
		console.log(request.url);
	    response.header("Access-Control-Allow-Origin", "*");
	    response.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
	    response.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
		next();
	});
    app.use(express.bodyParser());
    app.use(app.router);
});

app.listen(port, function() {
  console.log("Listening on " + port + ", env: " + process.env.NODE_ENV + ", local: " + (process.env.local || false));
});

app.all("/crossdomain.xml", function(request, response) {
    response.writeHead(200, XML_HEADER);
    response.end(crossdomainSecure);
});

app.all("/user", profile.checkUser);
app.all("/domain", profile.checkDomain);
app.all("/status", profile.status);
app.all("/cache", profile.cache);
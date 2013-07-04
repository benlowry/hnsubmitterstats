var request = require("request"),
	data = require(__dirname + "/data.js"),
	utils = require(__dirname + "/utils.js");

/**
 * Monitors the most recent 30 submissions for analysis.  On
 * the first run it scrapes the most recent 1000.
 */
var url = "http://api.thriftdb.com/api.hnsearch.com/items/_search" + 
	 	  "?sortby=create_ts+desc" + 
	 	  "&filter[fields][type]=submission";
 
var firsttime = false;
var offset = 0;

setTimeout(function() {

	var scrape = arguments.callee;
	
	if(!data.ready()) {
		return setTimeout(scrape, 1000);
	}

	var options = {
		url: url
	}

	if(firsttime) {
		options.url += "&start=" + offset + "&limit=100";
	} else {
		options.url += "&limit=30";
	}
	
	request(options, function (error, response, body) {

		if (error) {
			console.log("scrape.error (submissions.js#36) " + error);
			return setTimeout(scrape, 1000);
		};
		
		var jbody = JSON.parse(body);	

		if(jbody.results && jbody.results.length > 0) {					
			for(var i=0; i<jbody.results.length; i++) {
				var item = jbody.results[i].item;
				var domain = utils.baseurl(item.url || "selfpost")
				data.queueDomain(domain);
				data.queueUser(item.username, null, true);
			}	
		}

		if(firsttime && offset != 900) {
			offset += 100;
			return setTimeout(scrape, 1000);
		}

		firsttime = false;
		offset = 0;
		return setTimeout(scrape, 60000);
	});

}, 1000);
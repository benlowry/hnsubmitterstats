var request = require("request"),
	data = require(__dirname + "/data.js"),
	scraped = {};

/**
 * Takes the most recent 1000 submissions for a particular 
 * domain for analysis
 */
var url = "http://api.thriftdb.com/api.hnsearch.com/items/_search" + 
		 "?sortby=create_ts+desc" + 
		 "&filter[fields][type]=submission" + 
		 "&q=";

setTimeout(function() { 
	
	var scrape = arguments.callee;
	var queue = data.domainQueue;

	if(queue.length == 0 || !data.ready()) {
		return setTimeout(scrape, 1000);
	}

	var domain = queue[0];
	
	if(scraped[domain]) {
		queue.splice(queue.indexOf(domain), 1);
		return setTimeout(scrape, 1000);
	}
	
	console.log("scraping domain", domain, "queue", queue.length);
	
	
	var offset = 0;
	
	(function() { 
		
		var geturl = arguments.callee;
		
		var options = {
			url: url + domain + "&start=" + offset + "&limit=100"
		};
		
		console.log("domain", domain, offset);
				
		request(options, function (error, response, body) {

			if (error) {
				console.log("scrape.error (domains.js#40) " + error);
				return setTimeout(scrape, 1000);
			};
		
			var jbody = JSON.parse(body);	

			if(jbody.results && jbody.results.length > 0) {					
				for(var i=0; i<jbody.results.length; i++) {
					data.queueUser(jbody.results[i].item.username);
				}	
			}

			if(offset < jbody.hits && offset != 900) {
				offset += 100;
				return setTimeout(geturl, 1000);
			}

			queue.splice(queue.indexOf(domain), 1);
			scraped[domain] = true;
			return setTimeout(scrape, 1000);
		});
		
	})();


}, 1000);
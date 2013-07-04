var request = require("request"),
	data = require(__dirname + "/data.js"),
	utils = require(__dirname + "/utils.js");
	
/**
 * Inspects user accounts
 */ 
(function() { 

	var inspect = arguments.callee;
	var queue = data.userQueue;

	if(queue.length == 0 || !data.ready()) {
		return setTimeout(inspect, 1000);
	}

	var username = queue[0],
		userinfo = {
			username: username
		};
	
	console.log("inspecting user", username, "queue", queue.length);
	
	// get the age of the account and some other interesting data from the profile
	var options = { 
		url: "http://api.thriftdb.com/api.hnsearch.com/users/" + username
	}
	
	request(options, function(error, response, body) {
		
		// re-queue the username if there's an error
		if(error) {
			console.log("inspect.error (users.js#33) " + error);
			queue.splice(queue.indexOf(username), 1);
			queue.push(username);
			return setTimeout(inspect, 1000);
		}
		
		// invalid user
		var jbody = JSON.parse(body);
		
		if(!jbody.username) {
			console.log("inspect.error (users.js#33) no username in jbody", username, options.url);
			queue.splice(queue.indexOf(username), 1);
			
			// requeue it if there will be a reasonable delay
			if(queue.length > 100)
			{
				queue.push(username);
			}
			
			return setTimeout(inspect, 1000);
		}

		userinfo.cached = new Date();
		userinfo.created = new Date(jbody.create_ts);
		
		// blank about information
		userinfo.blankabout = jbody.about == "" || jbody.about == null;
		
		// get the submissions by this user
		submissions(username, function(domainlist, numsubmissions, lastsubmission) {

			userinfo.domains = {};
			userinfo.submissions = numsubmissions;
			userinfo.lastsubmission = lastsubmission;
			
			for(var i=0; i<domainlist.length; i++) {
				
				var domain = domainlist[i];

				if(!userinfo.domains[domain]) {
					userinfo.domains[domain] = 1;
				} else {					
					userinfo.domains[domain]++;
				}

				data.addDomainSubmitter(domain, username);
			}
			
			// get the comments by this user
			comments(username, function(numcomments, lastcomment) {
				userinfo.comments = numcomments;
				userinfo.lastcomment = lastcomment;
				data.setUserInfo(username, userinfo);
				queue.splice(queue.indexOf(username), 1);
				return setTimeout(inspect, 1000);
			});
		});
	}); 
})();

/**
 * Counts how many comments a user has.
 * TODO: it would be neat to see if they only comment on the sources they submit
 */
function comments(username, callback) {

	var options = {
		url: "http://api.thriftdb.com/api.hnsearch.com/items/_search" + 
			 "?limit=1" + 
			 "&sortby=create_ts+desc" + 
			 "&filter[fields][type]=comment" + 
			 "&filter[fields][username]=" + username
	};
	
	(function() { 
		
		var getcomments = arguments.callee.caller;
		request(options, function(error, response, body) {
	
			if(error) { 
				console.log("comments.error (data.js#162): " + error);
				return setTimeout(getcomments, 1000)
			}
			
			var jbody = JSON.parse(body);
			var numcomments = jbody.hits;
			var lastcomment;
			
			if(jbody.results.length > 0) {
				lastcomment = new Date(jbody.results[0].item.create_ts);
			}
			
			callback(numcomments, lastcomment)
		});
	})();
}

/**
 * Explores the last 1000 submissions by a user
 */
function submissions(username, callback) {
	
	var sublist = [],
		offset = 0,
		lastsubmission = null,
		numsubmissions = 0,
		url = "http://api.thriftdb.com/api.hnsearch.com/items/_search" + 
				"?limit=100" + 
				"&sortby=create_ts+desc" + 
				"&filter[fields][type]=submission" + 
				"&filter[fields][username]=" + username;
				
	(function() { 
		
		var getsubmissions = arguments.callee;
		
		var options = {
			url: url + "&start=" + offset
		};
	
		request(options, function(error, response, body) {
			
			if(error) {
				console.log("submissions.error (data.js#201): " + error);
				return setTimeout(function() { 
					getsubmissions();
				}, 1000);
			}
			
			// get the submissions
			var jbody = JSON.parse(body);			
			
			numsubmissions = jbody.hits;
			offset += 100;
			
			if(!jbody.results || !jbody.results.length) {
				return callback(sublist, numsubmissions, lastsubmission);
			}
			
			// analyse them
			for(var i=0; i<jbody.results.length; i++) {
				
				var item = jbody.results[i].item;
				var domain = utils.baseurl(item.url || "selfpost");
				domain = domain.toLowerCase();
				
				if(!lastsubmission) {	
					lastsubmission = new Date(item.create_ts);
				}
									
				sublist.push(domain);
				data.queueDomain(domain);
			}
			
			// next or callback
			if(offset < jbody.hits && offset < 1000) {
				return getsubmissions();
			} else {
				return callback(sublist, numsubmissions, lastsubmission);
			}		
		});
	})();
}

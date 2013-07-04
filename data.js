var mongodb = require("mongodb"),
	utils = require(__dirname + "/utils.js"),
	userdata = {},
	domaindata = {},
	userqueue = [],
	domainqueue = [],
	collection;
	
var data = module.exports = { 
	
	ready: function() { 
		return collection != null;
	},

	/**
	 * Data
	 */
	cacheData: function() {
		return { users: userdata, domains: domaindata };
	},

	userData: function(username) {
		if(userdata[username]) {
			
			// queue stale data for re-checking
			if(utils.minutesOld(userdata[username]._cache) > 60) {
				data.queueUser(username, 0, true);
			}
			
			return JSON.parse(JSON.stringify(userdata[username]));
		}
	
		return null;
	},

	domainData: function(domain) {

		if(domaindata[domain]) {
			return JSON.parse(JSON.stringify(domaindata[domain]));
		}
	
		return null;
	},
	
	/**
	 * Sets a user info
	 */
	setUserInfo: function(username, userinfo) {
		
		userdata[username] = userinfo;
		userinfo._id = username;
		userinfo._cache = new Date();
		
		collection.update({ _id: username }, userinfo, { w: 1, upsert: true }, function(error) {
			if(error) { 
				console.log("data.setUserInfo (data.js#42) error: " + error);
			}
		});
	},
	
	
	/**
	 * Attaches a submitter to a domain
	 */
	addDomainSubmitter: function(domain, username, count) {
		
		domain = domain.toLowerCase();

		if(!domaindata[domain]) {
			domaindata[domain] = { 
				users: {},
				submissions: 0,
				submitters: 0
			}
		}
		
		if(!domaindata[domain].users[username]) { 
			domaindata[domain].users[username] = 0;
			domaindata[domain].submitters++;
		}
		
		count = count || 1;
		
		domaindata[domain].users[username] += count;
		domaindata[domain].submissions += count;
	},

	/**
	 * Queues 
	 */
	domainQueue: domainqueue,
	userQueue: userqueue,

	queueDomain: function(domain) {
		
		if(!data.ready()) {
			return;
		}
		
		if(domainqueue.indexOf(domain) == -1) {
			domainqueue.push(domain);
		}
	},

	queueUser: function(username, position, forcerefresh) {
		
		if(!data.ready()) {
			return;
		}
		
		// already in the queue
		if(userqueue.indexOf(username) > -1) {
			if(forcerefresh) {
				console.log(username + " already in queue");
			}			
			return;
		}
		
		// already exists and we're not forcing a refresh
		if(userdata[username] && !forcerefresh)  {
			if(forcerefresh) {
				console.log(username + " rejected, impossibly");
			}
			return;
		}
		
		if(position == null) {
			console.log("pushing " + username)
			userqueue.push(username);
		} else {
			console.log("splicing " + username);
			userqueue.splice(position, username);
		}
	},

	/**
	 * Position of a user in the queue
	 */
	queueStatus: function(username) {
		return {queued: username, position: userqueue.indexOf(username), queuesize: userqueue.length };
	}
};

/**
 * Loads our saved data from mongodb 
 */
mongodb.MongoClient.connect(process.env.MONGOHQ_URL || "mongodb://hnsubmitters:hnsubmitters@127.0.0.1:27017/hnsubmitters", function(error, db) {
	if(error) {
		throw error;
	}

	var coll = db.collection("users");
	coll.find().toArray(function(error, items) { 
		
		console.log("loaded " + items.length + " items from database");
		
		for(var i=0; i<items.length; i++) {
			var user = items[i];
			var username = user.username;
			userdata[username] = user;
			
			for(var domain in user.domains) {
				data.addDomainSubmitter(domain, username, user.domains[domain]);
				
				var dl = domain.toLowerCase();
				
				if(dl != domain) {
					user.domains[dl] = user.domains[domain];
					delete user.domains[domain];
				}
			}
		}
		
		collection = coll;
	});
});
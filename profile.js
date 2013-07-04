var request = require("request"),
	url = require("url"),
	data = require(__dirname + "/data.js"),
	utils = require(__dirname + "/utils.js");

var profile = module.exports = {
	
	cache: function(request, response) {
		response.write(JSON.stringify(data.cacheData(), null, "\t"));
		response.end();
	},
	
	status: function(request, response) {
		response.write({last_refresh: data.last_refresh, profiles: userdataarray.length});
	},
	
	checkDomain: function(request, response) {
		
		var domainlist = request.query.domain || request.query.domains;
		
		if(!domainlist) {
			response.end(JSON.stringify({error: "no domains were passed to script"}));
			return;
		}
		
		var domains = domainlist.indexOf(",") > -1 ? domainlist.split(",") : [domainlist];
		var returndata = [];
		var inserts = 0;

		domains.forEach(function(domain) {
			
			domain = domain.toLowerCase();			
			var dprofile = data.domainData(domain);
			
			if(dprofile) {
				
				var newusers = [];
				
				for(var username in dprofile.users) {

					var uprofile = data.userData(username);
					
					if(uprofile) {				
						newusers.push({
							username: username,
							domain: domain,
							daysold: daysOld(uprofile.created),
							submissions: uprofile.submissions,
							comments: uprofile.comments,
							lastcomment: daysOld(uprofile.lastcomment),
							lastsubmission: daysOld(uprofile.lastsubmission),
							domainusersubmissions: uprofile.domains[domain],
							domaintotalsubmissions: dprofile.submissions,
							domainsubmitters: dprofile.submitters
						});
					} else {
						data.queueUser(username);
						inserts++;
						newusers.push(data.queueStatus(username));
					}
				}
				
				dprofile.userprofiles = newusers;
				dprofile.userprofiles.sort(function(a, b) { 
					return a.domainusersubmissions < b.domainusersubmissions ? 1 : -1;
				})
			}
			
			returndata.push(dprofile);
		})
		
		response.write(JSON.stringify({domaindata: returndata}));
		response.end();
	},

    checkUser: function(request, response) {

		var usernamelist = request.query.username || request.query.usernames;
		
		if(!usernamelist) {
			response.end(JSON.stringify({error: "no usernames were passed to script"}));
			return;
		}
		
		var usernames = usernamelist.indexOf(",") > -1 ? usernamelist.split(",") : [usernamelist];
		var returndata = {};
		var inserts = 0;
		
		usernames.forEach(function(user) {
			
			// user with domain
			if(user.indexOf(":") > -1) {	
				
				if(!returndata.users) { 
					returndata.users = [];
					returndata.domains = [];
				}
						
				var uparts = user.split(":");
				var username = uparts[0];
				var domain = uparts[1].toLowerCase();
				var story = uparts.length == 3 ? uparts[2] : "";
				var uprofile = data.userData(username);
			
				if(uprofile) {
				
					var dprofile = data.domainData(domain) || { submissions: -1, domainsubmitters: -1 };
					
					// submission is newer than our data
					if(!uprofile.domains[domain]) {
						console.log("re-queueing", username, domain);
						data.queueUser(username, 0, true);
					}					
				
					returndata.users.push({
						username: username,
						domain: domain,
						story: story,
						daysold: daysOld(uprofile.created),
						submissions: uprofile.submissions,
						comments: uprofile.comments,
						lastcomment: daysOld(uprofile.lastcomment),
						lastsubmission: daysOld(uprofile.lastsubmission),
						domainusersubmissions: uprofile.domains[domain],
						domaintotalsubmissions: dprofile.submissions,
						domainsubmitters: dprofile.submitters,
						domainssubmitted: Object.keys(uprofile.domains).length
					});
					
					var domaindata = {
						domain: domain,
						submissions: dprofile.submissions,
						submitters: dprofile.submitters
					};
					
					returndata.domains.push(domaindata);
					return;
				} 
			
				data.queueUser(username, inserts);
				returndata.users.push(data.queueStatus(username));
				inserts++;
				
			} else {
				
				if(!returndata.users) {
					returndata.users=  [];
				}
				
				var uprofile = data.userData(user);
				
				if(uprofile) {
					
					var udata = {
						username: username,
						daysold: daysOld(uprofile.created),
						submissions: uprofile.submissions,
						comments: uprofile.comments,
						lastcomment: daysOld(uprofile.lastcomment),
						lastsubmission: daysOld(uprofile.lastsubmission),
						domains: []
					}
				
					for(var domain in uprofile.domains) {
						var dprofile = data.domainData(domain) || { submissions: -1, domainsubmitters: -1 };
							
						udata.domains.push({
							domain: domain,
							domainusersubmissions: uprofile.domains[domain],
							domaintotalsubmissions: dprofile.submissions,
							domainsubmitters: dprofile.submitters
						});
					}
					
					returndata.users.push(udata);
					return;
				}
				
				data.queueUser(user, inserts);
				returndata.users.push(data.queueStatus(user));
				inserts++;			
			}
		});
				
		response.write(JSON.stringify(returndata));
		response.end();
    }
};

function daysOld(date) {
	
	if(!date) { 
		return "never";
	}
	
	if(!date.getTime) {
		date = new Date(date.toString());
	}

	var oneday = 24 * 60 * 60 * 1000;
	return Math.floor((new Date().getTime() - date.getTime()) / oneday);
	
}
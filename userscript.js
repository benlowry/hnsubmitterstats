// ==UserScript==
// @name         HN submitter stats
// @namespace    http://github.com/benlowry/hnsubmitter
// @version      0.1
// @description  Displays submission information on HN
// @match        https://news.ycombinator.com/*
// @copyright    2013+, Ben Lowry
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js
// ==/UserScript==

(function() { 
        
    var storytable = findStoryTable();
    
    if(!storytable) { 
        return;
    }
    
    var stories = getSubmissionList();
    
    if(!stories) {
        return;
    }

   	// some css to pretty up our user table
    document.styleSheets[0].insertRule(".domaintable { background-color: #FFF; display: block; padding: 4px; position: absolute; margin-top: 20px; border: 2px solid #333; }", 0);
    document.styleSheets[0].insertRule(".usertable { margin-top: 4px !important; }", 0);
    document.styleSheets[0].insertRule(".domaintable h5 { margin: 0px; padding: 0px; color: #666; font-size: 12px; }", 0);
    document.styleSheets[0].insertRule(".domaintable h5 a { float: right; margin-left: 4px; }", 0);
    document.styleSheets[0].insertRule(".domaintable table { margin: 4px; border-collapse: collapse; }", 0);
    document.styleSheets[0].insertRule(".domaintable th, .domaintable td { text-align: left; padding: 4px; font-size: 11px; color: #000; border: 1px solid #CCC; }", 0);
    document.styleSheets[0].insertRule(".domaintable tr.strike td { text-decoration: line-through; color: #666; }", 0);

   	// load the submitter stats
    $.getJSON("https://hnsubmitters.herokuapp.com/user?usernames=" + stories.join(","), function(json) {
       
        if(!json || !json.users) {
            return;
        }
        
        var i;
		
        // add the domain info links and index
        var tags = document.getElementsByClassName("comhead");
		var domaininfo = {};
        
        for(i=0; i<json.domains.length; i++) {
            var domain = json.domains[i];   
            var match = "(" + domain.domain + ")";
			
			domaininfo[domain.domain] = domain;
            
            for(var j=0; j<tags.length; j++) {

                if(tags[j].innerHTML.toLowerCase().indexOf(match) == -1) {
                    continue;
                }
                
                var dlink = document.createElement("a");
                dlink.innerHTML = "(" + domain.domain + "+)";
                dlink.domain = domain;
                dlink.tag = tags[j];
                dlink.href = "#";
                dlink.onclick = function() { 
                    openDomainData(this.domain, this.tag);
                    return false;
                };
                
                tags[j].innerHTML = " ";
                tags[j].appendChild(dlink);
                break;
            }
        }
        
        // add the user stats
        for(i=0; i<json.users.length; i++) {
            var user = json.users[i];

            if(!user.story || user.queued) {
                continue;
            }
			
			if(!user.domainusersubmissions) {
				user.domainusersubmissions = 0;
			}
            
            var percent = (user.domainusersubmissions / user.submissions * 100).toFixed(2);
			var dpercent = (user.domainusersubmissions / user.domaintotalsubmissions * 100).toFixed(2);
            var commentsperday = user.comments / user.daysold || "--";
            var submissionsperday = user.submissions / user.daysold || "--";

            var container = $("#hnsubmitstats_" + user.story)[0];
            container.style.display = "";                
            container.innerHTML = "<span>" + user.domainusersubmissions + " of " + user.submissions + " user " + percent + "%, domain " + dpercent + "%</span> | " + 
                                  "<span>" + user.daysold + " days old, " + user.comments + " comments, " + user.submissions + " submissions</span> | " + 
                                  "<span>" + user.domainssubmitted + " domains submitted</span> | " + 
                				  "<span>Last comment " + user.lastcomment + (user.comments > 0 ? " days ago" : "") + "</span> | ";
            
            
            var ulink = document.createElement("a");
            ulink.innerHTML = "sub history";
            ulink.username = user.username;
            ulink.href = "#";
            ulink.tag = container;
            ulink.onclick = function() { 
                openUserData(this.username, this.tag);
                return false;
            };
            
            container.appendChild(ulink);
			
			// skip self posts
			if(!user.domain) {
				continue;
			}
            
            // highlight this user if any of:
			// 1) obvious spam: they submit 75% or more this domain and have no comments
            // 2) probably spam: they submit 50% or more of the submissions for this domain and the domain has more than 20 submissions
            // 3) probably spam: they submit 20% or more for this domain and the domain has more than 100 submissions
            // 4) auto submitter: less than 1 comment per 100 submissions
            if(
				(user.domainusersubmissions / user.submissions >= 0.75 && user.comments == 0) ||
                (user.domainusersubmissions / user.domaintotalsubmissions > 0.5 && user.domaintotalsubmissions > 20) ||
                (user.domainusersubmissions / user.domaintotalsubmissions > 0.2 && user.domaintotalsubmissions > 100) || 
                (user.submissions / 100 > user.comments)
            ) {
                container.style.color = "#990000";
            }
        }
    });
    
    /**
     * Looks for the story table
     */
    function findStoryTable() { 
        
        var tables = document.getElementsByTagName("table");
        
        for(var i=0; i<tables.length; i++) {
            var table = tables[i],
                row = null,
                j = 0;
            
            for(j=0; j<table.rows.length; j++) {
                row = table.rows[j];
            
                if(row.cells.length > 0 && row.cells[0].className == "title") {
                    return table;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Goes through a story table and collects username, domain and story 
	 * numbers and appends a container div for later use
     */
    function getSubmissionList() {
        var stories = [],
            story = 1;
    
        for(var i=0; i<storytable.rows.length - 1; i += 3, story++) {
            
            if(i +1 >= storytable.rows.length) {
                return stories;
            }
            
            var row = storytable.rows[i];
            var nextrow = storytable.rows[i+1];
            
            if(row.cells.length == 0 || nextrow.cells.length == 0) { 
                continue;
            }
            
            // last cell contains domain
            var domain = row.cells[row.cells.length - 1].innerHTML;
            domain = domain.substring(domain.indexOf("<span class=\"comhead\">") + "<span class=\"comhead\">".length);
            domain = domain.substring(0, domain.indexOf(")")).trim().substring(1).toLowerCase();
    
            // next row's first cell contains username        
            var username = nextrow.cells[1].innerHTML;
            username = username.replace("<font color=\"#3c963c\">", "").replace("</font>", ""); // new user highlighting
            username = username.substring(username.indexOf("<a"));
            username = username.substring(username.indexOf(">") + 1);
            username = username.substring(0, username.indexOf("<"));
            
            if(username == "") { // yc job posts
                continue;
            }
            
            // tag the username cell
            var tag = username + ":" + domain + ":" + story;
            stories.push(tag);
            nextrow.cells[1].innerHTML += "<div id='hnsubmitstats_" + story + "'></div>";
        }   
        
        return stories;
    }
    
    /**
     * Opens up a user submission info table
     */
    function openUserData(username, tag) {
        var id = "usertable_" + username;
        
        if(document.getElementById(id) != null) {
            document.getElementById(id).style.display = "block";
            return;
        }
        
        $.getJSON("https://hnsubmitters.herokuapp.com/user?username=" + username, function(data) {
            
            var user = data.users[0];
            var container = document.createElement("div");
            container.id = id;
            container.className = "domaintable usertable";
            container.innerHTML = "<h5>" + 
										"<a href='javascript:document.getElementById(\"" + id + "\").style.display=\"none\"; return false;'>close</a>" + 
										"<a href='javascript:document.styleSheets[0].insertRule(\".domaintable tr.strike { display: none; }\", 0); return false;'>hide strikes</a> " + 
                						username + " (" + user.submissions + " submissions of " + user.domains.length + " domains, " + user.comments + " comments)</h5>" + 
                                    "<table>" + 
                                    "<tr>" + 
                                        "<th>Domain</th>" + 
                                        "<th>User submissions</th>"  +
                						"<th>Total submissions</th>" + 
                						"<th>Total submitters</th>" + 
                                        "<th>Domain / User</th>" + 
                                        "<th>User / Domain</th>" + 
                                    "</tr>" + 
                                    "</table>";

            var table = container.getElementsByTagName("table")[0];
            var user = data.users[0];
            
            for(var i=0; i<user.domains.length; i++) {
                var domain = user.domains[i];
            
                table.innerHTML += "<tr>" + 
                                        "<td>" + domain.domain + "</td>" + 
                                        "<td>" + domain.domainusersubmissions + "</td>"  +
                                        "<td>" + domain.domaintotalsubmissions + "</td>"  +
                                        "<td>" + domain.domainsubmitters + "</td>"  +
                                        "<td>" + domain.domainusersubmissions + " / " +  user.submissions + " (" + (domain.domainusersubmissions / user.submissions * 100).toFixed(3) + "%)</td>" + 
                                        "<td>" + domain.domainusersubmissions + " (" + (domain.domainusersubmissions / domain.domaintotalsubmissions * 100).toFixed(3) + "%)</td>" + 
                                    "</tr>";
            }
    
            tag.appendChild(container);
        });
    }
    
    /**
     * Opens up a domain submitter info table
     */
    function openDomainData(domain, tag) {
        
        var id = "domaintable_" + domain.domain;

        if(document.getElementById(id) != null) {
            document.getElementById(id).style.display = "block";
            return;
        }
        
        $.getJSON("https://hnsubmitters.herokuapp.com/domain?domain=" + domain.domain, function(data) {

            var container = document.createElement("div");
            container.id = id;
            container.className = "domaintable";
            container.innerHTML = "<h5>" + 
										"<a href='javascript:document.getElementById(\"" + id + "\").style.display=\"none\"; return false;'>close</a>" + 
										"<a href='javascript:document.styleSheets[0].insertRule(\".domaintable tr.strike { display: none; }\", 0); return false;'>hide strikes</a> " + 
										domain.domain + " (" + domain.submissions + " submissions by " + domain.submitters + " users)</h5>" + 
                                    "<table>" + 
                                    "<tr>" + 
                                        "<th>Submitter</th>" + 
                                        "<th>Days old</th>"  +
                                        "<th>Domain / User</th>" + 
                                        "<th>User / Domain</th>" + 
                                        "<th>Comments</th>" + 
                                        "<th>Last comment</th>" + 
                                    "</tr>" + 
                                    "</table>";
            
            var table = container.getElementsByTagName("table")[0];
            
            for(var i=0; i<data.domaindata[0].userprofiles.length; i++) {
                var user = data.domaindata[0].userprofiles[i];
                
                table.innerHTML += "<tr onclick='this.className = this.className == \"strike\" ? \"\" : \"strike\"'>" + 
                                        "<td><a href='https://news.ycombinator.com/user?id=" + user.username + "'>" + user.username + "</a></td>" + 
                                        "<td>" + user.daysold + "</td>"  +
                                        "<td>" + user.domainusersubmissions + " / " +  user.submissions + " (" + (user.domainusersubmissions / user.submissions * 100).toFixed(3) + "%)</td>" + 
                                        "<td>" + user.domainusersubmissions + " (" + (user.domainusersubmissions / domain.submissions * 100).toFixed(3) + "%)</td>" + 
                                        "<td>" + user.comments + "</td>" + 
                                        "<td>" + user.lastcomment + (user.comments > 0 ? " days ago" : "") + "</td>" + 
                                    "</tr>";
            }
    
            tag.appendChild(container);
      });
    }

})();
# HN Submitter Stats

Appends submitter data to lists of stories in HN and highlights accounts that are interesting because of their submission history.  Accounts are identified as interesting if they match various criteria you can adjust in the javascript.

This is two-part:

1. A NodeJS server that runs on Heroku and MongoHQ, this automatically monitors the API at [HNSearch](http://hnsearch.com/) for new submissions and explores domains and users it encounters.  The data is synced to MongoDB but resides entirely in memory.
2. A browser userscript created for Chrome's [TamperMonkey](http://tampermonkey.biniok.net/)

## Setup instructions

1. As a user just add the TamperMonkey extension and the userscript.js.

or

1. Clone the git repo to your own Heroku etc
2. If you want to save time import the mongodb dump, otherwise in submissions.js you might like to change 'firsttime' to true so that it will more proactively look for data.
3. Change the URLs in the userscript.js to point to your own installation

### Screenshots

#### The modified story list
This is what it looks like after fetching the stats for the page you're browsing.  The (domain) has been converted to a link for domain history, and a link has been added for the submitter's.

![Story list](http://i.imgur.com/PCh9H6c.png)

#### Domain history
Viewing a domain's submission history.  There is very basic functionality
for removing uninteresting accounts by clicking their row (not username) 
which toggles a strike through, and then clicking hide strikes.

![Domain history](http://i.imgur.com/uP7ZgSh.png)

####  Submission history

![User history](http://i.imgur.com/gx9WEAw.png)

##### License
HN Submitter Stats is licensed under the MIT license.  Certain
portions may come from 3rd parties and carry their own licensing
terms and are referenced where applicable.
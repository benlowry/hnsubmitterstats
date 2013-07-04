## HN Submitter Stats

Appends submitter data to lists of stories in HN and highlights accounts that are interesting because of their submission history.  Accounts are identified as interesting if they match various criteria you can adjust in the javascript.

This is two-part:

1) A NodeJS server that runs on Heroku and MongoHQ
2) A browser userscript created for Chrome's TamperMonkey

#### Setup instructions

1) Add the TamperMonkey extension and the userscript.js

or

1) Clone the git repo to your own Heroku etc
2) If you want to save time import the mongodb dump
3) Change the URLs in the userscript.js to point to your installation

#### Screenshots

1) The modified story list.

![Story list](http://i.imgur.com/PCh9H6c.png)

2) Viewing a domain's submission history.  There is very basic functionality
for removing uninteresting accounts by clicking their row (not username) 
which toggles a strike through, and then clicking hide strikes.

![Domain history](http://i.imgur.com/uP7ZgSh.png)

3) Viewing a user's submission history.

![User history](http://i.imgur.com/gx9WEAw.png)

##### License
HNSubmitterStats is licensed under the MIT license.  Certain
portions may come from 3rd parties and carry their own licensing
terms and are referenced where applicable.
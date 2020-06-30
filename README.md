How to Run
----------

Install [node js](https://nodejs.org). I think it comes with [npm](https://www.npmjs.com/) but you'll need that too.

Open the `server` folder and run

- `npm install`
	
- `node app.js` (or just `./run.sh` on linux and probably mac OS)

This serves the site on port 8000. Then you'll want something like [nginx](https://www.nginx.com/) to forward requests from ports 80 & 443 for http & https.

# Direct-ish Message #
this code is terrible and i'm quite ashamed to have written it :/


a quick explaination on how to run this
---
the `PORT` environment variable needs to be set to the port you want the webserver to listen on

the environment variable `OAUTH_CLIENT_SECRET` needs to be set to the client secret of your discord application

the `ADMIN_ID_LIST` needs to be set to an array of discord user IDs that should be given admin privelages 

you will also need to generate an OAuth2 URL (at https://discord.com/developers/applications/YOUR-APPLICATION-ID/oauth2) 
for login and replace it in `landing.html`, `landing.js`, and `server.js`.
![](https://traffic-tracker.isotach.repl.co/toastythetoaster/directishmessage-v1)

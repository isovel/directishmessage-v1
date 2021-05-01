const fetch = require('node-fetch');
const express = require('express');
const { port } = require('./config.json');
const clientID = process.env['client_id'];
const clientSecret = process.env['client_secret'];

const app = express();

app.get('/', async ({ query }, response) => {
	const { code } = query;

	if (code) {
		try {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: clientID,
					client_secret: clientSecret,
					code,
					grant_type: 'authorization_code',
					redirect_uri: 'https://discordavatar.isotach.repl.co',
					scope: 'identify',
				}),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			const oauthData = await oauthResult.json();

			const userResult = await (await fetch('https://discord.com/api/users/@me', {
				headers: {
					authorization: `${oauthData.token_type} ${oauthData.access_token}`,
				},
			})).json();
      
      return response.redirect(`https://cdn.discordapp.com/avatars/${userResult.id}/${userResult.avatar}.png?size=4096`);
		} catch (error) {
			// NOTE: An unauthorized token will not throw an error;
			// it will return a 401 Unauthorized response in the try block above
			console.error(error);
      return response.sendFile('error.html', { root: '.' });
		}
	}
  
  return response.sendFile('index.html', { root: '.' });
});

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
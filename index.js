//////////// Sector 0x0 ////////////

const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { clientID, messageLimit, port } = require('./config.json');
const clientSecret = process.env['OAUTH_CLIENT_SECRET'];
const pwd = process.env['ADMIN_AUTH_CODE'];
const admins = process.env['ADMIN_ID_LIST'];


//////////// Sector 0x1 ////////////

const app = express();
app.use(bodyParser.json());

const initialMessages = [
  {author: 'SYSTEM', content: 'Loaded!', timestamp: Date.now()}
];
let messages = initialMessages;

const getMessages = () => {
  slimArr = messages.slice(-messageLimit);
  stateStr = crypto.createHmac('sha256', slimArr.toString()).digest('hex');
  return {
    messages: slimArr,
    state: stateStr
  }
};


//////////// Sector 0x2 ////////////

const pages = {
  login: 'login.html',
  chat: 'chat.html',
};

const scripts = {
  login: 'login.js',
  chat: 'chat.js'
};

const styles = {
  login: 'login.css',
  chat: 'chat.css'
};


//////////// Sector 0x3 ////////////

app.get('/', async (request, response) => {
  const { code } = request.query;
  if (code) {
    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientID,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `https://${request.hostname}`,
          scope: 'identify',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      const oauthData = await oauthResult.json();
      const userResult = await (await fetch('https://discord.com/api/users/@me', {
        headers: {
          authorization: `${oauthData.token_type} ${oauthData.access_token}`,
        }
      })).json();
      const isAdmin = _ => {
        return userResult.id == 255515821541949440;
      }
      response.setHeader('Set-Cookie', `name=${userResult.username};id=${userResult.id}${isAdmin()?'; admin=true':''}`);
      return response.redirect('/chat');
    } catch (error) {
      // NOTE: An unauthorized token will not throw an error;
      // it will return a 401 Unauthorized response in the try block above
      console.error(error);
    }
  }
  return response.sendFile(pages['login'], { root: '.' });
});

app.get('/scripts/login', async ({}, response) => {
  return response.sendFile(scripts['login'], { root: '.' });
});

app.get('/styles/login', async ({}, response) => {
  return response.sendFile(styles['login'], { root: '.' });
});


//////////// Sector 0x4 ////////////

app.get('/chat', async ({}, response) => {
  return response.sendFile(pages['chat'], { root: '.' });
});

app.get('/scripts/chat', async ({}, response) => {
  return response.sendFile(scripts['chat'], { root: '.' });
});

app.get('/styles/chat', async ({}, response) => {
  return response.sendFile(styles['chat'], { root: '.' });
});


//////////// Sector 0x5 ////////////

app.get('/admins', async ({}, response) => {
  return response.send(admins);
});


//////////// Sector 0x6 ////////////

app.get('/messages', async ({}, response) => {
  return response.send(getMessages());
});

app.post('/messages', async ({ headers, body }, response) => {
  try {
    if (headers['content-type'] != 'application/json') {
      console.log('Sent response \'415\'.', headers, body);
      return response.sendStatus(415);
    }

    reqJSON = body;
    if (!reqJSON.author || !reqJSON.content || !reqJSON.timestamp) {
      console.log('Sent response \'400\'.', reqJSON);
      return response.sendStatus(400);
    }

    if ((
        reqJSON.content[0] == '/' &&
        (
          reqJSON.content != `/clear -${pwd}` &&
          !reqJSON.content.startsWith('/setname')
        )
      ) || (
        reqJSON.content.includes('<') &&
        reqJSON.content.includes('>')
    )){
      console.log('Sent response \'403\'.', reqJSON);
      return response.sendStatus(403);
    }

    if (reqJSON.content == `/clear -${pwd}`) {
      messages = [{author: 'SYSTEM', content: `${reqJSON.author} cleared all messages.`, timestamp: Date.now()}];
    } else {
      newMessage = {
        author: reqJSON.author,
        content: reqJSON.content,
        timestamp: reqJSON.timestamp
      };
      messages.push(newMessage);
    }

    console.log('Sent response \'200\'.', reqJSON);
    return response.send(getMessages());
  } catch (e) {
    console.error('Sent response \'500\'.', e);
    return response.sendStatus(500);
  }
});


//////////// Sector 0xF ////////////

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
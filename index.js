//////////// Sector 0x0 ////////////

const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const { messageLimit, port } = require('./config.json');
const clientID = process.env['client_id'];
const clientSecret = process.env['client_secret'];


//////////// Sector 0x1 ////////////

const app = express();
app.use(bodyParser.json());
let messages = [
  ['SYSTEM', 'Loaded!'],
  // ['Antelope', 'We\'re no strangers to love'],
  // ['Bison', 'You know the rules and so do I'],
  // ['Camel', 'A full commitment\'s what I\'m thinking of'],
  // ['Duck', 'You wouldn\'t get this from any other guy'],
  // ['Elephant', 'I just wanna tell you how I\'m feeling'],
  // ['Ferret', 'Gotta make you understand'],
  // ['Goldfish', 'Never gonna give you up'],
  // ['Hyena', 'Never gonna let you down'],
  // ['Iguana', 'Never gonna run around and desert you'],
  // ['Jaguar', 'Never gonna make you cry'],
  // ['Koala', 'Never gonna say goodbye'],
  // ['Lion', 'Never gonna tell a lie and hurt you'],
  // ['Antelope', 'We\'re no strangers to love'],
  // ['Bison', 'You know the rules and so do I'],
  // ['Camel', 'A full commitment\'s what I\'m thinking of'],
  // ['Duck', 'You wouldn\'t get this from any other guy'],
  // ['Elephant', 'I just wanna tell you how I\'m feeling'],
  // ['Ferret', 'Gotta make you understand'],
  // ['Goldfish', 'Never gonna give you up'],
  // ['Hyena', 'Never gonna let you down'],
  // ['Iguana', 'Never gonna run around and desert you'],
  // ['Jaguar', 'Never gonna make you cry'],
  // ['Koala', 'Never gonna say goodbye'],
  // ['Lion', 'Never gonna tell a lie and hurt you'],
  // ['Antelope', 'We\'re no strangers to love'],
  // ['Bison', 'You know the rules and so do I'],
  // ['Camel', 'A full commitment\'s what I\'m thinking of'],
  // ['Duck', 'You wouldn\'t get this from any other guy'],
  // ['Elephant', 'I just wanna tell you how I\'m feeling'],
  // ['Ferret', 'Gotta make you understand'],
  // ['Goldfish', 'Never gonna give you up'],
  // ['Hyena', 'Never gonna let you down'],
  // ['Iguana', 'Never gonna run around and desert you'],
  // ['Jaguar', 'Never gonna make you cry'],
  // ['Koala', 'Never gonna say goodbye'],
  // ['Lion', 'Never gonna tell a lie and hurt you'],
  // ['Antelope', 'We\'re no strangers to love'],
  // ['Bison', 'You know the rules and so do I'],
  // ['Camel', 'A full commitment\'s what I\'m thinking of'],
  // ['Duck', 'You wouldn\'t get this from any other guy'],
  // ['Elephant', 'I just wanna tell you how I\'m feeling'],
  // ['Ferret', 'Gotta make you understand'],
  // ['Goldfish', 'Never gonna give you up'],
  // ['Hyena', 'Never gonna let you down'],
  // ['Iguana', 'Never gonna run around and desert you'],
  // ['Jaguar', 'Never gonna make you cry'],
  // ['Koala', 'Never gonna say goodbye'],
  // ['Lion', 'Never gonna tell a lie and hurt you']
];
const getMessages = () => {
  return messages.slice(-messageLimit);
};


//////////// Sector 0x2 ////////////

const pages = {
  login: 'login.html',
  chat: 'chat.html'
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
          redirect_uri: 'https://directishmessage.isotach.repl.co',
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
      return response.redirect(`/chat?name=${userResult.username}`);
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

app.get('/chat', async ({ query }, response) => {
  const { name } = query;

  if (!name || name == '') {
    return response.sendFile(pages['login'], { root: '.' });
  }

  return response.sendFile(pages['chat'], { root: '.' });
});

app.get('/scripts/chat', async ({}, response) => {
  return response.sendFile(scripts['chat'], { root: '.' });
});

app.get('/styles/chat', async ({}, response) => {
  return response.sendFile(styles['chat'], { root: '.' });
});


//////////// Sector 0x5 ////////////

app.get('/messages', async ({}, response) => {
  return response.send(getMessages());
});

app.post('/messages', async ({ headers, body }, response) => {
  try {
    if (headers["content-type"] != 'application/json') {
      return response.sendStatus(415);
    }
    reqJSON = body;
    if (!reqJSON['username'] || !reqJSON['message']) {
      return response.sendStatus(400);
    }
    newMessage = [
      reqJSON['username'],
      reqJSON['message']
    ];
    messages.push(newMessage);
    return response.send(getMessages());
  } catch (e) {
    console.error(e);
    console.log(body);
    return response.sendStatus(500);
  }
});


//////////// Sector 0xF ////////////

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));
const username = window.location.search.replace(/\?name=/,'').replace(/%20/, ' ');
let messages = '';
let messagesX = '';
window.onload = () => {
  console.log('Loaded!');
  const updateMessages = (a, b) => {
    let messagesStr = '';
    a.json().then(c => {
      messagesX = messages;
      messages = c;
      messages[messages.length-1] = [messages[messages.length-1][0], messages[messages.length-1][1], true];
      if (messages === messagesX) {
        return;
      }
      messages.forEach(v => {
        if (v[2]) {
          messagesStr += `<div id="newest" class="message"><span class="message-user">${v[0]}</span> <span class="message-content">${v[1]}</span></div>`;
        } else {
          messagesStr += `<div class="message"><span class="message-user">${v[0]}</span> <span class="message-content">${v[1]}</span></div>`;
        }
      });
      document.querySelector('.message-container').innerHTML = messagesStr;
      document.querySelector('#newest').scrollIntoView();
      if (b) {
        document.querySelector('.textbox').value = '';
      }
    });
  }

  let interval ='';
  try {
    interval = setInterval(() => {
      fetch('https://directishmessage.isotach.repl.co/messages').then(a => { updateMessages(a, false); });
    }, 1000 * 1);
  } catch (e) {
    console.error(e);
  }

  let textbox = document.querySelector('.textbox');
  textbox.addEventListener('keydown', (event) => {
    console.log('Some key pressed!');
    if (event.defaultPrevented) {
      console.log('The event was already handled!');
      return; // Do nothing if event already handled
    }
    if (event.code === 'Enter') {
      console.log('It was the enter key!');
      try {
        let msg = {
          username: username,
          message: textbox.value
        };
        fetch('https://directishmessage.isotach.repl.co/messages', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(msg)
        }).then(a => { updateMessages(a, true); });
      } catch (e) {
        console.error(e);
      }
    }
  }, false);
};
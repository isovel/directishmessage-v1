window.onload = () => {
  console.debug('Loaded!');
  const username = window.location.search.replace(/\?name=/,'').replace(/%20/, ' ');
  // let notificationSound = new Audio('https://discord.com/assets/dd920c06a01e5bb8b09678581e29d56f.mp3');
  let messages = '';
  let lastState = '';
  // let isFocused = true;
  // document.addEventListener("visibilitychange", () => { isFocused = !isFocused; console.log(isFocused); });
  const generateRandomString = () => {
    let randomString = '';
    const randomNumber = Math.floor(Math.random() * 10);
    for (let i = 0; i < 20 + randomNumber; i++) {
      randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
    }
    return randomString;
  };
  const updateMessages = (a, b) => {
    let messagesStr = '';
    a.json().then(c => {
      messages = c['messages'];
      messages[messages.length-1] = [messages[messages.length-1][0], messages[messages.length-1][1], true];
      if (lastState == c['state']) {
        console.debug('No changes; Returning!');
        return false;
      } else {
        lastState = c['state'];
      }
      messages.forEach(v => {
        if (v[2]) {
          messagesStr += `<div id="newest" class="message"><span class="message-user">${v[0]}</span><span class="message-content">${v[1]}</span></div>`;
        } else {
          messagesStr += `<div class="message"><span class="message-user">${v[0]}</span><span class="message-content">${v[1]}</span></div>`;
        }
      });
      document.querySelector('.message-container').innerHTML = messagesStr;
      document.querySelector('#newest').scrollIntoView();
      if (b) {
        document.querySelector('.textbox').value = '';
        // if (!isFocused) {
        //   notificationSound.play();
        // }
      }
    });
  };
  const sendMessage = messageObject => {
    try {
        fetch('https://dm.isota.ch/messages', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageObject)
        }).then(a => { updateMessages(a, true); });
      } catch (e) {
        console.error(e);
      }
  };

  let interval ='';
  try {
    interval = setInterval(() => {
      fetch('https://dm.isota.ch/messages').then(a => { updateMessages(a, false); });
    }, 1000 * 1);
  } catch (e) {
    console.error(e);
  }

  let textbox = document.querySelector('.textbox');
  textbox.addEventListener('keydown', (event) => {
    console.debug('Key pressed!');
    if (event.defaultPrevented) {
      console.debug('The event was already handled!');
      return;
    }
    if (event.code === 'Enter') {
      console.debug('Send!');
      let msg = {
        username: username,
        message: textbox.value
      };
      sendMessage(msg);
    }
  }, false);
};
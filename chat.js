window.onload = () => {
  console.debug('Loaded!');
  if (!window.location.search && !document.cookie.split(';').some((item) => item.trim().startsWith('name='))) {
    document.cookie = 'name=Anonymous User';
  }
  // if (document.cookie.split(';').some((item) => item.trim().startsWith('admin='))) {
  //   const admin = document.cookie.split(';').find(row => row.startsWith('admin=')).split('=')[1]
  // }
  const username = document.cookie.split(';').find(row => row.startsWith('name=')).split('=')[1];
  let messages = '';
  let lastState = '';
  const updateMessages = (a, b) => {
    let messagesStr = '';
    a.json().then(c => {
      if (lastState == c['state']) {
        console.debug('No changes; Returning!');
        return false;
      } else {
        lastState = c['state'];
      }
      messages = c['messages'];
      messages[messages.length-1]['newest'] = true;
      messages.forEach(v => {
        if (v['newest']) {
          messagesStr += `<div id="newest" class="message"><span class="message-author">${v['author']}</span><span class="message-content">${v['content']}</span></div>`;
        } else {
          messagesStr += `<div class="message"><span class="message-author">${v['author']}</span><span class="message-content">${v['content']}</span></div>`;
        }
      });
      document.querySelector('.message-container').innerHTML = messagesStr;
      document.querySelector('#newest').scrollIntoView();
      if (b) {
        document.querySelector('.textbox').value = '';
      }
    });
  };
  const sendMessage = messageObject => {
    messageObject.timestamp = Date.now();
    try {
        fetch('/messages', {
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
      fetch('/messages').then(a => { updateMessages(a, false); });
    }, 1000 * 1);
  } catch (e) {
    console.error(e);
  } finally {
    let msg = {
        author: 'SYSTEM',
        content: `${username} joined the chatroom.`
      };
      sendMessage(msg);
  }

  let textbox = document.querySelector('.textbox');
  textbox.addEventListener('keydown', (event) => {
    console.debug('Key pressed!');
    if (event.defaultPrevented) {
      console.debug('The event was already handled!');
      return;
    }
    if (event.code === 'Enter') {
      console.debug('Sending!');
      let msg = {
        author: username,
        content: textbox.value
      };
      sendMessage(msg);
    }
  }, false);
};
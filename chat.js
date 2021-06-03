window.onload = _ => {
  console.debug('Loaded!');

  if (window.location.host != 'dm.isota.ch') {
    document.querySelector('html').classList.add('development');
  }

  if (!document.cookie.split(';').some((item) => item.trim().startsWith('name='))) {
    document.cookie = 'name=Anonymous User';
  }

  // if (document.cookie.split(';').some((item) => item.trim().startsWith('admin='))) {
  //   const admin = document.cookie.split(';').find(row => row.startsWith('admin=')).split('=')[1]
  // }

  let username = document.cookie.split(';').find(row => row.startsWith('name=')).split('=')[1];
  const updateUsername = _ => {
    let currentName = username;
    let nameCookie = document.cookie.split(';').find(row => row.startsWith('name=')).split('=')[1];
    if (currentName != nameCookie) {
      username = nameCookie;
      window.location.reload();
    }
  };
  let messages = '';
  let lastState = '';

  const updateMessages = (a, b) => {
    try {
      if (a.headers.get('should-update-name')) {
        updateUsername();
      }
      let messagesStr = '';
      a.json().then(c => {
        if (lastState == c.state) {
          console.debug('No changes; Returning!');
          return false;
        } else {
          lastState = c.state;
        }
        messages = c.messages;
        messages[messages.length-1].special = 'newest';
        messages[0].special = 'oldest';
        messages.forEach(v => {
          messagesStr += `<div ${v.special ? 'id="' + v.special + '" ' : ''}class="message ${v.system ? 'system-message' : ''}"><span class="message-author" title="${v.timestamp}">${v.author}</span><span class="message-content">${v.content}</span></div>`;
        });
        document.querySelector('.message-container').innerHTML = messagesStr;
        if (b) {
          document.querySelector('.textbox').value = '';
        }
        if (messages.length > 1) {
          document.querySelector('#newest').scrollIntoView();
        }
      });
    } catch (e) {
      console.error(e);
    }
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
    if (event.code === 'Enter' && textbox.value != '') {
      console.debug('Sending!');
      let msg = {
        author: username,
        content: textbox.value
      };
      sendMessage(msg);
    }
  }, false);
};

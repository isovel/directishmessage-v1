window.onload = _ => {
  console.debug('Loaded!');

  const hasCookie = (name) => {
    return document.cookie.split(';').some((item) => item.trim().startsWith(`${name}=`));
  }
  const getCookie = (name) => {
    return document.cookie.split(';').find(row => row.trim().startsWith(`${name}=`)).split('=')[1];
  }

  if (window.location.host != 'dm.isota.ch') {
    document.querySelector('html').classList.add('development');
  }

  if (!hasCookie('name')) {
    document.cookie += 'name=Anonymous User';
  }

  if (!hasCookie('flags')) {
    document.cookie += 'flags=0';
  }

  let username = getCookie('name');
  let flags = getCookie('flags');
  const hasFlag = (flag) => {
    switch((flags >> flag) % 2) {
      case 1:
        return true;
        break;
      case 2:
      default:
        return false;
        break;
    }
  };
  const updateUserFlags = (noReload = false) => {
    let currentFlags = flags;
    let flagCookie = getCookie('flags');
    if (currentFlags != flagCookie) {
      flags = flagCookie;
      if (noReload) window.location.reload();
      return true;
    } else {
      return false;
    }
  };
  const updateUsername = (noReload = false) => {
    let currentName = username;
    let nameCookie = getCookie('name');
    if (currentName != nameCookie) {
      username = nameCookie;
      if (noReload) window.location.reload();
      return true;
    } else {
      return false;
    }
  };
  const updateAll = _ => {
    if (updateUserFlags(true) || updateUsername(true)) window.location.reload();
  };
  let messages = '';
  let lastState = '';

  const updateMessages = (a, b) => {
    try {
      if (a.headers.get('should-update-name')) {
        updateUsername();
      } 
      if (a.headers.get('should-update')) {
        updateAll();
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
          messagesStr += `<div ${v.special ? 'id="' + v.special + '" ' : ''}class="message${v.system?' system-message':''}${v.admin?' admin-message':''}"><span class="message-author" title="${v.timestamp}">${v.author}</span><span class="message-content">${v.content}</span></div>`;
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
    if (hasFlag(0) && !messageObject.system) messageObject.admin = true;
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
        content: `${username} joined the chatroom.`,
        timestamp: Date.now(),
        system: true
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

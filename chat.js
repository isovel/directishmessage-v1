window.onload = () => {
  console.debug('Loaded!');

  const hasCookie = (name) => {
    let exists = document.cookie.split(';').some((item) => item.trim().startsWith(`${name}=`));
    let isSet = false;
    if (exists) isSet = document.cookie.split(';').find(row => row.trim().startsWith(`${name}=`)).split('=')[1] !== '';
    return (exists && isSet);
  }

  const getCookie = (name) => {
    if (!hasCookie(name)) return false;
    return document.cookie.split(';').find(row => row.trim().startsWith(`${name}=`)).split('=')[1];
  }

  if (window.location.host != 'dm.isota.ch') {
    document.querySelector('html').classList.add('development');
  }

  // Handled server-side
  //
  // if (!hasCookie('name') || !hasCookie('flags')) {
  //   window.location.replace('/');
  // }

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
  const updateUserFlags = (shouldReload = false) => {
    let currentFlags = flags;
    let flagCookie = getCookie('flags');
    if (currentFlags != flagCookie) {
      flags = flagCookie;
      if (shouldReload) window.location.reload();
      return true;
    } else {
      return false;
    }
  };
  const updateUsername = (shouldReload = false) => {
    let currentName = username;
    let nameCookie = getCookie('name');
    if (currentName != nameCookie) {
      username = nameCookie;
      if (shouldReload) window.location.reload();
      return true;
    } else {
      return false;
    }
  };
  const updateAll = () => {
    if (updateUserFlags() || updateUsername()) window.location.reload();
  };
  let messages = '';
  let lastState = '';

  const updateMessages = (a, b) => {
    try {
      // Server shouldn't ever send this header
      //
      // if (a.headers.get('X-Should-Update-Name')) {
      //   updateUsername();
      // } 
      if (a.headers.get('X-Should-Update')) {
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
      if (textbox.value.startsWith('/')) {
        switch(textbox.value.split(' ')[0]) {
          case '/nick':
          case '/nickname':
          case '/setname':
            let val = textbox.value.split(' ').slice(1).join(' ');
            document.cookie = `name=${val}`;
            updateUsername(true);
            return;
            break;
          default:
            break;
        }
      }
      let msg = {
        author: username,
        content: textbox.value
      };
      sendMessage(msg);
    }
  }, false);
};

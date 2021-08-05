if (typeof Element.prototype.clearChildren === 'undefined') {
  Object.defineProperty(Element.prototype, 'clearChildren', {
    configurable: true,
    enumerable: false,
    value: function() {
      while (this.firstChild) this.removeChild(this.lastChild);
    }
  });
}

const Utils = {
  getWeekday: weekday => {
    return {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday'
    }[weekday];
  },
  getMonth: month => {
    return {
      1: 'January',
      2: 'February',
      3: 'March',
      4: 'April',
      5: 'May',
      6: 'June',
      7: 'July',
      8: 'August',
      9: 'September',
      10: 'October',
      11: 'November',
      12: 'December'
    }[month];
  }
};

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

  // Handled server-side, as it should have been in the fist place
  //
  // if (!hasCookie('name') || !hasCookie('flags')) {
  //   window.location.replace('/');
  // }

  let username = getCookie('name');
  let flags = getCookie('flags');
  const hasFlag = (flag) => {
    switch ((flags >> flag) % 2) {
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

  const updateMessages = (a, b) => {
    try {
      // Server shouldn't ever send this header, but it used to because i'm stupid :^)
      //
      // if (a.headers.get('X-Should-Update-Name')) {
      //   updateUsername();
      // } 
      if (a.headers.get('X-Should-Update')) {
        updateAll();
      }
      a.json().then(c => {
        let containerElement = document.querySelector('.message-container');
        containerElement.clearChildren();
        messages = c.messages;
        messages[messages.length - 1].special = 'newest';
        messages[0].special = 'oldest';
        messages.forEach(v => {
          let date = new Date(v.timestamp);
          let weekday = Utils.getWeekday(date.getDay());
          let month = Utils.getMonth(date.getMonth());
          let day = date.getDate();
          let year = date.getFullYear();
          let hours = date.getHours();
          let minutes = ('0'.concat(date.getMinutes())).substr(-2);
          let seconds = ('0'.concat(date.getSeconds())).substr(-2);
          let meridian = 'AM';
          hours >= 12 && (meridian = 'PM');
          hours > 12 && (hours -= 12);
          let timestamp = `${weekday}, ${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${meridian}`;

          let messageElement = document.createElement('div');
          messageElement.className = 'message';
          v.special && (messageElement.id = v.special);
          v.system && messageElement.classList.add('system-message');
          v.admin && messageElement.classList.add('admin-message');

          let messageAuthorElement = document.createElement('span');
          messageAuthorElement.className = 'message-author';
          messageAuthorElement.title = timestamp;
          messageAuthorElement.innerText = decodeURIComponent(v.author);

          let messageContentElement = document.createElement('span');
          messageContentElement.className = 'message-content';
          messageContentElement.innerText = v.content;

          messageElement.appendChild(messageAuthorElement);
          messageElement.appendChild(messageContentElement);
          containerElement.appendChild(messageElement);
        });
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

  sendMessage = messageObject => {
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

  const webSocket = new WebSocket(`wss://${document.location.host}`);

  webSocket.onopen = (event) => {
    webSocket.send(JSON.stringify({ type: 1, data: { username: username } }));
  };

  webSocket.onmessage = (event) => {
    const dataObj = JSON.parse(event.data);
    console.log('[WSS] Recieved message: ', dataObj);
    if (dataObj && dataObj.type) {
      if (dataObj.type % 2 === 1) {
        webSocket.send(JSON.stringify({ type: 3, data: { message: 'This message type is reserved for client use only.' } }));
      } else {
        switch (dataObj.type) {
          case 2:
            console.log('[WSS] Error: ' + dataObj.data.message);
            break;
          case 4:
            fetch(`https://${document.location.host}/messages`).then(a => { updateMessages(a, false); });
            break;
          default:
            webSocket.send(JSON.stringify({ type: 3, data: { message: `Unknown message type '${dataObj.type}'` } }));
            break;
        }
      }
    } else {
      webSocket.send(JSON.stringify({ type: 3, data: { message: 'Unsupported data structure used. Structure {type: number, data: object} expected.' } }));
    }
  };

  webSocket.onclose = (event) => {
    window.location.reload();
  };

  let msg = {
    author: 'SYSTEM',
    content: `${decodeURIComponent(username)} joined the chatroom.`,
    timestamp: Date.now(),
    system: true
  };
  sendMessage(msg);

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
        switch (textbox.value.split(' ')[0]) {
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

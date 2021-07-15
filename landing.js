window.onload = () => {
  const hasCookie = (name) => {
    let exists = document.cookie.split(';').some((item) => item.trim().startsWith(`${name}=`));
    let isSet = false;
    if (exists) isSet = (document.cookie.split(';').find(row => row.trim().startsWith(`${name}=`)).split('=')[1].trim() !== '');
    console.warn(isSet);
    return (exists && isSet);
  }

  if (hasCookie('name') && hasCookie('flags')) {
    window.location.replace('/chat');
  }

  if (window.location.host != 'dm.isota.ch') {
    let el = document.getElementById('login');
    el.href = 'https://discord.com/api/oauth2/authorize?client_id=837869684706639902&redirect_uri=https%3A%2F%2Fdev.dm.isota.ch&response_type=code&scope=identify&prompt=none';
    document.querySelector('.main-container').classList.add('development');
  }

  const generateRandomString = () => {
    let randomString = '';
    const randomNumber = Math.floor(Math.random() * 10);
    for (let i = 0; i < 20 + randomNumber; i++) {
      randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
    }
    return randomString;
  }

  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const [accessToken, tokenType, state] = [fragment.get('access_token'), fragment.get('token_type'), fragment.get('state')];

  if (!accessToken) {
    const randomString = generateRandomString();
    localStorage.setItem('oauth-state', randomString);

    document.getElementById('login').href += `&state=${encodeURIComponent(btoa(randomString))}`;
  }

  if (localStorage.getItem('oauth-state') !== atob(decodeURIComponent(state))) {
    return console.log('You may have been click-jacked!');
  }
}

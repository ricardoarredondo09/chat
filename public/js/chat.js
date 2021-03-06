const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");
const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const chatWith = get(".chatWith");
const chatStatus = get(".chatStatus");
const typing = get(".typing");
const chatId = window.location.pathname.substr(6);
let authUser;
window.onload = function () {

  axios.get('/auth/user')
  .then( res => {

    authUser = res.data.authUser;

  }).then(() => {

    axios.get(`/chat/${chatId}/get_users`).then( res => {
      let results = res.data.users.filter( user => user.id != authUser.id);

      if(results.length > 0)
        chatWith.innerHTML = results[0].name;

    });

  }).then(() => {

    axios.get(`/chat/${chatId}/get_messages`).then(res => {
      console.log(res);
      appendMessages(res.data.messages);

    });

  })
}

msgerForm.addEventListener("submit", event => {

    event.preventDefault();

    const msgText = msgerInput.value;

    if (!msgText) return;


    axios.post('/message/sent', {
      message: msgText,
      chat_id: chatId
    }).then(res => {
      let data = res.data;

      appendMessage(data.user.name, PERSON_IMG, 'right', data.content, formatDate(new Date(data.created_at)) );
    }).catch(error => {
      console.log('A ocurriodo un error');
      console.log(error)
    })

    msgerInput.value = "";

});

function appendMessage(name, img, side, text) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  scrollToBottom();
}

function scrollToBottom()
{
    msgerChat.scrollTop = msgerChat.scrollHeight;
}
Echo.join(`chat.${chatId}`)
  .listen('MessageSent', (e) => {
    let message = e.message;
    appendMessage(message.user.name, PERSON_IMG, 'left', message.content, formatDate(new Date(message.created_at)) );
  }).here((users) => {

    let result = users.filter(user => user.id != authUser.id);

        if(result.length > 0)
            chatStatus.className = 'chatStatus online';

}).joining((user) => {

    if(user.id != authUser.id)
        chatStatus.className = 'chatStatus online';

}).leaving((user) => {

    if(user.id != authUser.id)
        chatStatus.className = 'chatStatus offline';

}).listenForWhisper('typing', (e) => {

     if(e > 0)
        typing.style.display = '';

    typingTimer = setTimeout( () => {

        typing.style.display = 'none';

    }, 3000);

});

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
    const d = date.getDate();
    const mo = date.getMonth() + 1;
    const y = date.getFullYear();
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();
    return `${d}/${mo}/${y} ${h.slice(-2)}:${m.slice(-2)}`;
}

function appendMessages(messages) {

    let side = 'left';

    messages.forEach(message => {

        side = (message.user_id == authUser.id) ? 'right' : 'left';

        appendMessage(
            message.user.name,
            PERSON_IMG,
            side,
            message.content,
            formatDate(new Date(message.created_at)))

    });

}
function sendTypingEvent() {

    Echo.join(`chat.${chatId}`).whisper('typing', msgerInput.value.length);

}
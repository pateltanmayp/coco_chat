const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
let username;
const roomList = document.getElementById('rooms');
const userNameField = document.getElementById('user-name')
const socket = io();

var jQueryScript = document.createElement('script');  
jQueryScript.setAttribute('src','https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js');
document.head.appendChild(jQueryScript);

socket.emit('joinApp');

// Document setup
$.ajax({url: '/doc_setup'}).done(data => {
    console.log(data)
    outputUsername(data.username);
    outputRooms(data.rooms);
});

socket.on('message', (message) => {
    outputMessage(message);
  
    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
  
    // Get message text
    let msg = e.target.elements.msg.value;
    msg = msg.trim();
  
    if (!msg) {
      return false;
    }
  
    // Emit message to server
    socket.emit('chatMessage', msg);
  
    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    const p = document.createElement('p');
    p.classList.add('meta');
    p.innerText = message.username;
    p.innerHTML += `<span>${message.time}</span>`;
    div.appendChild(p);
    const para = document.createElement('p');
    para.classList.add('text');
    para.innerText = message.text;
    div.appendChild(para);
    document.querySelector('.chat-messages').appendChild(div);
}

function outputRooms(rooms) {
    roomList.innerHTML = '';
    rooms.forEach((room) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.innerText = room;
      li.appendChild(a);
      roomList.appendChild(li);

      a.addEventListener('click', () => {
        document.querySelector('.chat-messages').innerHTML = '';
        $.ajax({url: '/room_setup/' + room, async: false}).done(msgs => {
            console.log(msgs);
            msgs.forEach(msg => {
                outputMessage(msg);
            });
        });
        socket.emit('joinRoom', room);
      });
    });
}

function outputUsername(username) {
    userNameField.innerHTML = 'Welcome ' + username + '!';
}

document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  
    if (leaveRoom) {
        const Http = new XMLHttpRequest();
        const url = '/chat';
        Http.open("GET", url);
        Http.send();

        Http.onreadystatechange=(e) => {
            console.log(Http.responseText);
        }
    }
});
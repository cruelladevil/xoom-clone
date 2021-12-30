const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const nickNameForm = welcome.querySelector("#nickname");
const roomNameForm = welcome.querySelector("#roomname");
const messageForm = room.querySelector("#message");

room.style.display = "none";
let roomName;

function addMessage(msg) {
  const messageList = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  messageList.appendChild(li);
}

function showRoom(newCount) {
  welcome.style.display = "none";
  room.style.display = "block";
  changeRoomTitle(newCount);
}

function changeRoomTitle(newCount) {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName} (${newCount})`;
}

function handleNickSubmit(event) {
  event.preventDefault();
  const input = nickNameForm.querySelector("input");
  const h3 = nickNameForm.querySelector("h3");
  h3.innerText = `nickname: ${input.value}`;
  socket.emit("nickname", input.value);
  input.value = "";
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value} `);
  });
  input.value = "";
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = roomNameForm.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

nickNameForm.addEventListener("submit", handleNickSubmit);
roomNameForm.addEventListener("submit", handleRoomSubmit);
messageForm.addEventListener("submit", handleMessageSubmit);
socket.on("welcome", (nickName, newCount) => {
  changeRoomTitle(newCount);
  addMessage(`${nickName} joined!`);
});
socket.on("bye", (nickName, newCount) => {
  changeRoomTitle(newCount);
  addMessage(`${nickName} left!`);
});
socket.on("new_message", addMessage);
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  })
})

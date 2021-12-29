const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const welcomeForm = welcome.querySelector("form");
const roomForm = room.querySelector("form");

room.style.display = "none";
let roomName;

function addMessage(msg) {
  const messageList = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  messageList.appendChild(li);
}

function showRoom() {
  welcome.style.display = "none";
  room.style.display = "block";
  let h3 = room.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;
}

function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleRoomSubmit);
roomForm.addEventListener("submit", handleMessageSubmit);
socket.on("welcome", () => addMessage("someone joined!"));
socket.on("bye", () => addMessage("someone left!"));
socket.on("new_message", addMessage);

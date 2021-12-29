const socket = io();

const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const form = welcome.querySelector("form");

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

function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
socket.on("welcome", () => addMessage("someone joined!"));

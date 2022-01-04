const socket = io();

const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const cameraSelect = document.getElementById("cameraSelect");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const welcomeForm = welcome.querySelector("form");
const chat = document.getElementById("chat");
const chatForm = chat.querySelector("form");
const disconnectButton = document.getElementById("disconnectButton");

let myStream = null;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    })
  } catch (err) {
    console.error(err);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    if (!deviceId) {
      myStream = await navigator.mediaDevices.getUserMedia(initialConstraints);
      await getCameras();
    } else {
      myStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
    }
    myFace.srcObject = myStream;
  } catch (err) {
    console.error(err);
  }
}

function addMessage(msg) {
  const messageList = chat.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  messageList.appendChild(li);
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muted = true;
    muteButton.innerText = "Unmute";
  } else {
    muted = false;
    muteButton.innerText = "Mute";
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!cameraOff) {
    cameraOff = true;
    cameraButton.innerText = "Turn Camera On";
  } else {
    cameraOff = false;
    cameraButton.innerText = "Turn Camera Off";
  }
}

async function handleCameraChange() {
  await getMedia(cameraSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  roomName = input.value;
  await initCall();
  socket.emit("join_room", input.value);
  input.value = "";
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  const value = input.value;
  addMessage(`You: ${value}`);
  myDataChannel.send(input.value);
  input.value = "";
}

function initWelcome() {
  welcome.style.display = "block";
  call.style.display = "none";
  welcomeForm.addEventListener("submit", handleWelcomeSubmit);
}

async function initCall() {
  welcome.style.display = "none";
  call.style.display = "block";
  const h3 = chat.querySelector("h3");
  h3.innerText = `Room: ${roomName}`;
  muteButton.addEventListener("click", handleMuteClick);
  cameraButton.addEventListener("click", handleCameraClick);
  cameraSelect.addEventListener("input", handleCameraChange);
  chatForm.addEventListener("submit", handleChatSubmit);
  await getMedia();
  makeConnection();
}

initWelcome();

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.onmessage = function (event) {
    addMessage(event.data);
  }
  myDataChannel.onopen = function (event) {
    disconnectButton.addEventListener("click", myDataChannel.onclose);
  }
  myDataChannel.onclose = function (event) {
    myDataChannel.close();
    myPeerConnection.close();
    socket.emit("leave_room", roomName);
  }
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.onopen = function (event) {
      disconnectButton.addEventListener("click", myDataChannel.onclose);
    }
    myDataChannel.onmessage = function (event) {
      addMessage(event.data);
    }
    myDataChannel.onclose = function (event) {
      myDataChannel.close();
      myPeerConnection.close();
    }
  });
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("candidate", (candidate) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(candidate);
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIceCandidate(data) {
  console.log("sent candidate");
  socket.emit("candidate", data.candidate, roomName);
}

function handleAddStream(data) {
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
}

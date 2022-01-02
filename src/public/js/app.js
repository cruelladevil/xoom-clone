const socket = io();

const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const cameraSelect = document.getElementById("cameraSelect");
const welcome = document.getElementById("welcome");
const call = document.getElementById("call");
const welcomeForm = welcome.querySelector("form");

let myStream = null;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

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

async function handleCameraSelect() {
  await getMedia(cameraSelect.value);
}

function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  socket.emit("join_room", input.value, startMedia);
  roomName = input.value;
  input.value = "";
}

function init() {
  welcome.style.display = "block";
  call.style.display = "none";
}

async function startMedia() {
  welcome.style.display = "none";
  call.style.display = "block";
  await getMedia();
  makeConnection();
}

init();
muteButton.addEventListener("click", handleMuteClick);
cameraButton.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraSelect);
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

socket.on("offer", (offer) => {
  console.log(offer);
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

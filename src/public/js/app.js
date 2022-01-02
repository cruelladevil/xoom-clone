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
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
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
  muteButton.addEventListener("click", handleMuteClick);
  cameraButton.addEventListener("click", handleCameraClick);
  cameraSelect.addEventListener("input", handleCameraChange);
  await getMedia();
  makeConnection();
}

initWelcome();

socket.on("welcome", async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
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
  myPeerConnection = new RTCPeerConnection();
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

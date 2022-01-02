const socket = io();

const myFace = document.getElementById("myFace");
const muteButton = document.getElementById("mute");
const cameraButton = document.getElementById("camera");
const cameraSelect = document.getElementById("cameraSelect");

let myStream = null;
let muted = false;
let cameraOff = false;

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

getMedia();
muteButton.addEventListener("click", handleMuteClick);
cameraButton.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraSelect);

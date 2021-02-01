'use strict';

/*
 Few comments:
 This was developed in 15 hours. For the sake of following the instructions and keeping things simple I didn't use a front-end framework.
 I also didn't use sass or less, minify and other modules that would be used in production.
 Its a single peer to peer example. the IceServers are setup with google stun:stun.l.google.com:19302 and not fully tested.
 This has been tested with ios safari 14.4, osx safari 14.0.2 and osx chrome 88.0.4324.96.
 There are several caveats that are not handled. Including, signaling that handles multiple remote connections.
 Handeling errors with video calls made when only one browser is connected then trying to open the second browser window and connecting.
*/

import './styles.css';

// browser dependent definition are aligned to one and the same standard name *
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition
  || window.msSpeechRecognition || window.oSpeechRecognition;


function component() {
  const element = document.createElement('div');
  return element;
}

const config = {
  wssHost: 'wss://192.168.0.194/myWebSocket'
};

const constraints = {
  'video': true,
  'audio': true
};

let localVideoStream = null,
  callButton = null,
  endButton = null,
  localVideo = null,
  remoteVideo = null;

let peerConn = null, sender,
  wsc = new WebSocket(config.wssHost),
  peerConnCfg = {
    iceServers:
      [{'urls': 'stun:stun.l.google.com:19302'}]
  };

// check browser WebRTC resources not handled for all browsers.
if (true) {
  callButton = document.getElementById("callButton");
  endButton = document.getElementById("endButton");
  localVideo = document.getElementById('localVideo');
  remoteVideo = document.getElementById('remoteVideo');
  callButton.removeAttribute("disabled");
  callButton.addEventListener("click", initiateCall);
  endButton.addEventListener("click", function (evt) {
    endCall();
    wsc.send(JSON.stringify({"closeConnection": true}))
  });
} else {
  alert("Sorry, no browser WebRTC support!")
}

function prepareCall() {
  peerConn = new RTCPeerConnection(peerConnCfg);
  // send any ice candidates to the other peer
  peerConn.onicecandidate = onIceCandidateHandler;
  // once remote stream arrives, show it in the remote video element
  peerConn.ontrack = onAddStreamHandler
}

// run start(true) to initiate a call
function initiateCall() {
  prepareCall();
  // get the local stream, show it in the local video element and send it
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    localVideoStream = stream;
    localVideo.srcObject = localVideoStream;
    localVideoStream.getTracks().forEach(track => peerConn.addTrack(track, localVideoStream));
    // console.log('Got track:', localVideoStream.getTracks());
    createAndSendOffer()
  })
    .catch(error => {
      console.error('Error accessing media devices.', error)
    })
}

function answerCall() {
  prepareCall();
  // get the local stream, show it in the local video element and send it
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    localVideoStream = stream;
    localVideo.srcObject = localVideoStream;
    localVideoStream.getTracks().forEach(track => peerConn.addTrack(track, localVideoStream));
    // console.log('Got track:', localVideoStream.getTracks());
    createAndSendAnswer()
  })
    .catch(error => {
      console.error('Error accessing media devices.', error)
    })
}


wsc.onmessage = function (evt) {
  var signal = null;
  if (!peerConn) answerCall();
  signal = JSON.parse(evt.data);

  if (peerConn.connectionState == 'closed') {
    prepareCall();
  }

  if (signal.sdp) {
    console.log("Received SDP from remote peer.", peerConn);
    peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp))
  }
  else if (signal.candidate) {
    console.log("Received ICECandidate from remote peer.");
    peerConn.addIceCandidate(new RTCIceCandidate(signal.candidate))
  } else if (signal.closeConnection) {
    console.log("Received 'close call' signal from remote peer.");
    endCall()
  }
};


function createAndSendOffer() {

  peerConn.createOffer().then(function (offer) {

    var o = new RTCSessionDescription(offer);
    peerConn.setLocalDescription(o);
    return o;
  })
    .then(function (off) {
      console.log('createAndSendOffer3 :', off);
      wsc.send(JSON.stringify({"sdp": off}));

    })
    .catch(function (error) {
      console.log('error', error);
    })

}

function createAndSendAnswer() {

  peerConn.createAnswer().then(function (answer) {
    var ans = new RTCSessionDescription(answer);
    peerConn.setLocalDescription(ans);
    return ans;
  }).then(function (answ) {
    // Send the answer to the remote peer through the signaling server.
    wsc.send(JSON.stringify({"sdp": answ}))
  }).catch(function (error) {
    console.log('errorAns', error);
  })

}

function onIceCandidateHandler(evt) {
  if (!evt || !evt.candidate) return;
  wsc.send(JSON.stringify({"candidate": evt.candidate}));
}

function onAddStreamHandler(evt) {
  callButton.setAttribute("disabled", true);
  endButton.removeAttribute("disabled");
  // set remote video stream as source for remote video HTML5 element
  remoteVideo.srcObject = evt.streams[0];
}

function endCall() {
  callButton.removeAttribute("disabled");
  endButton.setAttribute("disabled", true);
  const mediaStream = localVideo.srcObject;
  const tracks = mediaStream.getTracks();
  tracks.forEach(track => track.stop());
  peerConn = null;
  if (remoteVideo) remoteVideo.srcObject = null;
  if (localVideo) localVideo.srcObject = null;
}


document.body.appendChild(component());

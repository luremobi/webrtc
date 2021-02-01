### WebRTC-Video Chat Web App
A single peer to peer WebRTC example. the IceServers are setup with google stun:stun.l.google.com:19302 and not fully tested.

### Install
You will need to add the self signed certification to your machine.
npm install
node server.js
https://localhost

### Comments:
For the sake of following the instructions and keeping things simple I didn't use a front-end framework.
I also didn't use sass or less, minify and other modules that would be used in production.
This has been tested with ios safari 14.4, osx safari 14.0.2 and osx chrome 88.0.4324.96.There are several caveats that are not handled.
Including, signaling that handles multiple remote connections.
Along with errors with video calls made when only one browser is connected then trying to open the second browser window and connecting in either direction.

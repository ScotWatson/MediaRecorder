/*
(c) 2022 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

const initPageTime = performance.now();

const loadWindow = new Promise(function (resolve, reject) {
  window.addEventListener("load", function (evt) {
    resolve(evt);
  });
});

const loadErrorLogModule = (async function () {
  try {
    const module = await import("https://scotwatson.github.io/Debug/ErrorLog.mjs");
    return module;
  } catch (e) {
    console.error(e);
  }
})();

(async function () {
  try {
    const modules = await Promise.all( [ loadWindow, loadErrorLogModule ] );
    start(modules);
  } catch (e) {
    console.error(e);
  }
})();

class Averager {
  #array;
  constructor(length) {
    this.#array = new Array(length);
    for (let i = 0; i < length; ++i) {
      this.#array[i] = 0;
    }
  }
  sample(value) {
    this.#array.shift();
    this.#array.push(value);
    let ret = 0;
    for (let i = 0; i < this.#array.length; ++i) {
      ret += this.#array[i];
    }
    ret /= this.#array.length;
    return ret;
  }
}

let divMediaDeviceInfo;
let divMediaStreamInfo;

async function start( [ evtWindow, ErrorLog ] ) {
  try {
    divMediaDeviceInfo = document.createElement("div");
    divMediaStreamInfo = document.createElement("div");
    const devices = await window.navigator.mediaDevices.enumerateDevices();
    console.log(devices);
    for (const mediaDeviceInfo of devices) {
      displayMediaDeviceInfo(mediaDeviceInfo);
    }
    document.body.appendChild(divMediaDeviceInfo);
  } catch (e) {
    ErrorLog.rethrow({
      functionName: "start",
      error: e,
    });
  }

  function displayMediaDeviceInfo(mediaDeviceInfo) {
    try {
      divMediaDeviceInfo.innerHTML = "";
      divMediaStreamInfo.innerHTML = "";
      const div = document.createElement("div");
      div.style.border = "1px solid black";
      let p;
      p = document.createElement("p");
      p.appendChild(document.createTextNode("deviceId:" + mediaDeviceInfo.deviceId));
      div.appendChild(p);
      p = document.createElement("p");
      p.appendChild(document.createTextNode("groupId: " + mediaDeviceInfo.groupId));
      div.appendChild(p);
      p = document.createElement("p");
      p.appendChild(document.createTextNode("kind: " + mediaDeviceInfo.kind));
      div.appendChild(p);
      p = document.createElement("p");
      p.appendChild(document.createTextNode("label: " + mediaDeviceInfo.label));
      div.appendChild(p);
      const btn = document.createElement("button");
      btn.innerHTML = "Get Stream";
      btn.addEventListener("click", getterMediaStream(mediaDeviceInfo));
      div.appendChild(btn);
      divMediaDeviceInfo.appendChild(div);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "displayMediaDeviceInfo",
        error: e,
      });
    }
  }

  function displayMediaStream(mediaStream) {
    try {
      divMediaDeviceInfo.innerHTML = "";
      divMediaStreamInfo.innerHTML = "";
      const div = document.createElement("div");
      div.style.border = "1px solid black";
      let p;
      p = document.createElement("p");
      p.appendChild(document.createTextNode("id: " + mediaStream.id));
      div.appendChild(p);
      p = document.createElement("p");
      p.appendChild(document.createTextNode("active: " + mediaStream.active));
      div.appendChild(p);
      const tracks = mediaStream.getTracks();
      for (const track of tracks) {
        const divTrack = document.createElement("div");
        divTrack.style.border = "1px solid black";
        p = document.createElement("p");
        p.appendChild(document.createTextNode("label: " + track.label));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("id: " + track.id));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("kind: " + track.kind));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("contentHint: " + track.contentHint));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("enabled: " + track.enabled));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("muted: " + track.muted));
        divTrack.appendChild(p);
        p = document.createElement("p");
        p.appendChild(document.createTextNode("readyState: " + track.readyState));
        divTrack.appendChild(p);
        div.appendChild(divTrack);
      }
      const btn = document.createElement("button");
      btn.innerHTML = "Record Stream";
      btn.addEventListener("click", recorderMediaStream(mediaStream));
      div.appendChild(btn);
      divMediaStreamInfo.appendChild(div);
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "displayMediaStream",
        error: e,
      });
    }
  }

  function getterMediaStream(deviceInfo) {
    switch (deviceInfo.kind) {
      case "videoinput":
        return (function (evt) {
          (async function () {
            try {
              const mediaStream = await window.navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: {
                    exact: deviceInfo.deviceId,
                  }
                }
              });
              displayMediaStream(mediaStream);
            } catch (e) {
              console.error(e);
            }
          })();
        });
        break;
      case "audioinput":
        return (function (evt) {
          (async function () {
            try {
              const mediaStream = await window.navigator.mediaDevices.getUserMedia({
                audio: {
                  deviceId: {
                    exact: deviceInfo.deviceId,
                  }
                }
              });
              displayMediaStream(mediaStream);
            } catch (e) {
              console.error(e);
            }
          })();
        });
        break;
      case "audiooutput":
        return (function (evt) {
          (async function () {
            try {
              const stream = await window.navigator.mediaDevices.getUserMedia({
                audio: {
                  deviceId: {
                    exact: deviceInfo.deviceId,
                  }
                }
              });
            } catch (e) {
              console.error(e);
            }
          })();
        });
        break;
      default:
        async function startUnknown(evt) {
          console.log("unknown");
        }
        break;
    };
  }

  function recorderMediaStream(mediaStream) {
    try {
      return (function (evt) {
        console.log(mediaStream);
        const recorder = new MediaRecorder(mediaStream);
        const timeslice = prompt("Number of milliseconds");
        if (timeslice === null) {
          return;
        }
        recorder.start(Number.parseInt(timeslice));
        recorder.addEventListener("dataavailable", dataReader);
        function dataReader(evt) {
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = URL.createObjectURL(evt.data);
          a.download = "RecorderOutput";
          a.click();
          a.remove();
          recorder.removeEventListener("dataavailable", dataReader);
        }
      });
    } catch (e) {
      ErrorLog.rethrow({
        functionName: "recorderMediaStream",
        error: e,
      });
    }
  }
}

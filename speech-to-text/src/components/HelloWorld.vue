<template>
  <div class="hello">
    toggle recording on/off.
    <form class="uk-form-horizontal uk-margin-large uk-section-xsmall">
      <fieldset data-uk-margin>
        <legend>Talk With</legend>

        <label class="uk-form-label" for="form-horizontal-text"
          >Use language</label
        >
        <div class="uk-margin uk-grid-small uk-child-width-auto uk-grid">
          <label>
            <input
              class="uk-radio"
              type="radio"
              value="en"
              name="radio2"
              checked
            />
            EN</label
          >
          <label>
            <input class="uk-radio" type="radio" value="ja" name="radio2" />
            JA
          </label>
          <label>
            <input class="uk-radio" type="radio" value="fr" name="radio2" />
            FR</label
          >
          <label>
            <input class="uk-radio" type="radio" value="de" name="radio2" />
            DE</label
          >
          <label
            ><input class="uk-radio" type="radio" value="it" name="radio2" />
            IT</label
          >
          <label
            ><input class="uk-radio" type="radio" value="la" name="radio2" />
            LA</label
          >
          <label
            ><input class="uk-radio" type="radio" value="ko" name="radio2" />
            KO</label
          >
          <label
            ><input class="uk-radio" type="radio" value="zh" name="radio2" />
            ZH</label
          >
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text"
            >Webhook Url</label
          >
          <div class="uk-form-controls">
            <input
              class="uk-input"
              name="webhook"
              id="webhook"
              type="text"
              placeholder="https://hooks.slack.com/services/xxxxx..."
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Name</label>
          <div class="uk-form-controls">
            <input
              class="uk-input"
              name="name"
              id="name"
              type="text"
              placeholder="your bot name"
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text"
            >Channel</label
          >
          <div class="uk-form-controls">
            <input
              class="uk-input"
              name="channel"
              id="channel"
              type="text"
              placeholder="#random"
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Image</label>
          <div class="uk-form-controls">
            <input
              class="uk-input"
              id="image"
              type="text"
              placeholder="https://example.com/your_icon_image.png"
            />
          </div>
        </div>

        <hr class="uk-grid-divider" />

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">State</label>
          <div class="uk-form-controls">
            <input
              class="uk-disabled uk-input"
              id="status"
              type="text"
              placeholder="STATE"
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Result</label>
          <div class="uk-form-controls">
            <textarea
              class="uk-textarea"
              id="result_text"
              placeholder="RESULT"
            ></textarea>
          </div>
        </div>

        <br />
        <input
          type="button"
          class="uk-button uk-button-primary"
          id="record"
          value="RECORD START"
        /><br />
        <input
          type="button"
          class="uk-button uk-button-secondary"
          id="slack-submit"
          value="SLACK NOTIFY TEST"
        /><br />
        <input
          type="button"
          class="uk-button uk-button-primary"
          id="send"
          value="SEND MESSAGE"
        /><br />

        <h2>Recordings</h2>
        <ul id="recordingslist"></ul>

        <h2>Log</h2>
        <pre id="log"></pre>
      </fieldset>
    </form>
  </div>
</template>

<script>
import Recorder from "../../lib/recorder.js";
import jQuery from "jquery";
global.jquery = jQuery;
global.$ = jQuery;
window.$ = window.jQuery = require("jquery");
export default {
  data: () => {
    return {
      recorder: "",
      audio_context: "",
      recognition: "",
      flag_push_enable: 0,
      flag_speech: 0,
      COOKIE_KEYS: ["webhook", "name", "image", "channel"],
      LANG_KEY: "lang",
      line: "",
    };
  },
  props: {
    msg: String,
  },
  mounted() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
      }
      if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function (constraints) {
          // First get ahold of the legacy getUserMedia, if present
          let getUserMedia =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia;

          // Some browsers just don't implement it - return a rejected promise with an error
          // to keep a consistent interface
          if (!getUserMedia) {
            return Promise.reject(
              new Error("getUserMedia is not implemented in this browser")
            );
          }

          // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
      // window.URL = window.URL || window.webkitURL;

      this.audio_context = new AudioContext();
      this.__log("Audio context set up.");
      this.__log(
        "navigator.mediaDevices " +
          (navigator.mediaDevices.length != 0 ? "available." : "not present!")
      );
    } catch (e) {
      alert("No web audio support in this browser!");
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.startUserMedia(stream);
      })
      .catch((e) => {
        this.__log("No live audio input: " + e);
      });

    window.$("#record").on("click", () => {
      this.toggle_recording();
    });

    window.$(document).ready(() => {
      this.restore_input_from_cookie();
    });

    window.$("#slack-submit").on("click", () => {
      this.call_slack("Slack Notify");
    });
  },
  methods: {
    startUserMedia(stream) {
      var input = this.audio_context.createMediaStreamSource(stream);
      this.audio_context.resume();
      this.__log("Media stream created.");

      // Uncomment if you want the audio to feedback directly
      //input.connect(audio_context.destination);
      //this.__log('Input connected to audio context destination.');

      this.recorder = new Recorder(input);
      this.__log("Recorder initialised.");
    },
    __log(e, data) {
      window.$("log").innerHTML += "\n" + e + " " + (data || "");
    },
    /**
     * 録音+文字起こしの待ち受け状態切替
     */
    toggle_recording() {
      if (this.flag_now_recording) {
        if (this.recognition) {
          console.log("toggleRecordingでストップ");

          this.recognition.stop();
        }
        console.log("トグルオフ");
        this.stopRecording();
        window.$("#record").val("RECORD START");
        window
          .$("#record")
          .removeClass("uk-button-danger")
          .addClass("uk-button-primary");
        this.flag_now_recording = false;
        window.$("#send").off("click");
      } else {
        window.$("#record").val("RECORD STOP");
        window
          .$("#record")
          .removeClass("uk-button-primary")
          .addClass("uk-button-danger");
        this.flag_now_recording = true;
        window.$("#result_text").val("START");
        this.startRecording();
        this.record();
      }
    },
    /**
     * 録音+文字起こし処理
     */
    record() {
      window.SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new window.webkitSpeechRecognition();
      var str_lang = window.$('input:radio[name="radio2"]:checked').val();
      this.recognition.lang = str_lang;
      this.recognition.interimResults = true;
      this.recognition.continuous = true;
      this.save_input_to_cookie();

      this.recognition.onsoundstart = () => {
        console.log("サウンドスタート");
        window.$("#status").val("Recording");
      };

      this.recognition.onnomatch = () => {
        window.$("#status").val("Retry");
      };

      this.recognition.onerror = (event) => {
        window.$("#status").val(event.error);
        if (this.flag_speech == 0) {
          this.record();
        }
      };

      this.recognition.onsoundend = () => {
        window.$("#status").val("Stopped");
        console.log("onsoundendでストップ");
        this.recognition.stop();
        this.record();
      };

      this.recognition.onresult = (event) => {
        let results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          if (results[i].isFinal) {
            let text = results[i][0].transcript;
            this.line += text + "。\n";
            window.$("#result_text").val(this.line);
            console.log("text", text);
            console.log("this.line", this.line);
            // call_slack(text);
            this.recognition.stop();
            console.log("onresultでストップ");
          } else {
            let text = results[i][0].transcript;
            window.$("#result_text").val(this.line + text);
            this.flag_speech = 1;
          }
        }
      };

      this.flag_speech = 0;
      this.recognition.start();
      console.log("スタートが動いています");

      window.$("#send").on("click", () => {
        console.log("送る");
      });

      window.$(function () {
        window.$("textarea").on("change keyup keydown paste cut", function () {
          if (window.$(this).outerHeight() > this.scrollHeight) {
            window.$(this).height(1);
          }
          while (window.$(this).outerHeight() < this.scrollHeight) {
            window.$(this).height(window.$(this).height() + 1);
          }
        });
      });
    },
    /**
     * slackにメッセージ送信
     * @param {*} text
     */
    call_slack(text) {
      var url = window.$("#webhook").val();
      var name = window.$("#name").val();
      var url_image = window.$("#image").val();
      var channel = window.$("#channel").val();
      var msg = `${text}`;
      this.recorder &&
        this.recorder.exportWAV((blob) => {
          let formData = new FormData();
          formData.append("data", blob);
          window.$.ajax({
            data:
              "payload=" +
              JSON.stringify({
                text: msg,
                username: name,
                icon_url: url_image,
                channel: channel,
                voice: formData,
              }),
            type: "POST",
            url: url,
            dataType: "json",
            processData: false,
            success: () => {
              console.log("OK");
            },
          });
        });
    },
    /**
     * 録音を開始
     */
    startRecording() {
      this.recorder && this.recorder.record();
      // button.disabled = true;
      // button.nextElementSibling.disabled = false;
      this.__log("Recording...");
    },

    /**
     * 録音を停止
     */
    stopRecording() {
      this.recorder && this.recorder.stop();
      // button.disabled = true;
      // button.previousElementSibling.disabled = false;
      this.__log("Stopped recording.");

      // create WAV download link using audio data blob
      this.createDownloadLink();

      this.recorder.clear();
    },
    /**
     * ダウンロードリンク作成
     */
    createDownloadLink() {
      this.recorder &&
        this.recorder.exportWAV((blob) => {
          var url = URL.createObjectURL(blob);
          var li = document.createElement("li");
          var au = document.createElement("audio");
          var hf = document.createElement("a");

          au.controls = true;
          au.src = url;
          hf.href = url;
          hf.download = new Date().toISOString() + ".wav";
          hf.innerHTML = hf.download;
          li.appendChild(au);
          li.appendChild(hf);
          window.$("#recordingslist").append(li);
        });
    },
    /**
     * cookieに保管されている値を取得
     * @returns cookies
     */
    get_cookies() {
      let result = [];
      let cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        let kv = cookie.trim().split("=");
        result[kv[0]] = decodeURIComponent(kv[1]);
      }
      return result;
    },

    /**
     * cookieに設定情報を保存
     * @param {*} data
     */
    save_cookies(data) {
      for (let k in data) {
        document.cookie = k + "=" + encodeURIComponent(data[k]) + ";";
      }
    },

    /**
     * cookieから設定情報を復元
     */
    restore_input_from_cookie() {
      let cookies = this.get_cookies();
      for (let key of this.COOKIE_KEYS) {
        window.$("#" + key).val(cookies[key]);
      }
      let lang = cookies[this.LANG_KEY];
      if (lang) {
        let radio = Object.values(window.$(`.uk-radio[value=${lang}]`));
        if (radio.length >= 0) {
          radio[0].checked = true;
        }
      }
    },

    /**
     * cookieに保存する設定情報を取得し、save_cookiesを利用
     */
    save_input_to_cookie() {
      let data = {};
      for (let key of this.COOKIE_KEYS) {
        data[key] = window.$("#" + key).val();
      }
      let lang_radios = window.$(".uk-radio:checked");
      if (lang_radios.length >= 0) {
        data[this.LANG_KEY] = lang_radios[0].value;
      }
      this.save_cookies(data);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

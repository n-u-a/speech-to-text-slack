<template>
  <div class="hello">
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
            >Bot OAuth Token</label
          >
          <div class="uk-form-controls">
            <input
              class="uk-input"
              v-model="oauthToken"
              type="text"
              placeholder="xoxb-hogehogehoge-fugafugafuga"
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text"
            >File Name</label
          >
          <div class="uk-form-controls">
            <input
              class="uk-input"
              v-model="fileName"
              type="text"
              placeholder="file name (default: new file)"
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
              v-model="channels"
              type="text"
              placeholder="#random"
            />
          </div>
        </div>

        <hr class="uk-grid-divider" />

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">State</label>
          <div class="uk-form-controls">
            <input
              class="uk-disabled uk-input"
              type="text"
              placeholder="STATE"
              :value="status"
            />
          </div>
        </div>

        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Result</label>
          <div class="uk-form-controls">
            <textarea
              class="uk-textarea"
              placeholder="RESULT"
              :value="resultText"
            ></textarea>
          </div>
        </div>

        <br />
        <input
          type="button"
          :class="recordClass"
          :value="recordToggle"
          @click="toggleRecording"
        /><br />
        <input
          type="button"
          class="uk-button uk-button-primary"
          value="SEND MESSAGE"
          @click="callSlack"
        /><br />

        <h2>Recordings</h2>
        <ul id="recordingslist"></ul>
      </fieldset>
    </form>
  </div>
</template>

<script>
import Recorder from "../../lib/recorder.js";
import axios from "axios";
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
      flag_speech: 0,
      COOKIE_KEYS: ["oauthToken", "name", "image", "channel"],
      LANG_KEY: "lang",
      line: "",
      recordToggle: "RECORD START",
      recordClass: "uk-button uk-button-primary",
      status: "",
      resultText: "",
      oauthToken: "",
      fileName: "",
      channels: "",
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
          console.log("getUserMedia", getUserMedia);

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
    } catch (e) {
      alert("No web audio support in this browser!");
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.startUserMedia(stream);
      })
      .catch((e) => {
        console.log(e);
      });

    this.restore_input_from_cookie();
  },
  methods: {
    startUserMedia(stream) {
      var input = this.audio_context.createMediaStreamSource(stream);
      this.audio_context.resume();
      this.recorder = new Recorder(input);
    },
    /**
     * 録音+文字起こしの待ち受け状態切替
     */
    toggleRecording() {
      if (this.flag_now_recording) {
        if (this.recognition) {
          console.log("toggleRecordingでストップ");
          this.recognition.stop();
        }
        console.log("トグルオフ");
        this.stopRecording();
        this.recordToggle = "RECORD START";
        this.recordClass = "uk-button uk-button-primary";
        this.flag_now_recording = false;
        // window.$("#send").off("click");
      } else {
        this.recordToggle = "RECORD STOP";
        this.recordClass = "uk-button uk-button-danger";
        this.flag_now_recording = true;
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
      let instance = this;

      this.recognition.onsoundstart = () => {
        console.log("サウンドスタート");
        instance.status = "Recording";
      };

      this.recognition.onnomatch = () => {
        instance.status = "Retry";
      };

      this.recognition.onerror = (event) => {
        instance.status = event.error;
        if (instance.flag_speech == 0) {
          instance.record();
        }
      };

      this.recognition.onsoundend = () => {
        console.log("onsoundendでストップ");
        instance.status = "Stopped";
        instance.recognition.stop();
        instance.record();
      };

      this.recognition.onresult = (event) => {
        for (let result of event.results) {
          console.log("results", result);
          let text = result[0].transcript;
          if (result.isFinal) {
            console.log("onresultでストップ");
            instance.line += text + "。\n";
            instance.resultText = instance.line;
            instance.recognition.stop();
          } else {
            instance.resultText = instance.line + text;
            instance.flag_speech = 1;
          }
        }
      };

      this.flag_speech = 0;
      this.recognition.start();
      console.log("録音スタート");

      // textarea拡張の設定
      window.$(() => {
        window.$("textarea").on("change keyup keydown paste cut", () => {
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
     */
    callSlack() {
      console.log("slack処理開始");
      let fileName = this.fileName;
      if (!fileName) {
        fileName = "new file";
      }
      let channels = this.channels;
      if (!channels) {
        channels = "test";
      }
      this.recorder &&
        this.recorder.exportWAV((wav) => {
          console.log("エクスポート完了");
          const request = axios.create({
            baseURL: "https://slack.com/api",
          });

          const params = new FormData();
          params.append("channels", "#test");
          params.append("file", wav);
          params.append("token", this.oauthToken);
          params.append("initial_comment", this.resultText);
          // ダウンロード時のファイル名
          params.append("filename", fileName);
          // slackに表示されるファイルのタイトル
          params.append("title", fileName);
          request
            .post("/files.upload", params)
            .then((res) => {
              console.log(res);
              this.recorder.clear();
              this.resultText = "";
              this.line = "";
            })
            .catch((e) => {
              console.log("axios Error : ", e);
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
    },

    /**
     * 録音を停止
     */
    stopRecording() {
      this.recorder && this.recorder.stop();
      // button.disabled = true;
      // button.previousElementSibling.disabled = false;

      // create WAV download link using audio data blob
      this.createDownloadLink();
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

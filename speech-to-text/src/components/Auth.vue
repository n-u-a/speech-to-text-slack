<template>
  <div>
    <button @click="go">a</button>
  </div>
</template>

<script>
import { InstallProvider } from "@slack/oauth";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { oauthAccess } from "../slack";
import { URL } from "url";
// import axios from "axios";
export default {
  data() {
    return {
      installer: "",
    };
  },
  created() {
    console.log("process", process);
    console.log("process.version", process.version);
  },
  mounted() {
    this.installer = new InstallProvider({
      clientId: "1377787479637.2814852320372",
      clientSecret: "1c35f1441a533532abf40f481684cabe",
      stateSecret: "my-state-secret",
    });
    console.log("InstallProvider", InstallProvider);
    console.log("installer", this.installer);

    // admin.initializeApp({
    //   serviceAccountId: "slackauth-prof@appspot.gserviceaccount.com", // GCPから確認する
    //   credential: admin.credential.applicationDefault(), // 必須？？
    // });
    admin.initializeApp();

    exports.authWithSlack = functions.https.onRequest(async (req, res) => {
      const slackAuthCode = req.query.code;
      const redirectUri = req.query.state;

      if (!slackAuthCode) {
        console.warn("code query string not find.");
        res.status(400).end();
      }

      const userCredential = await oauthAccess(slackAuthCode);

      try {
        const customToken = await admin
          .auth()
          .createCustomToken(userCredential.authed_user.id); // userIdではundefinedとなるため

        if (redirectUri) {
          const url = new URL(redirectUri);
          url.search = `t=${customToken}`;
          res.redirect(303, url.toString());
        } else {
          res
            .json({
              custom_token: customToken,
            })
            .end();
        }
        return;
      } catch (e) {
        console.error("Failed to create custom token:", e);
      }
    });
  },
  methods: {
    go() {
      // this.installer.generateInstallUrl({
      //   // Add the scopes your app needs
      //   scopes: ["channels:read"],
      // });
      // this.$router.push({
      //   name: "HelloWorld",
      // });
    },
  },
};
</script>

<style>
</style>
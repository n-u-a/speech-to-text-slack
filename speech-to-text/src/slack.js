const { WebClient } = require("@slack/web-api"); // eslint-disable-line

export const oauthAccess = async (code) => {
    try {
        const res = await new WebClient().oauth.v2.access({ // oauth.accessは現在非推奨
            client_id: "1377787479637.2814852320372",
            client_secret: "1c35f1441a533532abf40f481684cabe",
            code,
        });
        return res;
    } catch (e) {
        console.warn("Slack oauth was failed.", e);
        throw new Error();
    }
};
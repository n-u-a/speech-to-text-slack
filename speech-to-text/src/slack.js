const { WebClient } = require("@slack/web-api"); // eslint-disable-line

export const oauthAccess = async (code) => {
    try {
        const res = await new WebClient().oauth.v2.access({ // oauth.accessは現在非推奨
            client_id: "xxxx",
            client_secret: "xxxx",
            code,
        });
        return res;
    } catch (e) {
        console.warn("Slack oauth was failed.", e);
        throw new Error();
    }
};
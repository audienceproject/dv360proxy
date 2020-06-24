const querystring = require("querystring");
const axios = require("axios");
const loadConfig = require("./config");

let lastToken = null;

module.exports = async function getDV360AccessToken() {
    if (
      lastToken &&
      lastToken.exp < new Date().getTime()
    ) {
      return lastToken.token;
    }
    const config = await loadConfig();
  
    const tokenPayload = querystring.stringify({
      client_id: config.credentials.clientId,
      client_secret: config.credentials.clientSecret,
      refresh_token: config.credentials.refreshToken,
      grant_type: "refresh_token"
    });
    const tokenUrl = "https://www.googleapis.com/oauth2/v4/token";
    const tokenResponse = await axios.post(tokenUrl, tokenPayload);
    const accessToken =
      tokenResponse.data["token_type"] + " " + tokenResponse.data["access_token"];
    lastToken = {
      exp: new Date().getTime() + 30 * 60 * 1000, // Expire cache in 30 minuts
      token: accessToken
    };
    return accessToken;
  };
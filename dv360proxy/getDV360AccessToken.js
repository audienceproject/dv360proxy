const { GoogleToken } = require('gtoken');
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

  const gtoken = new GoogleToken({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scope: ['https://www.googleapis.com/auth/doubleclickbidmanager', 'https://www.googleapis.com/auth/display-video'] // or space-delimited string of scopes
  });

  const token = await gtoken.getToken();
  const accessToken = `${token.token_type} ${token.access_token}`;
  
    lastToken = {
    exp: new Date().getTime() + token.expires_in * 1000,
    token: accessToken
  };
  return accessToken;
};
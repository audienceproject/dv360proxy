const axios = require("axios");
const rax = require("retry-axios");
const getDV360AccessToken = require("./getDV360AccessToken");

const baseApi = function (requestId) {
    this.configureApiClient = (url, validateStatus) => {
        let apiConfig = {
            baseURL: url
        };
        if(validateStatus) {
            apiConfig.validateStatus = () => true;
        }

        const api = axios.create(apiConfig);
    
        api.interceptors.request.use(async function (config) {
            config.headers["Authorization"] = await getDV360AccessToken();
            return config;
        });
    
        api.defaults.raxConfig = {
            instance: api,
            // Retry 5 times on requests that return a response (500, etc) before giving up.
            retry: 5,
    
            // Retry twice on errors that don't return a response (ENOTFOUND, ETIMEDOUT, etc).
            noResponseRetries: 3,
    
            // Milliseconds to delay at first.
            retryDelay: 1500,
    
            // HTTP methods to automatically retry.
            httpMethodsToRetry: ["GET", "DELETE", "PUT", "POST"],
    
            // The response status codes to retry.  Supports a double
            // array with a list of ranges.
            statusCodesToRetry: [
                [100, 199],
                [429, 429],
                [500, 599]
            ],
    
            // You can detect when a retry is happening, and figure out how many
            // retry attempts have been made
            onRetryAttempt: err => {
                const cfg = rax.getConfig(err);
                console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
            }
        };
    
        rax.attach(api);

        return api;
    };

    this.processRequest = async (requestCall, name, payload) => { 
        try {
            return await requestCall();
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(`${requestId}: ${name}(${JSON.stringify(payload)}) failed with ${errMessage}`);
            throw err;
        } 
    };
};

module.exports = baseApi;
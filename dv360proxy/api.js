const axios = require("axios");
const rax = require("retry-axios");
const getDV360AccessToken = require("./getDV360AccessToken");

const API = function (requestId) {
    const dbmAPI = axios.create({
        baseURL: "https://www.googleapis.com/doubleclickbidmanager/v1.1"
    });

    dbmAPI.interceptors.request.use(async function (config) {
        console.log(getDV360AccessToken);
        config.headers["Authorization"] = await getDV360AccessToken();
        return config;
    });

    dbmAPI.defaults.raxConfig = {
        instance: dbmAPI,
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

    rax.attach(dbmAPI);

    this.getQueries = async ({pageToken}) => {
        const url = "/queries";
        try {
            const queriesResponse = await dbmAPI.get(url, { params: { pageToken: pageToken } });
            return queriesResponse.data;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.getQueries() failed with ${errMessage}`
            );
            throw err;
        }
    };

    this.getQuery = async ({queryId}) => {
        const url = `/query/${queryId}`;
        try {
            const queriesResponse = await dbmAPI.get(url);
            return queriesResponse.data;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.getQuery(${JSON.stringify(
          queryId
        )}) failed with ${errMessage}`
            );
            throw err;
        }
    };

    this.createQuery = async ({query}) => {
        const url = "/query";
        try {
            const queriesResponse = await dbmAPI.post(url, query);
            return queriesResponse.data;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.createQuery(${JSON.stringify(
          query
        )}) failed with ${errMessage}`
            );
            throw err;
        }
    };

    this.runQuery = async ({queryId, data}) => {
        const url = `/query/${queryId}`;
        try {
            const queriesResponse = await dbmAPI.post(url, data);
            return queriesResponse.data;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.runQuery(${JSON.stringify(
          queryId
        )}) failed with ${errMessage}`
            );
            throw err;
        }
    };

    this.deleteQuery = async ({queryId}) => {
        const url = `/query/${queryId}`;
        try {
            await dbmAPI.delete(url);
            return true;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.deleteQuery(${JSON.stringify(
          queryId
        )}) failed with ${errMessage}`
            );
            throw err;
        }
    };

    this.getQueryReports = async ({queryId, pageToken}) => {
        const url = `/queries/${queryId}/reports`;
        try {
            const queriesResponse = await dbmAPI.get(url, { params: { pageToken: pageToken } });
            return queriesResponse.data;
        } catch (err) {
            let errMessage = err.stack || err.toString();
            if (err.response) {
                errMessage = JSON.stringify(err.response.data);
            }
            console.error(
                `${requestId}: DV360API.deleteQuery(${JSON.stringify(
          queryId
        )}) failed with ${errMessage}`
            );
            throw err;
        }
    };
};

module.exports = API;

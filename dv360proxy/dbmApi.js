const BaseApi = require("./baseApi");

const doubleClickBidManagerApi = function (requestId) {
    const baseApi = new BaseApi(requestId);
    const dbmApi = baseApi.configureApiClient("https://www.googleapis.com/doubleclickbidmanager/v1.1");

    this.getQueries = async (pageToken) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get("/queries", { params: { pageToken: pageToken } });
            return queriesResponse.data;
        }, 'DV360API.getQueries', '');
    };
    
    this.getQuery = async (queryId) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get(`/query/${queryId}`);
            return queriesResponse.data;
        }, 'DV360API.getQuery', queryId);
    };

    this.createQuery = async (query) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.post("/query", query);
            return queriesResponse.data;
        }, 'DV360API.createQuery', query);
    };

    this.runQuery = async (queryId, data) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.post(`/query/${queryId}`, data);
            return queriesResponse.data;
        }, 'DV360API.runQuery', queryId);
    };

    this.deleteQuery = async (queryId) => {
        return await baseApi.processRequest(async () => {
            await dbmApi.delete(`/query/${queryId}`);
            return true;
        }, 'DV360API.deleteQuery', queryId);
    };

    this.getQueryReports = async (queryId, pageToken) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get(`/queries/${queryId}/reports`, { params: { pageToken: pageToken } });
            return queriesResponse.data;
        }, 'DV360API.getQueryReports', queryId);
    };

    return this;
};

module.exports = doubleClickBidManagerApi;
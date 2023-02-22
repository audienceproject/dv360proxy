const BaseApi = require("./baseApi");

const doubleClickBidManagerApiV2 = function (requestId) {
    const baseApi = new BaseApi(requestId);
    const dbmApi = baseApi.configureApiClient("https://doubleclickbidmanager.googleapis.com/v2");

    this.getQueries = async (pageToken) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get("/queries", { params: { pageToken: pageToken } });
            return queriesResponse.data;
        }, 'DV360API.getQueries', '');
    };

    this.getQuery = async (queryId) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get(`/queries/${queryId}`);
            return queriesResponse.data;
        }, 'DV360API.getQuery', queryId);
    };

    this.createQuery = async (query) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.post("/queries", query);
            return queriesResponse.data;
        }, 'DV360API.createQuery', query);
    };

    this.runQuery = async (queryId, data) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.post(`/queries/${queryId}:run`, data);
            return queriesResponse.data;
        }, 'DV360API.runQuery', queryId);
    };

    this.deleteQuery = async (queryId) => {
        return await baseApi.processRequest(async () => {
            await dbmApi.delete(`/queries/${queryId}`);
            return true;
        }, 'DV360API.deleteQuery', queryId);
    };

    this.getQueryReports = async (queryId, pageToken) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get(`/queries/${queryId}/reports`, { params: { pageToken: pageToken } });
            return queriesResponse.data;
        }, 'DV360API.getQueryReports', queryId);
    };

    this.getQueryReport = async (queryId, reportId) => {
        return await baseApi.processRequest(async () => {
            const queriesResponse = await dbmApi.get(`/queries/${queryId}/reports/${reportId}`);
            return queriesResponse.data;
        }, 'DV360API.getQueryReport', reportId);
    };
};

module.exports = doubleClickBidManagerApiV2;
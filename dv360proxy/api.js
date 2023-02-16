const configLoader = require("./config");
const DvApiV2 = require("./dvApiV2");
const DbmApi = require("./dbmApi");
const DbmApiV2 = require("./dbmApiV2");

const API = function (requestId) {
    var dvApiV2 = new DvApiV2(requestId);
    var dbmApi = new DbmApi(requestId);
    var dbmApiV2 = new DbmApiV2(requestId);

    this.getQueries = async ({pageToken}) => {
        return await dbmApi.getQueries(pageToken);
    };

    this.getQueries_v2 = async ({pageToken}) => {
        return await dbmApiV2.getQueries(pageToken);
    };

    this.getQuery = async ({queryId}) => {
        return await dbmApi.getQuery(queryId);
    };

    this.getQuery_v2 = async ({queryId}) => {
        return await dbmApiV2.getQuery(queryId);
    };

    this.createQuery = async ({query}) => {
        return await dbmApi.createQuery(query);
    };

    this.createQuery_v2 = async ({query}) => {
        return await dbmApiV2.createQuery(query);
    };

    this.runQuery = async ({queryId, data}) => {
        return await dbmApi.runQuery(queryId, data);
    };

    this.runQuery_v2 = async ({queryId, data}) => {
        return await dbmApiV2.runQuery(queryId, data);
    };

    this.deleteQuery = async ({queryId}) => {
        return await dbmApi.deleteQuery(queryId);
    };

    this.deleteQuery_v2 = async ({queryId}) => {
        return await dbmApiV2.deleteQuery(queryId);
    };

    this.getQueryReports = async ({queryId, pageToken}) => {
        return await dbmApi.getQueryReports(queryId, pageToken);
    };

    this.getQueryReports_v2 = async ({queryId, pageToken}) => {
        return await dbmApiV2.getQueryReports(queryId, pageToken);
    };

    this.getQueryReport_v2 = async ({queryId, reportId}) => {
        return await dbmApiV2.getQueryReport(queryId, reportId);
    };

    this.ping = async () => {
        const response = {
            ok: true,
            canAccessDV360Api: false,
            canAccessDBMApi: false,
            serviceAccount: null,
            errors: [],
            availableAdvertisers: [],
            unavailableAdvertisers: []
        };

        let config;
        try {
            config = await configLoader();
        } catch (err) {
            response.ok = false;
            response.errors.push(err.stack);
            return response;
        }

        response.serviceAccount = config.credentials.client_email;
        const partners = config.runtimeConfig.partners;
        for (const partner of partners) {
            for (const advertiser of partner.advertisers) {
                const { data, status } = await dvApiV2.getAdvertiser(advertiser.Id);
                if (status !== 200) {
                    response.ok = false;
                    response.unavailableAdvertisers.push({
                        advertiserId: advertiser.id,
                        partnerId: partner.id
                    });
                    response.errors.push(`GET responded with ${status}`);
                } else {
                    response.canAccessDV360Api = true;
                    if (String(data.partnerId) !== String(partner.id)) {
                        response.ok = false;
                        response.errors.push(`Advertiser ${advertiser.id} is configured to belong to Partner ${partner.id}, however it belongs to Partner ${data.partnerId} accordingly to DV360 API`);

                        response.unavailableAdvertisers.push({
                            advertiserId: advertiser.id,
                            partnerId: partner.id
                        });
                    } else {
                        response.availableAdvertisers.push({
                            advertiserId: advertiser.id,
                            advertiserName: data.displayName,
                            blacklistMetrics: advertiser.blacklistMetrics,
                            partnerId: partner.id
                        });
                    }
                }
            }
        }

        try {
            await dbmApiV2.getQueries();
            response.canAccessDBMApi = true;
        } catch (err) {
            response.ok = false;
            response.errors.push("Unable to connect to DBM API. " + err.stack);
        }

        return response;
    }
}

module.exports = API;

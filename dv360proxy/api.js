const configLoader = require("./config");
const DvApi = require("./dvApi");
const DvApiV2 = require("./dvApiV2");
const DbmApi = require("./dbmApi");
const DbmApiV2 = require("./dbmApiV2");

const API = function (requestId) {
    var dvApi = new DvApi(requestId);
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

    this.ping = async () => {
        return await ping(async (advertiserId) => await dvApi.getAdvertiser(advertiserId), async () => await dbmApi.getQueries());
    }

    this.ping_v2 = async () => {
        return await ping(async (advertiserId) => await dvApiV2.getAdvertiser(advertiserId), async () => await dbmApiV2.getQueries());
    }

    async function ping(dvCheck, dbmCheck) {
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
                const { data, status } =  await dvCheck(advertiser.id);
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
            await dbmCheck();
            response.canAccessDBMApi = true;
        } catch (err) {
            response.ok = false;
            response.errors.push("Unable to connect to DBM API. " + err.stack);
        }

        return response;
    }
}

module.exports = API;

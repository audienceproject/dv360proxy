const validators = {
    getQueries: (config) => {
        return true;
    },
    getQuery: (config, {
        queryId
    }) => {
        return true;
    },
    /**
     * Created requests must:
     *  1. be filtered by advertiser allowed in Config
     *  2. don't use blacklisted metrics
     */
    createQuery: (config, {
        query
    }) => {
        /*
        See schema of Query resource- https://developers.google.com/bid-manager/v1.1/queries#resource.
        Example:
         {
            "kind": "doubleclickbidmanager#query",
            "metadata": {
                "title": "Test",
                "dataRange": "CURRENT_DAY",
                "format": "CSV",
                "locale": "en"
            },
            "params": {
                "type": "TYPE_GENERAL",
                "groupBys": [
                "FILTER_ADVERTISER",
                "FILTER_LINE_ITEM"
                ],
                "filters": [{
                "type": "FILTER_ADVERTISER",
                "value": "3482931"
                }],
                "metrics": [
                "METRIC_IMPRESSIONS"
                ]
            },
            "schedule": {
                "frequency": "ONE_TIME"
            },
            "timezoneCode": "UTC"
            }
        */
        // If query is filtered by multiple advertisers, the same filter type appears twice
        const advertisers = (query.params.filters || [])
            .filter(filter => filter.type === "FILTER_ADVERTISER")
            .map(filter => filter.value);
        if (advertisers.length === 0) {
            return {
                valid: false,
                reason: "Requests does not have FILTER_ADVERTISER filter"
            };
        }

        const metrics = query.params.metrics;
        const allAdvertisers = [].concat.apply([], config.partners.map(p => p.advertisers));

        // Validae that all advertisers allowed to be queried
        for (const advertiserId of advertisers) {
            const advertiser = allAdvertisers.find((advertiserConfig) => String(advertiserConfig.id) === String(advertiserId));
            if (!advertiser) {
                return {
                    valid: false,
                    reason: `Advertiser ${advertiserId} is not allowed to access`
                };
            }

            // Make sure that requested metrics are whitelisted
            for (const metric of metrics) {
                for (let blacklist of advertiser.blacklistMetrics || []) {
                    if (metric.indexOf(blacklist) !== -1) {
                        return {
                            valid: false,
                            reason: `Metric ${metric} is blacklisted for advertiser ${advertiserId}`
                        };
                    }
                }
            }

        }

        return true;
    },
    runQuery: (config, {
        queryId,
        data
    }) => {
        return true;
    },
    deleteQuery: (config, {
        queryId
    }) => {
        return true;
    },
    getQueryReports: (config, {
        queryId
    }) => {
        return true;
    }
};

module.exports = async function (config, request) {
    var validator = validators[request.operation];

    if (!validator) {
        throw new Error(`Unsupported operation ${request.operation}`);
    }

    return validator(config, request.arguments);
}
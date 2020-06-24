module.exports = async function () {
    return {
        credentials: {
            "clientId": process.env.GOOGLE_CLIENT_ID,
            "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
            "refreshToken": process.env.GOOGLE_REFRESH_TOKEN,
        },
        advertisers: [{
            "id": "ADVERTISER_ID_HERE",
            // Metrics that have these parts in name are not allowed to be queried.
            // Full list: https://developers.google.com/bid-manager/v1.1/filters-metrics
            "blacklistMetrics": [
                "_COST_", 
                "_FEE_"
            ]
        }]

    };
};
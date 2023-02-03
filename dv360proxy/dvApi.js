const BaseApi = require("./baseApi");

const displayVideo360Api = function (requestId) {
    const baseApi = new BaseApi(requestId);
    const dvApi = baseApi.configureApiClient("https://displayvideo.googleapis.com/v1", true);

    this.getAdvertiser = async (advertiserId) => {
        return await dvApi.get(`/advertisers/${advertiserId}`);
    };

    this.checkAdvertisers = async (response, partners) => {
        for (const partner of partners) {
            for (const advertiser of partner.advertisers) {
                const { data, status } =  await this.getAdvertiser(advertiser.id);
                if (status !== 200) {
                    response.ok = false;
                    response.unavailableAdvertisers.push({
                        advertiserId: advertiser.id,
                        partnerId: partner.id
                    });
                    response.errors.push(`GET ${url} responded with ${status}`);
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
    };
};

module.exports = displayVideo360Api;
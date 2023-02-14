const BaseApi = require("./baseApi");

const displayVideo360ApiV2 = function (requestId) {
    const baseApi = new BaseApi(requestId);
    const dvApi = baseApi.configureApiClient("https://displayvideo.googleapis.com/v2", true);

    this.getAdvertiser = async (advertiserId) => {
        return await dvApi.get(`/advertisers/${advertiserId}`);
    };
};

module.exports = displayVideo360ApiV2;
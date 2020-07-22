var AWS = require("aws-sdk");
var ssm = new AWS.SSM();

module.exports = async function () {
    const ssmResponse = await ssm.getParameters({
        "Names": [
            "dv360proxy.credentials",
            "dv360proxy.config"
        ],
        "WithDecryption": true
    }).promise();
    if (ssmResponse.InvalidParameters.length > 0) {
        throw new Error("Unable to read SSM parameters", ssmResponse.InvalidParameters.join(", "));
    }

    const credentialsJSON = ssmResponse.Parameters.find(p => p.Name === "dv360proxy.credentials").Value;
    const configJSON = ssmResponse.Parameters.find(p => p.Name === "dv360proxy.config").Value;

    return {
        credentials: JSON.parse(credentialsJSON),
        runtimeConfig: JSON.parse(configJSON)
    };
};
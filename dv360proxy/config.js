var AWS = require("aws-sdk");
var ssm = new AWS.SSM();

module.exports = async function () {
    const credentialsParameterName = process.env.API_CREDENTIALS_PARAMETER_NAME;
    const configParameterName = process.env.CONFIG_PARAMETER_NAME;

    const ssmResponse = await ssm.getParameters({
        "Names": [
            credentialsParameterName,
            configParameterName
        ],
        "WithDecryption": true
    }).promise();
    if (ssmResponse.InvalidParameters.length > 0) {
        throw new Error(`Unable to read SSM parameters ${ssmResponse.InvalidParameters.join(", ")}`);
    }

    const credentialsJSON = ssmResponse.Parameters.find(p => p.Name === credentialsParameterName).Value;
    const configJSON = ssmResponse.Parameters.find(p => p.Name === configParameterName).Value;

    return {
        credentials: JSON.parse(credentialsJSON),
        runtimeConfig: JSON.parse(configJSON)
    };
};
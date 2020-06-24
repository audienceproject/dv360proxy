const getConfig = require("./config");
const DV360API = require("./api");
const validateRequest = require("./validator");

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} request - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * @returns {Object} object - Raw response body of DBM API
 * 
 */
exports.lambdaHandler = async (request, context) => {
    try {
        var config = await getConfig();

        // Make sure that API request is allowed by business rules
        const validationResult = await validateRequest(config, request);
        if (validationResult !== true) {
            throw new Error(validationResult.reason);
        }

        // Find the function to be called
        var api = new DV360API(context.awsRequestId);
        var operation = api[request.operation];

        if (!operation) {
            throw new Error(`Unsupported operation ${request.operation}`);
        }

        // Invoke the function and return the result
        const response = operation(request.arguments);
        console.log(response);
        return response;
    } catch (err) {
        console.log(err);
        return {
            error: true,
            message: err.message
        };
    }
};

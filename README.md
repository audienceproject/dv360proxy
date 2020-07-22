# DV360 Proxy

This solution acts as a proxy to access DV360 reports without giving direct access to DV360 API.
It solves three tasks:
- Whitelists advertisers allowed to access
- Blacklist metrics not allowed to access
- Log of requests made

Except of this is acts as a proxy, with no modification of requests and responses.


# API Reference

Solution exposes Lambda function, that needs to be invoked directly using `lambda:InvokeFunction` API. There is built-in possibility to allow external AWS account to call the Lambda function.

Lambda receives request, validates is against allowed Advertisers and Metrics and invokes corresponding DV360 API. The proxy uses [v1.1 DBM API](https://developers.google.com/bid-manager/v1.1) and exposes query-related methods.

Request object structure is the following:

```
{
  "operation": apiOperation,
  "arguments": operationArguments
  }
}
```

`apiOperation` is one of:
* `getQueries`
* `getQuery`
* `createQuery`
* `runQuery`
* `deleteQuery`
* `getQueryReports`

`operationArguments` are different for different operations

| Operation     | Arguments           |
| ------------- |-------------|
| `getQueries`      | `{ pageToken }` |
| `getQuery`      | `{ queryId }`      |
| `createQuery` | `{ query }` format defined at https://developers.google.com/bid-manager/v1.1/queries#resource      |
| `runQuery` | `{ queryId, data }` format defined at https://developers.google.com/bid-manager/v1.1/queries/runquery#request-body      |
| `deleteQuery` | `{ queryId }` |
| `getQueryReports` | `{ queryId, pageToken }` |

Example:
```json
{
  "operation": "createQuery",
  "arguments": {
    "query": {
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
          "value": "1"
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
  }

}
```


## Configuration

> Configuration & Deployment may look complicated. In fact is is very fast proccess taking up to 5 minutes if you have AWS CLI and Terraform (or AWS SAM). Check the video

DV360Proxy needs two configuration parameters:
* API Credentials of Service Account to acces DV360 API
* Configuration for the ptoxy, that has information about what partners and advertisers can be queried and blacklisted metrics for every adertiser

Parameters are stored in [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html). 

Parameters have default names:
* `dv360proxy.credentials` (SecureString)
* `dv360proxy.config` (String)

Parameter names are passed to Lambda function through environment variables `API_CREDENTIALS_PARAMETER_NAME` and `CONFIG_PARAMETER_NAME` correspdondingly.

You need to create these parameters manually in AWS Console or through API. Read in greater details below

_In CLI examples we don't pass AWS credentials, you should do it accordingly to your practices. We recommedn to checkout [@apr/ssts](https://www.npmjs.com/package/@apr/ssts) that simplify working with Bastion account approach and MFA._


## Access to DV360 API

DV360 uses Service Account model for accessing DV360 API. The flow is:
1. Create new Google Cloud Application that uses DisplayVideo and DBM APIs
1. Create Service Account and download JSON file with credentials
1. Invite Service Account to DV360 and assign correct permissions
1. Create `dv360proxy.credentials` parameter in Parameter Store with type `SecureString` and use downloaded JSON file content as value

_You can use existing Google Cloud Application, however it is recommended to not mix workloads and create dedicated application_

In order to create new application [using the setup tool](https://console.developers.google.com/start/api?id=displayvideo.googleapis.com,doubleclickbidmanager&credential=client_key).

 Choose to create new application, accept Google Terms and Conditions and continue to the next Screen.

![alt](docs/create_app_step1.png)![alt](docs/create_app_step2.png)

You may want to rename the project. Also you will be able to do it later.

Now you need to go to Credentials screen. 

![alt](docs/create_app_step3.png)

Click on "service account" link

![alt](docs/create_app_step4.png)

Choose to create new Service account

![alt](docs/create_app_step5.png)

Give it a name, like "DV360 API Proxy"

![alt](docs/create_app_step6.png)

Once, service account is created, you can skip next two optional steps and navigate to "Service accounts" list and choose to "Create key"

![alt](docs/create_app_step8.png)

Choose JSON as key-type

![alt](docs/create_app_step9.png)

Make sure, file is downloaded. You must store this file securely and protect against its leakage.

![alt](docs/create_app_step10.png)

Now you need to create the SSM Parameter. Recommended name is `dv360proxy.credentials`, however you can enter you any if you have organization policies regarding naming. You can do in [AWS Console / SSM / Create Parameter](https://console.aws.amazon.com/systems-manager/parameters/create)  page. **Doublecheck the region, so it is created in the correct one**

![alt](docs/create_app_step11.png)

Alternatively, you can rename downloaded file to `credentials.json` and use AWS CLI to upload credentials

```bash
aws ssm put-parameter --name "dv360proxy.credentials"  --value file://credentials.json --type "SecureString" --overwrite --region=us-east-1
```

Now, you can delete file with credentials.

Finally, you need to invite service-account email to DV360 and give reporting permissions.


![alt](docs/create_app_step12.png)![alt](docs/create_app_step13.png)

## Allowed Partners, Advertisers and blacklisted metrics

The second piece of the configuration is non-secure JSON document that describes what partners and advertisers can be queried and what metrics can not be accessed.


```json
{
  "partners": [
    {
      "id": "1234",
      "advertisers": [
        {
          "id": "456",
          "blacklistMetrics": [
            "_COST_",
            "_FEE_"
          ]
        },
        {
          "id": "789"
        }
      ]
    },
    {
      "id": "2345",
      "advertisers": [
        {
          "id": "987",
          "blacklistMetrics": [
            "_COST_",
            "_FEE_",
            "_VIDEO_"
          ]
        }
      ]
    }
  ]
}
```

It can be human-readed as following:
* Advertiser 456 belonging to partner ID 1234 can be queried, except Cost and Fee data
* Advertiser 789 belonging to partner ID 1234 can be queried without limits
* Advertiser 987 belonging to partner ID 2345 can be queried, except Cost, Fee and Video metrics (e.g. `METRIC_RICH_MEDIA_VIDEO_COMPLETIONS`)

> Notes:
> * Metrics validated against blacklist using `indeOf()`
> One query may request multiple partners, advertisers. If any of the checks got failed - entire request will be refused.

In order to help with JSON file creation, you can find `configurator.html` in the repo that provides UI for file generation.

![alt](docs/configure_step1.png)

Now you need to create the SSM Parameter. Recommended name is `dv360proxy.config`, however you can enter you any if you have organization policies regarding naming. You can do in [AWS Console / SSM / Create Parameter](https://console.aws.amazon.com/systems-manager/parameters/create)  page. **Doublecheck the region, so it is created in the correct one**

![alt](docs/configure_step2.png)

Alternativelym you can do it using AWS CLI. Save config as `config.json`. You can use "Donwload" button to save it from the UI.


```bash
aws ssm put-parameter --name "dv360proxy.config"  --value file://config.json --type "String" --overwrite --region=us-east-1
```

## Deploymnet

Prior to the deployment you need to clone the repository and install npm depdendencies.

```bash
npm install
```

Now you are ready for the deployment.

Idea of proxy to let another AWS to call the Lambda, so you will need AWS Account ID on your fingertips. It is required in both deployment modes. In case you don't need to give external access - use your AWS Account ID.

## Serverless Application Model

This requires you to install [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).

First time you deploy, you can use guided mode

```bash
sam deploy --guided
```

Alternatively, you can pass all arguments

```bash
sam deploy  --stack-name dv360proxy --parameter-overrides "ApiCredentialsParameterName=\"dv360proxy.credentials\" ConfigParameterName=\"dv360proxy.config\" CallerAccountId=\"111111\"" --capabilities CAPABILITY_IAM --region us-east-1
```

where `111111` is AWS account ID allowed to invoke the function.

You will see Lambda function ARN after the deployment. You will need it. Also you will be able to find this in AWS Console.
### Terraform

Or using terraform

```
terraform init
terraform plan --var invocation_account_ids=[11111,2222]
terraform apply --var invocation_account_ids=[11111,2222]
```

You will see Lambda function ARN after the deployment. You will need it. Also you will be able to find this in AWS Console.

#### Template settings

- `aws_region`                     - AWS Region used to deploy lambda. Default - `us-east-1`
- `invocation_account_ids`         - list of AWS Accounts allowed to invoke lambda
- `api_credentials_parameter_name` - name of SSM parameter where Google Service Account credentials to DV360 API are stored. Default - `dv360proxy.credentials`
- `config_parameter_name`          - name of SSM parameter where proxy configuration (allowed partners and advertisers) is stored. Default `dv360proxy.config`


### Testing

There is special operation that can test API connection and Partner/Advertiser configuration - `ping`.

Invoke Lamda function with `events/ping.json` as input, this will verify the connection

### API Limits

Given that own Google Application is created, you can see API requests count in Google Dashboard and you will be able to adjust limits.
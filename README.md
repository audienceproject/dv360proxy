# DV360 Proxy

This solution acts as a proxy to access DV360 reports without giving direct access to DV360 API.
It solves three tasks:
- Whitelists advertisers allowed to access
- Blacklist metrics not allowed to access
- Log of requests made

Except of this is acts as a proxy, with no modification of requests and responses.


## Overview

Solution exposes Lambda function, that needs to be invoked directly. No API Gateway needed.

Lambda receives request, validates is (logic is placed in `db360proxy/validator.js`) and invokes corresponding API function declared in `dv360proxy/api.js`.

Request object structure is following:

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
| `getQueries`      |  |
| `getQuery`      | `{ queryId }`      |
| `createQuery` | `{ query }` format defined at https://developers.google.com/bid-manager/v1.1/queries#resource      |
| `runQuery` | `{queryId, data}` format defined at https://developers.google.com/bid-manager/v1.1/queries/runquery#request-body      |
| `deleteQuery` | `{queryId}` |
| `getQueryReports` | `{queryId}` |

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

In order to access API you need to create Google Cloud Application and configure solution with `clientId`, `clientSecret` obtained in Google Cloud Console and `refreshToken` obtained using Google OAuth API. These values needs to be exposed through  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` env variables. Also `dv360proxy/config.js` contains list of advertisers allowed to access as well as blacklisted metrics for each.


## Deploymnet

### SAM

Lambda function can be deployed using AWS SAM with the following commands

```
sam build
sam deploy
```

### Terraform

Or using terraform

```
terraform plan --var invocation_account_ids=[318524154126,341784786689]
terraform apply --var invocation_account_ids=[318524154126,341784786689]
```

#### Template settings

- `aws_region`              - AWS Region used to deploy lambda. Default - `us-east-1`
- `invocation_account_ids`  - list of AWS Accounts allowed to invoke lambda
- `ssm_parameter_name`      - name of SSM Parameter wioth access settings. Default - `dv360proxy`

### Manual deployment

Also it possible to pack the function manually and upload to AWS console. Following env variables need to be set:

* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_REFRESH_TOKEN`

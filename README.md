# DV360 Proxy

This solution acts as a proxy to access DV360 reports without giving direct access to DV360 API.
It solves three tasks:
- Whitelists advertisers allowed to access
- Blacklist metrics not allowed to access
- Log of requests made

Except of this is acts as a proxy, with no modification of requests and responses.


# Overview

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

# Configuration

## Access to DV360 API

`aws ssm put-parameter --name "dv360proxy.credentials"  --value file://credentials.json --type "SecureString" --overwrite --region=us-east-1`

## Allowed Partners, Advertisers and blacklisted metrics

Lambda is configured using two SSM parameters. The first one 

`aws ssm put-parameter --name "dv360proxy.config"  --value file://config.json --type "String" --overwrite --region=us-east-1`



# Deploymnet

Lambda function can be deployed using AWS SAM using the following commands

```
sam build
sam deploy
```

Also it possible to pack the function manually and upload to AWS console. Following env variables need to be set:

* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* `GOOGLE_REFRESH_TOKEN`

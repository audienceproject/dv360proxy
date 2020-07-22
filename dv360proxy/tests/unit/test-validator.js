'use strict';

const validator = require('../../validator');
const chai = require('chai');
const {
  assert
} = require('console');
const expect = chai.expect;

describe('Valitator', async function () {
  it('Checks that requests are filtered by advertisers', async () => {
    const request = {
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
    };

    const config = {
      "partners": [{
          "id": "1",
          "advertisers": [{
            "id": "2"
          }]
        },
        {
          "id": "2",
          "advertisers": [{
            "id": "1",
            "blacklistMetrics": ["_COST_"]
          }]
        }
      ]
    };

    const result = await validator(config, request);

    expect(result).to.deep.include({
      valid: false
    });
  });

  it('Checks that requests are filtered by correct advertisers', async () => {
    const request = {
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
    };

    const config = {
      "partners": [{
          "id": "1",
          "advertisers": [{
            "id": "2"
          }]
        },
        {
          "id": "2",
          "advertisers": [{
            "id": "1",
            "blacklistMetrics": ["_COST_"]
          }]
        }
      ]
    };

    const result = await validator(config, request);

    expect(result).to.equal(true);
  });

  it('Does not allow not whitelisted advertisers', async () => {
    const request = {
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
              },
              {
                "type": "FILTER_ADVERTISER",
                "value": "3"
              }
            ],
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
    };

    const config = {
      "partners": [{
          "id": "1",
          "advertisers": [{
            "id": "2"
          }]
        },
        {
          "id": "2",
          "advertisers": [{
            "id": "1",
            "blacklistMetrics": ["_COST_"]
          }]
        }
      ]
    };

    const result = await validator(config, request);

    expect(result).to.include({
      valid: false
    });
  });

  it('Does not allow blacklisted metrics', async () => {
    const request = {
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
            }, ],
            "metrics": [
              "METRIC_IMPRESSIONS",
              "METRIC_MEDIA_COST_USD"
            ]
          },
          "schedule": {
            "frequency": "ONE_TIME"
          },
          "timezoneCode": "UTC"
        }
      }
    };

    const config = {
      "partners": [{
          "id": "1",
          "advertisers": [{
            "id": "2"
          }]
        },
        {
          "id": "2",
          "advertisers": [{
            "id": "1",
            "blacklistMetrics": ["_COST_"]
          }]
        }
      ]
    };

    const result = await validator(config, request);

    expect(result).to.include({
      valid: false
    });
  });

  it('Does not metric filter if no blacklist passed', async () => {
    const request = {
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
    };

    const config = {
      "partners": [{
          "id": "1",
          "advertisers": [{
            "id": "1"
          }]
        }]
    };

    const result = await validator(config, request);

    expect(result).to.equal(true);
  });
});
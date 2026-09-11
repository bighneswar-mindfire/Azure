@description('Azure region')
param location string

@description('Email address to notify on alerts')
param alertEmail string

@description('Resource ID of the Web App')
param webAppId string

@description('Resource ID of the Function App')
param functionAppId string

@description('Resource ID of the Postgres Flexible Server')
param postgresServerId string

@description('Resource ID of the Application Insights resource')
param appInsightsId string

@description('URL to ping for the availability test')
param webAppHealthUrl string

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'clinicworks-alerts'
  location: 'global'
  properties: {
    groupShortName: 'CWAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'email-me'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: 'clinicworks-web-health'
  location: location
  tags: {
    'hidden-link:${appInsightsId}': 'Resource'
  }
  properties: {
    SyntheticMonitorId: 'clinicworks-web-health'
    Name: 'clinicworks-web-health'
    Enabled: true
    Frequency: 300
    Timeout: 30
    Kind: 'ping'
    Locations: [
      { Id: 'us-tx-sn1-azr' }
      { Id: 'us-il-ch1-azr' }
      { Id: 'emea-nl-ams-azr' }
    ]
    Configuration: {
      WebTest: '<WebTest Name="clinicworks-web-health" Enabled="True" Timeout="30"><Items><Request Method="GET" Url="${webAppHealthUrl}" ExpectedHttpStatusCode="200" /></Items></WebTest>'
    }
  }
}

resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicworks-availability-alert'
  location: 'global'
  properties: {
    severity: 1
    enabled: true
    scopes: [availabilityTest.id, appInsightsId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: availabilityTest.id
      componentId: appInsightsId
      failedLocationCount: 1
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource webAppCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicworks-webapp-high-cpu-time'
  location: 'global'
  properties: {
    severity: 2
    enabled: true
    scopes: [webAppId]
    evaluationFrequency: 'PT1H'
    windowSize: 'P1D'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCpuTime'
          metricName: 'CpuTime'
          operator: 'GreaterThan'
          threshold: 3000
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource webAppMemoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicworks-webapp-high-memory'
  location: 'global'
  properties: {
    severity: 2
    enabled: true
    scopes: [webAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          metricName: 'MemoryWorkingSet'
          operator: 'GreaterThan'
          threshold: 367001600
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource webAppHttpErrorsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicworks-webapp-http-errors'
  location: 'global'
  properties: {
    severity: 1
    enabled: true
    scopes: [webAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xx'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource functionHttpErrorsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicworks-function-http-errors'
  location: 'global'
  properties: {
    severity: 1
    enabled: true
    scopes: [functionAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xx'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource dbFailedConnectionsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'clinicdata-db-failed-connections'
  location: 'global'
  properties: {
    severity: 1
    enabled: true
    scopes: [postgresServerId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailedConnections'
          metricName: 'connections_failed'
          operator: 'GreaterThan'
          threshold: 0
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

// "Failed document-processing jobs" - custom event emitted by the Function
// (see function/src/telemetry.ts) whenever the pipeline's catch block runs.
resource failedProcessingAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'clinicworks-failed-processing-jobs'
  location: location
  properties: {
    severity: 1
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    scopes: [appInsightsId]
    criteria: {
      allOf: [
        {
          query: 'customEvents | where name == "DocumentProcessingFailed"'
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

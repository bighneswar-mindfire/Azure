@description('Name of the Logic App')
param logicAppName string

@description('Azure region')
param location string

@description('Storage account name holding the clinical-documents container')
param storageAccountName string

@secure()
@description('Storage account access key, used for the Blob Storage API connection')
param storageAccountKey string

@description('URL of the processing Function App, e.g. https://clinicworks-processor.azurewebsites.net/api/processDocument')
param processingFunctionBaseUrl string

// Managed API connection to Azure Blob Storage - required by the Logic
// App's blob trigger (Consumption Logic Apps use connector-based triggers,
// not a direct storage account reference).
resource blobConnection 'Microsoft.Web/connections@2016-06-01' = {
  name: 'azureblob'
  location: location
  properties: {
    displayName: storageAccountName
    api: {
      id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
    }
    parameterValues: {
      accountName: storageAccountName
      accessKey: storageAccountKey
    }
  }
}

// Workflow: Document Uploaded (blob trigger) -> extract document ID from
// blob filename -> HTTP POST to the Function's processDocument endpoint.
// This mirrors the exact design built via the portal designer: a "When a
// blob is added or modified (properties only) (V2)" trigger fires once per
// blob (not a batch/list, despite the connector's field naming), a Compose
// step strips the file extension to recover the document ID, then a plain
// HTTP action calls the Function - no For-each loop needed.
resource logicApp 'Microsoft.Logic/workflows@2019-05-01' = {
  name: logicAppName
  location: location
  properties: {
    state: 'Enabled'
    parameters: {
      '$connections': {
        value: {
          azureblob: {
            connectionId: blobConnection.id
            connectionName: 'azureblob'
            id: subscriptionResourceId('Microsoft.Web/locations/managedApis', location, 'azureblob')
          }
        }
      }
      processingFunctionBaseUrl: {
        value: processingFunctionBaseUrl
      }
    }
    definition: {
      '$schema': 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'
      contentVersion: '1.0.0.0'
      parameters: {
        '$connections': {
          defaultValue: {}
          type: 'Object'
        }
        processingFunctionBaseUrl: {
          defaultValue: ''
          type: 'String'
        }
      }
      triggers: {
        When_a_blob_is_added_or_modified: {
          type: 'ApiConnection'
          inputs: {
            host: {
              connection: {
                referenceName: 'azureblob'
              }
            }
            method: 'get'
            path: '/datasets/default/triggers/batch/onupdatedfile'
            queries: {
              folderId: '/clinical-documents'
              maxFileCount: 10
            }
          }
          recurrence: {
            frequency: 'Minute'
            interval: 1
          }
        }
      }
      actions: {
        Compose: {
          type: 'Compose'
          inputs: '@split(triggerBody()?[\'Name\'], \'.\')[0]'
        }
        HTTP: {
          type: 'Http'
          runAfter: {
            Compose: ['Succeeded']
          }
          inputs: {
            method: 'POST'
            uri: '@{parameters(\'processingFunctionBaseUrl\')}/@{outputs(\'Compose\')}'
          }
        }
      }
      outputs: {}
    }
  }
}

output logicAppName string = logicApp.name

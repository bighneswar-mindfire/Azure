@description('Name of the Web App')
param webAppName string

@description('Azure region')
param location string

@description('Key Vault name holding the secrets this app needs')
param keyVaultName string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Azure Storage container name for documents')
param storageContainerName string

@description('URL of the processing Function App')
param processingFunctionUrl string

@description('App Service Plan SKU - F1 (free) or B1 (basic, no daily quota)')
param skuName string = 'F1'

resource appPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${webAppName}-plan'
  location: location
  sku: {
    name: skuName
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appPlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        {
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/AzureStorageConnectionString/)'
        }
        {
          name: 'AZURE_STORAGE_CONTAINER'
          value: storageContainerName
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/DatabaseUrl/)'
        }
        {
          name: 'PROCESSING_FUNCTION_URL'
          value: processingFunctionUrl
        }
        {
          name: 'PROCESSING_FUNCTION_KEY'
          value: ''
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
    }
  }
}

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output principalId string = webApp.identity.principalId

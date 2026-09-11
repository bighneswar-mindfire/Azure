@description('Name of the Function App')
param functionAppName string

@description('Azure region')
param location string

@description('Key Vault name holding the secrets this Function needs')
param keyVaultName string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Azure Storage container name for documents')
param storageContainerName string

@description('Gemini model name (non-secret)')
param geminiModel string = 'gemini-3.6-flash'

@description('Document Intelligence endpoint URL (non-secret)')
param docIntelEndpoint string

// Windows Consumption plan (Y1) - the free-tier-compatible SKU for Function Apps.
resource functionPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: functionPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/AzureStorageConnectionString/)'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
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
          name: 'AZURE_DOC_INTEL_ENDPOINT'
          value: docIntelEndpoint
        }
        {
          name: 'AZURE_DOC_INTEL_KEY'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/AzureDocIntelKey/)'
        }
        {
          name: 'GEMINI_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/GeminiApiKey/)'
        }
        {
          name: 'GEMINI_MODEL'
          value: geminiModel
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
      ]
    }
  }
}

output functionAppName string = functionApp.name
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'
output principalId string = functionApp.identity.principalId

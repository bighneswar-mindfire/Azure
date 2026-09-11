@description('Name of the existing Key Vault to add secrets to')
param keyVaultName string

@secure()
param storageConnectionString string

@secure()
param databaseUrl string

@secure()
param docIntelKey string

@secure()
param geminiApiKey string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource storageSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AzureStorageConnectionString'
  properties: {
    value: storageConnectionString
  }
}

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DatabaseUrl'
  properties: {
    value: databaseUrl
  }
}

resource docIntelKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AzureDocIntelKey'
  properties: {
    value: docIntelKey
  }
}

resource geminiApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'GeminiApiKey'
  properties: {
    value: geminiApiKey
  }
}

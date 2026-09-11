@description('Name of the Document Intelligence (Cognitive Services) resource')
param accountName string

@description('Azure region')
param location string

@description('Pricing tier - F0 (free, 500 pages/month) or S0 (standard)')
param skuName string = 'S0'

resource docIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: accountName
  location: location
  kind: 'FormRecognizer'
  sku: {
    name: skuName
  }
  properties: {
    customSubDomainName: accountName
    publicNetworkAccess: 'Enabled'
  }
}

output endpoint string = docIntelligence.properties.endpoint
output accountName string = docIntelligence.name

// ClinicWorks infrastructure as code.
//
// This documents the full architecture as deployed manually through the
// Azure Portal during development. It is NOT wired into CI/CD and has not
// been deployed from this file - the live resources were created by hand,
// and this exists as an IaC reference/deliverable. Applying it against the
// existing subscription could conflict with those manually-created
// resources (differing SKUs, regions chosen to work around quota limits,
// etc.) - review carefully and consider a fresh resource group before ever
// running `az deployment group create` against this.
//
// Resource locations are independently parameterized (not a single
// `location` for everything) because the actual deployment hit per-SKU
// regional quota limits on a free/trial subscription - Postgres and the
// Function App's Y1 plan needed different regions than Storage/Key Vault,
// and the Web App ended up in yet another region. Defaults below reflect
// what actually worked; adjust if your subscription's quotas differ.

@description('Resource group location for most resources')
param location string = 'eastus'

@description('Region for the Postgres Flexible Server (may need to differ due to Y1/Postgres quota limits)')
param postgresLocation string = 'eastus2'

@description('Region for the Function App (Y1 Windows Consumption plan quota can be region-restricted on free/trial subscriptions)')
param functionLocation string = 'centralus'

@description('Region for the Web App')
param webAppLocation string = 'centralindia'

@description('Globally-unique storage account name (lowercase letters/numbers only)')
param storageAccountName string

@description('Postgres Flexible Server name')
param postgresServerName string

@description('Postgres admin username')
param postgresAdminUsername string

@secure()
@description('Postgres admin password')
param postgresAdminPassword string

@description('Document Intelligence resource name')
param docIntelName string

@description('Application Insights resource name')
param appInsightsName string

@description('Globally-unique Key Vault name')
param keyVaultName string

@description('Function App name')
param functionAppName string

@description('Web App name')
param webAppName string

@secure()
@description('Document Intelligence API key (from the deployed resource, or leave blank on first run and set the Key Vault secret manually afterward)')
param docIntelKey string

@secure()
@description('Gemini API key (from aistudio.google.com)')
param geminiApiKey string

@description('Email address for monitoring alerts')
param alertEmail string

// --- Storage ---
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    storageAccountName: storageAccountName
    location: location
  }
}

// --- Database ---
module postgres 'modules/postgresql.bicep' = {
  name: 'postgres'
  params: {
    serverName: postgresServerName
    location: postgresLocation
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
  }
}

var databaseUrl = 'postgresql://${postgresAdminUsername}:${uriComponent(postgresAdminPassword)}@${postgres.outputs.serverFqdn}:5432/${postgres.outputs.databaseName}?sslmode=require'

// --- OCR ---
module documentIntelligence 'modules/documentIntelligence.bicep' = {
  name: 'documentIntelligence'
  params: {
    accountName: docIntelName
    location: location
  }
}

// --- Observability ---
module appInsights 'modules/appInsights.bicep' = {
  name: 'appInsights'
  params: {
    appInsightsName: appInsightsName
    location: location
  }
}

// --- Secrets ---
module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  params: {
    keyVaultName: keyVaultName
    location: location
  }
}

module keyVaultSecrets 'modules/keyVaultSecrets.bicep' = {
  name: 'keyVaultSecrets'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    storageConnectionString: storage.outputs.primaryConnectionString
    databaseUrl: databaseUrl
    docIntelKey: docIntelKey
    geminiApiKey: geminiApiKey
  }
}

// --- Compute ---
module functionApp 'modules/functionApp.bicep' = {
  name: 'functionApp'
  params: {
    functionAppName: functionAppName
    location: functionLocation
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: appInsights.outputs.connectionString
    storageContainerName: 'clinical-documents'
    docIntelEndpoint: documentIntelligence.outputs.endpoint
  }
}

module webApp 'modules/webApp.bicep' = {
  name: 'webApp'
  params: {
    webAppName: webAppName
    location: webAppLocation
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsConnectionString: appInsights.outputs.connectionString
    storageContainerName: 'clinical-documents'
    processingFunctionUrl: '${functionApp.outputs.functionAppUrl}/api'
  }
}

// --- Grant both apps' managed identities read access to Key Vault secrets ---
module functionKeyVaultAccess 'modules/keyVaultAccess.bicep' = {
  name: 'functionKeyVaultAccess'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    principalId: functionApp.outputs.principalId
  }
}

module webAppKeyVaultAccess 'modules/keyVaultAccess.bicep' = {
  name: 'webAppKeyVaultAccess'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    principalId: webApp.outputs.principalId
  }
}

// --- Orchestration ---
module logicApp 'modules/logicApp.bicep' = {
  name: 'logicApp'
  params: {
    logicAppName: 'clinicworks-processing-workflow'
    location: location
    storageAccountName: storage.outputs.storageAccountName
    storageAccountKey: listKeys(resourceId('Microsoft.Storage/storageAccounts', storageAccountName), '2023-01-01').keys[0].value
    processingFunctionBaseUrl: '${functionApp.outputs.functionAppUrl}/api/processDocument'
  }
}

// --- Monitoring ---
module alerts 'modules/alerts.bicep' = {
  name: 'alerts'
  params: {
    location: location
    alertEmail: alertEmail
    webAppId: resourceId('Microsoft.Web/sites', webAppName)
    functionAppId: resourceId('Microsoft.Web/sites', functionAppName)
    postgresServerId: resourceId('Microsoft.DBforPostgreSQL/flexibleServers', postgresServerName)
    appInsightsId: appInsights.outputs.appInsightsId
    webAppHealthUrl: '${webApp.outputs.webAppUrl}/api/health'
  }
  dependsOn: [
    postgres
  ]
}

output webAppUrl string = webApp.outputs.webAppUrl
output functionAppUrl string = functionApp.outputs.functionAppUrl
output keyVaultUri string = keyVault.outputs.keyVaultUri

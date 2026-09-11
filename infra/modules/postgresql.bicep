@description('Name of the PostgreSQL Flexible Server')
param serverName string

@description('Azure region (may need to differ from the main deployment region if the subscription has Y1/Postgres quota restrictions there - see README)')
param location string

@description('Database admin username')
param administratorLogin string

@secure()
@description('Database admin password')
param administratorLoginPassword string

@description('Application database name')
param databaseName string = 'clinicworks'

@description('Client IP addresses allowed to connect (for local development). Use 0.0.0.0-255.255.255.255 to allow all, only for dev/demo purposes.')
param allowedIpStart string = '0.0.0.0'
param allowedIpEnd string = '255.255.255.255'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: serverName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: databaseName
}

resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowConfiguredRange'
  properties: {
    startIpAddress: allowedIpStart
    endIpAddress: allowedIpEnd
  }
}

resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = database.name

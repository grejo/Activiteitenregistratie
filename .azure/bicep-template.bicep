// Azure Bicep Template voor Activiteiten X-Factor
// Deploy met: az deployment group create --resource-group RG_Webapp_Bouw-tech --template-file .azure/bicep-template.bicep

@description('De naam van de applicatie (gebruikt voor resource naming)')
param appName string = 'activiteiten-xfactor'

@description('De Azure regio waar resources worden gedeployed')
param location string = resourceGroup().location

@description('De pricing tier voor de App Service Plan')
@allowed([
  'F1'
  'B1'
  'S1'
  'P1V2'
])
param appServicePlanSku string = 'B1'

@description('Node.js versie')
param nodeVersion string = '22-lts'

@description('PostgreSQL admin gebruikersnaam')
param postgresAdminUsername string = 'activiteiten_xfactor_admin'

@secure()
@description('PostgreSQL admin wachtwoord')
param postgresAdminPassword string

@secure()
@description('NextAuth secret (genereer met: openssl rand -base64 32)')
param nextAuthSecret string

@description('Azure AD Client ID')
param azureAdClientId string = ''

@secure()
@description('Azure AD Client Secret')
param azureAdClientSecret string = ''

@description('Azure AD Tenant ID')
param azureAdTenantId string = ''

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: appServicePlanSku
  }
  properties: {
    reserved: true
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '${appName}-db'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminUsername
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 35
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2022-12-01' = {
  parent: postgresServer
  name: replace(appName, '-', '_')
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// PostgreSQL Firewall Rule - Allow Azure Services
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2022-12-01' = {
  parent: postgresServer
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// App Service
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-app'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|${nodeVersion}'
      appCommandLine: 'node server.js'
      alwaysOn: appServicePlanSku != 'F1'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${postgresAdminUsername}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${replace(appName, '-', '_')}?sslmode=require'
        }
        {
          name: 'NEXTAUTH_URL'
          value: 'https://${appName}-app.azurewebsites.net'
        }
        {
          name: 'AUTH_SECRET'
          value: nextAuthSecret
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: nodeVersion
        }
        {
          name: 'AZURE_AD_CLIENT_ID'
          value: azureAdClientId
        }
        {
          name: 'AZURE_AD_CLIENT_SECRET'
          value: azureAdClientSecret
        }
        {
          name: 'AZURE_AD_TENANT_ID'
          value: azureAdTenantId
        }
        {
          name: 'UPLOAD_DIR'
          value: '/home/uploads'
        }
        {
          name: 'NEXT_PUBLIC_ENVIRONMENT'
          value: 'production'
        }
      ]
    }
    httpsOnly: true
  }
}

// Storage Account voor database backups
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: replace('${appName}backups', '-', '')
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Cool'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

// Blob container voor database backups
resource backupContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/db-backups'
  properties: {
    publicAccess: 'None'
  }
}

// Outputs
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppName string = webApp.name
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseConnectionString string = 'postgresql://${postgresAdminUsername}:***@${postgresServer.properties.fullyQualifiedDomainName}:5432/${replace(appName, '-', '_')}?sslmode=require'
output storageAccountName string = storageAccount.name

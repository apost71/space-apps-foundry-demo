param name string
param location string = resourceGroup().location
param tags object = {}

param containerRegistryName string
param identityName string
param containerAppsEnvironmentName string
param azureExistingAIProjectResourceId string
param agentDeploymentName string
param searchConnectionName string
param embeddingDeploymentName string
param aiSearchIndexName string
param embeddingDeploymentDimensions string
param searchServiceEndpoint string
param agentName string
param agentID string
param enableAzureMonitorTracing bool
param otelInstrumentationGenAICaptureMessageContent bool
param projectEndpoint string
param searchConnectionId string
param storageAccountResourceId string = ''
param blobContainerName string = ''
param useAzureAISearch bool = false
param useStorageAccount bool = true
@secure()
param jevApiKey string = ''
param useTypesafeJev bool = false

var kvName = 'kv-${replace(name, '-', '')}'

resource kv 'Microsoft.KeyVault/vaults@2023-07-01' = if (useTypesafeJev) {
  name: kvName
  location: location
  tags: tags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    networkAcls: { bypass: 'AzureServices', defaultAction: 'Allow' }
  }
}

resource kvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (useTypesafeJev) {
  name: guid(kv.id, apiIdentity.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: kv
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: apiIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource jevSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (useTypesafeJev) {
  name: 'jev-api-key'
  parent: kv
  properties: { value: jevApiKey }
  dependsOn: [kvSecretsUser]
}

var jevKvUri = useTypesafeJev ? '${kv.properties.vaultUri}secrets/jev-api-key' : ''

resource apiIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

var baseEnv = [
  {
    name: 'AZURE_CLIENT_ID'
    value: apiIdentity.properties.clientId
  }
  {
    name: 'AZURE_EXISTING_AIPROJECT_RESOURCE_ID'
    value: azureExistingAIProjectResourceId
  }
  {
    name: 'AZURE_AI_AGENT_NAME'
    value: agentName
  }
  {
    name: 'AZURE_EXISTING_AGENT_ID'
    value: agentID
  }
  {
    name: 'AZURE_AI_AGENT_DEPLOYMENT_NAME'
    value: agentDeploymentName
  }
  {
    name: 'AZURE_AI_EMBED_DEPLOYMENT_NAME'
    value: embeddingDeploymentName
  }
  {
    name: 'AZURE_AI_SEARCH_INDEX_NAME'
    value: aiSearchIndexName
  }
  {
    name: 'AZURE_AI_EMBED_DIMENSIONS'
    value: embeddingDeploymentDimensions
  }
  {
    name: 'RUNNING_IN_PRODUCTION'
    value: 'true'
  }
  {
    name: 'AZURE_AI_SEARCH_CONNECTION_NAME'
    value: searchConnectionName
  }
  {
    name: 'AZURE_AI_SEARCH_ENDPOINT'
    value: searchServiceEndpoint
  }
  {
    name: 'ENABLE_AZURE_MONITOR_TRACING'
    value: enableAzureMonitorTracing
  }
  {
    name: 'OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT'
    value: otelInstrumentationGenAICaptureMessageContent
  }
  {
    name: 'AZURE_EXISTING_AIPROJECT_ENDPOINT'
    value: projectEndpoint
  }
  {
    name: 'SEARCH_CONNECTION_ID'
    value: searchConnectionId
  }
  {
    name: 'USE_AZURE_AI_SEARCH_SERVICE'
    value: string(useAzureAISearch)
  }
]

var storageEnv = [
  {
    name: 'STORAGE_ACCOUNT_RESOURCE_ID'
    value: storageAccountResourceId
  }
  {
    name: 'AZURE_BLOB_CONTAINER_NAME'
    value: blobContainerName
  }
  {
    name: 'USE_STORAGE_ACCOUNT'
    value: string(useStorageAccount)
  }
]

var jevEnv = useTypesafeJev && !empty(jevApiKey) ? [
  {
    name: 'JEV_API_KEY'
    secretRef: 'jev-api-key'
  }
  {
    name: 'USE_TYPESAFE_JEV'
    value: string(useTypesafeJev)
  }
] : []

var env = concat(baseEnv, useStorageAccount ? storageEnv : [
  {
    name: 'USE_STORAGE_ACCOUNT'
    value: string(useStorageAccount)
  }
], jevEnv)



module app 'core/host/container-app-upsert.bicep' = {
  name: 'container-app-module'
  params: {
    name: name
    location: location
    tags: union(tags, { 'azd-service-name': 'api_and_frontend' })
    identityName: apiIdentity.name
    containerRegistryName: containerRegistryName
    containerAppsEnvironmentName: containerAppsEnvironmentName
    targetPort: 50505
    env: env
    secrets: useTypesafeJev && !empty(jevApiKey) ? [
      {
        key: 'jev-api-key'
        keyVaultUrl: jevKvUri
      }
    ] : []
  }
}


output SERVICE_API_IDENTITY_PRINCIPAL_ID string = apiIdentity.properties.principalId
output SERVICE_API_NAME string = app.outputs.name
output SERVICE_API_URI string = app.outputs.uri

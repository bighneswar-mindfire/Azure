# ClinicWorks infrastructure (Bicep)

This documents the Azure architecture as infrastructure-as-code:

- Storage account + `clinical-documents` blob container
- PostgreSQL Flexible Server + `clinicworks` database
- Azure AI Document Intelligence
- Application Insights (+ underlying Log Analytics workspace)
- Key Vault, holding the four real secrets (storage connection string,
  database URL, Document Intelligence key, Gemini key)
- Function App (Windows Consumption / Y1) - the clinical processing logic
- Web App (Linux) - frontend + backend
- Logic App (Consumption) - blob-triggered orchestration, matching the
  Document Uploaded -> Logic App -> Function -> Result -> PostgreSQL flow
- Action Group + alert rules (availability, CPU time, memory, HTTP errors,
  DB failed connections, failed document-processing jobs)

**This has not been deployed from these files.** The live resources were
created manually through the Azure Portal during development (see the
project's own history for why - mainly working around per-SKU regional
quota limits on a free/trial subscription). This exists as an IaC
reference/deliverable documenting that architecture in code, not as the
actual provisioning path currently in use.

## Before deploying this for real

- **Different resource group.** Don't point this at the resource group
  holding the existing manually-created resources unless you're deliberately
  replacing them - Bicep will try to reconcile its expected state with
  whatever's already there, which can reset settings or fail outright on
  mismatches.
- **Regional quotas vary by subscription.** The default regions in
  `main.parameters.example.json` are what worked for this project's
  subscription (Postgres and the Function App's Y1 plan needed different
  regions than everything else). Yours may differ - if a module fails with
  `SubscriptionIsOverQuotaForSku`, try a different region for that
  parameter, the same way this project's manual setup did.
- **Key Vault reference propagation.** The Function App and Web App
  modules set their secrets as Key Vault references
  (`@Microsoft.KeyVault(SecretUri=...)`) pointing at the Key Vault module.
  The role assignment granting each app's managed identity read access can
  take a few minutes to propagate. If the apps crash-loop on first
  deployment with an unresolved secret, that's why - restart them once the
  role assignment has had time to take effect. (This exact issue happened
  during the manual setup and caused a Free-tier CPU-time quota trip from
  the resulting restart loop.)
- **Postgres firewall.** `postgresql.bicep` defaults to allowing all IPs
  (`0.0.0.0`-`255.255.255.255`) for simplicity, matching what this project
  ended up using after hitting CGNAT-related connectivity issues locally.
  Narrow this before using real data.
- **Logic App connection.** The Blob Storage API connection
  (`Microsoft.Web/connections`) is created with an inline access key
  parameter value - this is how Consumption Logic Apps authenticate to
  Blob Storage, but means the key is visible in the deployment's parameter
  history. Consider a managed identity connection instead for anything
  beyond a demo.

## Usage

```bash
cp infra/main.parameters.example.json infra/main.parameters.json
# edit main.parameters.json with real values - this file is gitignored

az deployment group create \
  --resource-group <your-resource-group> \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

## Structure

```
infra/
  main.bicep                    - orchestrates all modules
  main.parameters.example.json  - template for real parameter values
  modules/
    storage.bicep
    postgresql.bicep
    documentIntelligence.bicep
    appInsights.bicep
    keyVault.bicep
    keyVaultSecrets.bicep
    keyVaultAccess.bicep        - RBAC role assignment per app identity
    functionApp.bicep
    webApp.bicep
    logicApp.bicep
    alerts.bicep
```

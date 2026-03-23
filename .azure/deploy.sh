#!/bin/bash

# Activiteiten X-Factor Azure Deployment Script
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Activiteiten X-Factor Azure Deployment ===${NC}\n"

if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is niet geïnstalleerd${NC}"
    echo "Installeer via: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Je bent niet ingelogd op Azure${NC}"
    az login
fi

read -p "Resource Group naam [RG_Webapp_Bouw-tech]: " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-RG_Webapp_Bouw-tech}

read -p "Azure regio [westeurope]: " LOCATION
LOCATION=${LOCATION:-westeurope}

read -p "App naam [activiteiten-xfactor]: " APP_NAME
APP_NAME=${APP_NAME:-activiteiten-xfactor}

read -p "App Service Plan SKU (F1/B1/S1/P1V2) [B1]: " SKU
SKU=${SKU:-B1}

read -p "PostgreSQL admin username [activiteiten_xfactor_admin]: " POSTGRES_USER
POSTGRES_USER=${POSTGRES_USER:-activiteiten_xfactor_admin}

read -sp "PostgreSQL admin wachtwoord: " POSTGRES_PASSWORD
echo

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Error: Wachtwoord mag niet leeg zijn${NC}"
    exit 1
fi

read -p "Azure AD Client ID (leeg = SSO uitgeschakeld): " AZURE_AD_CLIENT_ID
read -sp "Azure AD Client Secret: " AZURE_AD_CLIENT_SECRET
echo
read -p "Azure AD Tenant ID: " AZURE_AD_TENANT_ID

NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}NextAuth secret gegenereerd${NC}"

echo -e "\n${YELLOW}=== Configuratie ===${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Locatie: $LOCATION"
echo "App naam: $APP_NAME"
echo "SKU: $SKU"
echo "PostgreSQL gebruiker: $POSTGRES_USER"
echo "Azure AD SSO: $([ -n "$AZURE_AD_CLIENT_ID" ] && echo 'ja' || echo 'nee')"
echo ""

read -p "Doorgaan met deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment geannuleerd"
    exit 1
fi

echo -e "\n${YELLOW}Checking Resource Group...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo "Creating Resource Group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
    echo "Resource Group bestaat al: $RESOURCE_GROUP"
fi

echo -e "\n${YELLOW}Deploying Azure resources via Bicep...${NC}"
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file ".azure/bicep-template.bicep" \
    --parameters \
        appName="$APP_NAME" \
        location="$LOCATION" \
        appServicePlanSku="$SKU" \
        postgresAdminUsername="$POSTGRES_USER" \
        postgresAdminPassword="$POSTGRES_PASSWORD" \
        nextAuthSecret="$NEXTAUTH_SECRET" \
        azureAdClientId="$AZURE_AD_CLIENT_ID" \
        azureAdClientSecret="$AZURE_AD_CLIENT_SECRET" \
        azureAdTenantId="$AZURE_AD_TENANT_ID"

echo -e "\n${YELLOW}Retrieving deployment outputs...${NC}"
WEB_APP_URL=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "bicep-template" \
    --query "properties.outputs.webAppUrl.value" \
    --output tsv)

WEB_APP_NAME=$(az deployment group show \
    --resource-group "$RESOURCE_GROUP" \
    --name "bicep-template" \
    --query "properties.outputs.webAppName.value" \
    --output tsv)

echo -e "\n${GREEN}=== Deployment Succesvol! ===${NC}\n"
echo -e "Web App URL: ${GREEN}$WEB_APP_URL${NC}"
echo -e "Web App naam: $WEB_APP_NAME"
echo ""
echo -e "${YELLOW}Volgende stappen:${NC}"
echo "1. Download publish profile en stel in als GitHub Secret AZURE_WEBAPP_PUBLISH_PROFILE:"
echo "   az webapp deployment list-publishing-profiles --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME --xml"
echo ""
echo "2. Push naar main branch om eerste deployment te starten"
echo ""
echo -e "${GREEN}Success!${NC}"

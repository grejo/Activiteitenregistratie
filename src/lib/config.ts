type Environment = 'local' | 'development' | 'production'

interface Config {
  env: Environment
  isLocal: boolean
  isDev: boolean
  isProd: boolean
  appUrl: string
  database: {
    url: string
  }
  storage: {
    type: 'local' | 'azure'
    localPath: string
    azureConnectionString?: string
    azureContainer: string
  }
  auth: {
    secret: string
    nextAuthUrl: string
  }
  features: {
    debugMode: boolean
    mockData: boolean
    emailNotifications: boolean
  }
  mail: {
    powerAutomateWebhookUrl?: string
  }
}

const getEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV
  if (env === 'production') return 'production'
  if (env === 'development') return 'development'
  return 'local'
}

const env = getEnvironment()

export const config: Config = {
  env,
  isLocal: env === 'local',
  isDev: env === 'development',
  isProd: env === 'production',

  // Basis-URL voor links in mails. APP_URL heeft voorrang; NEXTAUTH_URL/AUTH_URL
  // zijn optioneel (auth werkt via trustHost), dus de fallback moet een bestaand domein zijn.
  appUrl: (
    {
      local: 'http://localhost:3000',
      development:
        process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000',
      production:
        process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://xfactorapp.pxl.be',
    }[env]
  ).replace(/\/+$/, ''),

  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },

  storage: {
    type: env === 'production' && process.env.AZURE_STORAGE_CONNECTION_STRING ? 'azure' : 'local',
    localPath: process.env.UPLOAD_DIR || './uploads',
    azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    azureContainer: process.env.AZURE_STORAGE_CONTAINER || 'uploads',
  },

  auth: {
    secret: process.env.AUTH_SECRET || 'dev-secret',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },

  features: {
    debugMode: env !== 'production',
    mockData: env === 'local',
    emailNotifications: !!process.env.POWER_AUTOMATE_WEBHOOK_URL,
  },

  mail: {
    powerAutomateWebhookUrl: process.env.POWER_AUTOMATE_WEBHOOK_URL,
  },
}

export const isProduction = () => config.isProd
export const isDevelopment = () => config.isDev
export const isLocal = () => config.isLocal

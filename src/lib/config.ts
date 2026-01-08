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

  appUrl: {
    local: 'http://localhost:3000',
    development: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    production: process.env.NEXTAUTH_URL || 'https://pxl-activiteiten.azurewebsites.net',
  }[env],

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
    emailNotifications: env === 'production',
  },
}

export const isProduction = () => config.isProd
export const isDevelopment = () => config.isDev
export const isLocal = () => config.isLocal

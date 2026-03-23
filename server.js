// server.js for Next.js deployment on Azure App Service
const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')
const { execFileSync, spawnSync } = require('child_process')

const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

process.env.NODE_ENV = 'production'

const prismaCli = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js')

// Fix failed migrations by updating _prisma_migrations directly via pg
async function resolveFailedMigration(migrationName) {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query(
      `UPDATE "_prisma_migrations"
       SET "rolled_back_at" = NOW()
       WHERE "migration_name" = $1
         AND "finished_at" IS NULL
         AND "rolled_back_at" IS NULL
       RETURNING "migration_name"`,
      [migrationName]
    )
    console.log(`→ Marked ${result.rowCount} migration(s) as rolled-back in _prisma_migrations`)
    return result.rowCount > 0
  } catch (err) {
    console.error('✗ Could not fix _prisma_migrations:', err.message)
    return false
  } finally {
    await pool.end()
  }
}

async function runMigrations() {
  console.log('=== Running Database Migrations ===')

  const result = spawnSync('node', [prismaCli, 'migrate', 'deploy'], { cwd: __dirname, encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  if (result.status === 0) {
    console.log('✓ Migrations complete')
    console.log('===================================\n')
    return
  }

  const output = (result.stdout || '') + (result.stderr || '')
  if (output.includes('P3009')) {
    const match = output.match(/`(\d{14}_[^`]+)`/)
    if (match) {
      const migrationName = match[1]
      console.log(`→ Failed migration detected: ${migrationName}`)
      console.log('→ Fixing migration state directly in _prisma_migrations...')

      const fixed = await resolveFailedMigration(migrationName)
      if (fixed) {
        console.log('→ Retrying migrate deploy...')
        try {
          execFileSync('node', [prismaCli, 'migrate', 'deploy'], { stdio: 'inherit', cwd: __dirname })
          console.log('✓ Migrations complete (after P3009 resolution)')
          console.log('===================================\n')
          return
        } catch (retryErr) {
          console.error('✗ Migration retry failed:', retryErr.message)
        }
      }
    }
  }

  console.error('✗ Migration failed — continuing anyway (DB may already be up to date)')
  console.log('===================================\n')
}

runMigrations().then(() => {
  console.log('=== Server Starting ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Node version:', process.version)
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Port:', port)
  console.log('Hostname:', hostname)
  console.log('Database configured:', !!process.env.DATABASE_URL)
  console.log('NextAuth URL configured:', !!process.env.NEXTAUTH_URL)
  console.log('Auth Secret configured:', !!process.env.AUTH_SECRET)
  console.log('======================\n')

  const next = require('next')

  const nextApp = next({
    dev: false,
    hostname,
    port,
    dir: __dirname,
  })

  const requestHandler = nextApp.getRequestHandler()

  process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason)
  })

  nextApp.prepare().then(() => {
    createServer(async (req, res) => {
      const startTime = Date.now()
      try {
        console.log(`→ ${req.method} ${req.url}`)
        const originalEnd = res.end
        res.end = function(...args) {
          console.log(`← ${req.method} ${req.url} ${res.statusCode} (${Date.now() - startTime}ms)`)
          return originalEnd.apply(res, args)
        }
        const parsedUrl = parse(req.url, true)
        await requestHandler(req, res, parsedUrl)
      } catch (err) {
        console.error(`Request handler error for ${req.method} ${req.url}:`, err)
        res.statusCode = 500
        res.end('Internal server error')
      }
    })
      .once('error', (err) => {
        console.error('Server startup error:', err)
        process.exit(1)
      })
      .listen(port, hostname, () => {
        console.log(`\n=== Server Ready ===`)
        console.log(`> URL: http://${hostname}:${port}`)
        console.log(`> Started at: ${new Date().toISOString()}`)
        console.log('===================\n')
      })
  }).catch((err) => {
    console.error('Failed to prepare Next.js:', err)
    process.exit(1)
  })
}).catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})

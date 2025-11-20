#!/usr/bin/env tsx

/**
 * PulseGen Setup Script
 * Interactive CLI for local development setup
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}→ ${msg}${colors.reset}`),
};

interface SetupConfig {
  useDocker: boolean;
  useRedis: boolean;
  postgresPassword: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  encryptionKey: string;
  adminEmail: string;
  adminPassword: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  emailFrom: string;
  appUrl: string;
  apiUrl: string;
}

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}?${colors.reset} ${query} `, resolve);
  });
}

function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

async function checkPrerequisites(useDocker: boolean): Promise<boolean> {
  log.step('Checking prerequisites...');

  const required = useDocker
    ? ['docker', 'docker-compose']
    : ['node', 'npm', 'psql'];

  let allPresent = true;

  for (const cmd of required) {
    try {
      execSync(`command -v ${cmd}`, { stdio: 'ignore' });
      log.success(`${cmd} is installed`);
    } catch (error) {
      log.error(`${cmd} is not installed`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function gatherConfiguration(): Promise<SetupConfig> {
  log.step('Configuration');

  const useDockerResponse = await question('Use Docker for setup? (y/n) [y]: ');
  const useDocker = useDockerResponse.toLowerCase() !== 'n';

  const useRedisResponse = await question('Use Redis for caching? (recommended for production) (y/n) [y]: ');
  const useRedis = useRedisResponse.toLowerCase() !== 'n';

  const postgresPassword = await question('PostgreSQL password [auto-generated]: ') || generateSecret(16);
  const adminEmail = await question('Admin email [admin@example.com]: ') || 'admin@example.com';
  const adminPassword = await question('Admin password [admin123]: ') || 'admin123';

  log.info('Generating security secrets...');
  const jwtSecret = generateSecret(32);
  const jwtRefreshSecret = generateSecret(32);
  const encryptionKey = generateSecret(32);

  log.step('SMTP Configuration (optional - press Enter to skip)');
  const smtpHost = await question('SMTP Host [smtp.gmail.com]: ') || 'smtp.gmail.com';
  const smtpPort = await question('SMTP Port [587]: ') || '587';
  const smtpUser = await question('SMTP Username: ');
  const smtpPass = await question('SMTP Password: ');
  const emailFrom = await question('From Email [noreply@pulsegen.com]: ') || 'noreply@pulsegen.com';

  const appUrl = await question('Application URL [http://localhost:3000]: ') || 'http://localhost:3000';
  const apiUrl = await question('API URL [http://localhost:5000]: ') || 'http://localhost:5000';

  return {
    useDocker,
    useRedis,
    postgresPassword,
    jwtSecret,
    jwtRefreshSecret,
    encryptionKey,
    adminEmail,
    adminPassword,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    emailFrom,
    appUrl,
    apiUrl,
  };
}

function createEnvFile(config: SetupConfig, envPath: string): void {
  const envContent = `# Database
DATABASE_URL=postgresql://postgres:${config.postgresPassword}@localhost:5432/pulsegen
POSTGRES_PASSWORD=${config.postgresPassword}

# Redis (Optional)
${config.useRedis ? `REDIS_URL=redis://localhost:6379` : '# REDIS_URL=redis://localhost:6379'}
${config.useRedis ? `USE_CACHE=true` : 'USE_CACHE=false'}

# JWT Secrets
JWT_SECRET=${config.jwtSecret}
JWT_REFRESH_SECRET=${config.jwtRefreshSecret}

# Encryption Key
ENCRYPTION_KEY=${config.encryptionKey}

# Optional: Default System AI Keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Email Configuration (SMTP)
SMTP_HOST=${config.smtpHost}
SMTP_PORT=${config.smtpPort}
SMTP_USER=${config.smtpUser}
SMTP_PASS=${config.smtpPass}
EMAIL_FROM=${config.emailFrom}

# Application URLs
APP_URL=${config.appUrl}
VITE_API_URL=${config.apiUrl}
CORS_ORIGIN=${config.appUrl}

# Admin User (Created on first run)
ADMIN_EMAIL=${config.adminEmail}
ADMIN_PASSWORD=${config.adminPassword}

# Node Environment
NODE_ENV=development
PORT=5000
`;

  fs.writeFileSync(envPath, envContent);
  log.success(`Created ${envPath}`);
}

function createFrontendEnv(config: SetupConfig): void {
  const frontendEnvPath = path.join(process.cwd(), 'frontend', '.env');
  const frontendEnvContent = `VITE_API_URL=${config.apiUrl}
`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  log.success('Created frontend/.env');
}

function createAutomationToolEnv(config: SetupConfig): void {
  const automationEnvPath = path.join(process.cwd(), 'automation-tool', '.env');
  if (fs.existsSync(path.dirname(automationEnvPath))) {
    const automationEnvContent = `VITE_API_URL=${config.apiUrl}
`;
    fs.writeFileSync(automationEnvPath, automationEnvContent);
    log.success('Created automation-tool/.env');
  }
}

async function setupDocker(config: SetupConfig): Promise<void> {
  log.step('Setting up Docker containers...');

  try {
    // Stop existing containers
    log.info('Stopping existing containers...');
    execSync('docker-compose down', { stdio: 'inherit' });

    // Build and start containers
    log.info('Building and starting containers...');
    const composeCmd = config.useRedis
      ? 'docker-compose --profile with-redis up -d'
      : 'docker-compose up -d postgres backend frontend';

    execSync(composeCmd, { stdio: 'inherit' });

    log.success('Docker containers started');

    // Wait for services to be ready
    log.info('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    log.error('Failed to setup Docker containers');
    throw error;
  }
}

async function setupLocal(config: SetupConfig): Promise<void> {
  log.step('Setting up local environment...');

  try {
    // Install backend dependencies
    log.info('Installing backend dependencies...');
    execSync('cd backend && npm install', { stdio: 'inherit' });

    // Generate Prisma client
    log.info('Generating Prisma client...');
    execSync('cd backend && npx prisma generate', { stdio: 'inherit' });

    // Run migrations
    log.info('Running database migrations...');
    execSync('cd backend && npx prisma migrate dev --name init', { stdio: 'inherit' });

    // Seed database
    log.info('Seeding database...');
    execSync('cd backend && npm run prisma:seed', { stdio: 'inherit' });

    // Install frontend dependencies
    log.info('Installing frontend dependencies...');
    execSync('cd frontend && npm install', { stdio: 'inherit' });

    // Install automation tool dependencies
    if (fs.existsSync('automation-tool')) {
      log.info('Installing automation tool dependencies...');
      execSync('cd automation-tool && npm install', { stdio: 'inherit' });
    }

    log.success('Local environment setup complete');

  } catch (error) {
    log.error('Failed to setup local environment');
    throw error;
  }
}

async function showNextSteps(config: SetupConfig): Promise<void> {
  console.log(`\n${colors.bright}${colors.green}Setup completed successfully!${colors.reset}\n`);

  console.log(`${colors.bright}Next Steps:${colors.reset}\n`);

  if (config.useDocker) {
    console.log(`1. Check container status:`);
    console.log(`   ${colors.cyan}docker-compose ps${colors.reset}\n`);

    console.log(`2. View logs:`);
    console.log(`   ${colors.cyan}docker-compose logs -f backend${colors.reset}\n`);

    console.log(`3. Access the applications:`);
    console.log(`   Frontend: ${colors.cyan}${config.appUrl}${colors.reset}`);
    console.log(`   Backend:  ${colors.cyan}${config.apiUrl}${colors.reset}`);
    console.log(`   Automation Tool: ${colors.cyan}http://localhost:3001${colors.reset}\n`);

    console.log(`4. Stop containers:`);
    console.log(`   ${colors.cyan}docker-compose down${colors.reset}\n`);
  } else {
    console.log(`1. Start PostgreSQL (if not running):`);
    console.log(`   ${colors.cyan}pg_ctl start${colors.reset}\n`);

    if (config.useRedis) {
      console.log(`2. Start Redis (if not running):`);
      console.log(`   ${colors.cyan}redis-server${colors.reset}\n`);
    }

    console.log(`${config.useRedis ? '3' : '2'}. Start the backend:`);
    console.log(`   ${colors.cyan}cd backend && npm run dev${colors.reset}\n`);

    console.log(`${config.useRedis ? '4' : '3'}. Start the frontend (in a new terminal):`);
    console.log(`   ${colors.cyan}cd frontend && npm run dev${colors.reset}\n`);

    console.log(`${config.useRedis ? '5' : '4'}. Start the automation tool (optional, in a new terminal):`);
    console.log(`   ${colors.cyan}cd automation-tool && npm run dev${colors.reset}\n`);

    console.log(`${config.useRedis ? '6' : '5'}. Access the applications:`);
    console.log(`   Frontend: ${colors.cyan}${config.appUrl}${colors.reset}`);
    console.log(`   Backend:  ${colors.cyan}${config.apiUrl}${colors.reset}`);
    console.log(`   Automation Tool: ${colors.cyan}http://localhost:3001${colors.reset}\n`);
  }

  console.log(`${colors.bright}Admin Credentials:${colors.reset}`);
  console.log(`   Email:    ${colors.cyan}${config.adminEmail}${colors.reset}`);
  console.log(`   Password: ${colors.cyan}${config.adminPassword}${colors.reset}\n`);

  console.log(`${colors.bright}Documentation:${colors.reset}`);
  console.log(`   Main:       ${colors.cyan}README.md${colors.reset}`);
  console.log(`   Automation: ${colors.cyan}AUTOMATION_TOOL.md${colors.reset}\n`);
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗
║                                       ║
║        PulseGen Setup Wizard          ║
║                                       ║
╚═══════════════════════════════════════╝${colors.reset}
`);

  try {
    // Gather configuration
    const config = await gatherConfiguration();

    // Check prerequisites
    const prereqsSatisfied = await checkPrerequisites(config.useDocker);
    if (!prereqsSatisfied) {
      log.error('Please install missing prerequisites and run again');
      process.exit(1);
    }

    // Create environment files
    log.step('Creating environment files...');
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    createEnvFile(config, backendEnvPath);
    createFrontendEnv(config);
    createAutomationToolEnv(config);

    // Copy root .env for Docker
    const rootEnvPath = path.join(process.cwd(), '.env');
    fs.copyFileSync(backendEnvPath, rootEnvPath);
    log.success('Created .env');

    // Setup based on choice
    if (config.useDocker) {
      await setupDocker(config);
    } else {
      await setupLocal(config);
    }

    // Show next steps
    await showNextSteps(config);

  } catch (error) {
    log.error(`Setup failed: ${error}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
main();

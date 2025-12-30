# PulseGen Setup Script for Windows
# This script helps you set up PulseGen quickly with Docker Compose

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Header {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host "$args" -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host ""
}

# Generate random string
function Generate-Secret {
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes).Substring(0, 32)
}

# Generate hex string
function Generate-Hex {
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ''
}

# Banner
Clear-Host
Write-Host @"
  ____        _           ____
 |  _ \ _   _| |___  ___ / ___| ___ _ __
 | |_) | | | | / __|/ _ \ |  _ / _ \ '_ \
 |  __/| |_| | \__ \  __/ |_| |  __/ | | |
 |_|    \__,_|_|___/\___|\____|\___|_| |_|

         Setup & Installation
"@ -ForegroundColor Blue
Write-Host ""

Write-Info "This script will help you set up PulseGen on your system."
Write-Host ""

# Check prerequisites
Write-Header "Checking Prerequisites"

$missingDeps = 0

try {
    $dockerVersion = (docker --version) -replace '.*version ([^,]+).*','$1'
    Write-Success "Docker found (version $dockerVersion)"
} catch {
    Write-Error "Docker is not installed"
    $missingDeps = 1
}

try {
    try {
        $composeVersion = (docker compose version --short)
        $dockerComposeCmd = "docker compose"
    } catch {
        $composeVersion = (docker-compose --version) -replace '.*version ([^,]+).*','$1'
        $dockerComposeCmd = "docker-compose"
    }
    Write-Success "Docker Compose found (version $composeVersion)"
} catch {
    Write-Error "Docker Compose is not installed"
    $missingDeps = 1
}

try {
    $gitVersion = (git --version) -replace '.*version ([^ ]+).*','$1'
    Write-Success "Git found (version $gitVersion)"
} catch {
    Write-Warning "Git is not installed (optional)"
}

if ($missingDeps -eq 1) {
    Write-Host ""
    Write-Error "Missing required dependencies. Please install them first:"
    Write-Host ""
    Write-Host "  Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    Write-Host ""
    exit 1
}

# Check if .env already exists
$skipEnvCreation = $false
if (Test-Path .env) {
    Write-Host ""
    Write-Warning "An .env file already exists."
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Info "Keeping existing .env file. Skipping configuration."
        $skipEnvCreation = $true
    }
}

# Create .env file
if (-not $skipEnvCreation) {
    Write-Header "Configuring Environment"

    Write-Info "Generating secure random secrets..."

    $postgresPassword = Generate-Secret
    $jwtSecret = Generate-Secret
    $jwtRefreshSecret = Generate-Secret
    $encryptionKey = Generate-Hex

    Write-Success "Secrets generated"

    # Ask for configuration
    Write-Host ""
    Write-Info "Please provide the following information (or press Enter for defaults):"
    Write-Host ""

    $appUrl = Read-Host "Application URL [http://localhost:3001]"
    if ([string]::IsNullOrWhiteSpace($appUrl)) { $appUrl = "http://localhost:3001" }

    $apiUrl = Read-Host "API URL [http://localhost:5001]"
    if ([string]::IsNullOrWhiteSpace($apiUrl)) { $apiUrl = "http://localhost:5001" }

    $adminEmail = Read-Host "Admin Email [admin@example.com]"
    if ([string]::IsNullOrWhiteSpace($adminEmail)) { $adminEmail = "admin@example.com" }

    $adminPassword = Read-Host "Admin Password [admin123]" -AsSecureString
    $adminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminPassword))
    if ([string]::IsNullOrWhiteSpace($adminPasswordPlain)) { $adminPasswordPlain = "admin123" }

    Write-Host ""
    $configureEmail = Read-Host "Do you want to configure email settings? (y/N)"

    if ($configureEmail -eq "y" -or $configureEmail -eq "Y") {
        $smtpHost = Read-Host "SMTP Host"
        $smtpPort = Read-Host "SMTP Port [587]"
        if ([string]::IsNullOrWhiteSpace($smtpPort)) { $smtpPort = "587" }
        $smtpUser = Read-Host "SMTP User"
        $smtpPass = Read-Host "SMTP Password" -AsSecureString
        $smtpPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass))
        $emailFrom = Read-Host "Email From Address"
    }

    # Create .env file
    Write-Info "Creating .env file..."

    $envContent = @"
# ==============================================
# PulseGen Environment Configuration
# ==============================================
# Generated by setup script on $(Get-Date)

# ----------------------------------------------
# Database Configuration
# ----------------------------------------------
POSTGRES_PASSWORD=$postgresPassword

# ----------------------------------------------
# Backend Configuration
# ----------------------------------------------
# JWT Secrets
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret

# Encryption Key
ENCRYPTION_KEY=$encryptionKey

# ----------------------------------------------
# Application URLs
# ----------------------------------------------
APP_URL=$appUrl
CORS_ORIGIN=$appUrl
VITE_API_URL=$apiUrl

# ----------------------------------------------
# Admin User
# ----------------------------------------------
ADMIN_EMAIL=$adminEmail
ADMIN_PASSWORD=$adminPasswordPlain

"@

    if ($configureEmail -eq "y" -or $configureEmail -eq "Y") {
        $envContent += @"

# ----------------------------------------------
# Email Configuration
# ----------------------------------------------
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_USER=$smtpUser
SMTP_PASS=$smtpPassPlain
EMAIL_FROM=$emailFrom

"@
    } else {
        $envContent += @"

# ----------------------------------------------
# Email Configuration (Optional - Not Configured)
# ----------------------------------------------
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@pulsegen.com

"@
    }

    $envContent += @"

# ----------------------------------------------
# AI Provider API Keys (Optional)
# ----------------------------------------------
# These can also be configured per-user in the UI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
"@

    Set-Content -Path .env -Value $envContent

    Write-Success ".env file created"
}

# Choose deployment mode
Write-Header "Deployment Mode"

Write-Host "Choose your deployment mode:"
Write-Host "  1) Production (recommended for production use)"
Write-Host "  2) Development (for local development with hot-reload)"
Write-Host "  3) Production with Redis (improved performance)"
Write-Host ""
$deployMode = Read-Host "Enter your choice [1]"
if ([string]::IsNullOrWhiteSpace($deployMode)) { $deployMode = "1" }

switch ($deployMode) {
    "1" {
        $composeProfile = "--profile production"
        $modeName = "Production"
        $composeFile = ""
    }
    "2" {
        $composeFile = "-f docker-compose.dev.yml"
        $composeProfile = ""
        $modeName = "Development"
    }
    "3" {
        $composeProfile = "--profile production --profile with-redis"
        $modeName = "Production with Redis"
        $composeFile = ""
    }
    default {
        Write-Error "Invalid choice. Defaulting to Production mode."
        $composeProfile = "--profile production"
        $modeName = "Production"
        $composeFile = ""
    }
}

# Start services
Write-Header "Starting PulseGen ($modeName)"

Write-Info "This may take a few minutes on first run..."
Write-Host ""

# Pull images first
Write-Info "Pulling Docker images..."
$pullCmd = "$dockerComposeCmd $composeFile pull"
try {
    Invoke-Expression $pullCmd 2>$null
} catch {
    Write-Warning "Pull failed or not needed, continuing with build..."
}

# Build and start
Write-Info "Building and starting services..."
$startCmd = "$dockerComposeCmd $composeFile $composeProfile up -d --build"

try {
    Invoke-Expression $startCmd
    Write-Success "Services started successfully!"
} catch {
    Write-Error "Failed to start services. Check the error message above."
    exit 1
}

# Wait for services to be healthy
Write-Header "Waiting for Services"

Write-Info "Waiting for database to be ready..."
Start-Sleep -Seconds 5

# Check if services are running
try {
    $backendRunning = Invoke-Expression "$dockerComposeCmd $composeFile ps -q backend" 2>$null
    if ($backendRunning) {
        Write-Success "Backend is running"
    } else {
        Write-Error "Backend failed to start"
    }
} catch {
    Write-Error "Could not check backend status"
}

try {
    $frontendRunning = Invoke-Expression "$dockerComposeCmd $composeFile ps -q frontend" 2>$null
    if ($frontendRunning) {
        Write-Success "Frontend is running"
    } else {
        Write-Error "Frontend failed to start"
    }
} catch {
    Write-Error "Could not check frontend status"
}

# Success message
Write-Header "Setup Complete!"

Write-Host "PulseGen is now running!" -ForegroundColor Green
Write-Host ""

if ($deployMode -eq "2") {
    Write-Host "Access your application at:"
    Write-Host "  Frontend: " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Blue
    Write-Host "  Backend API: " -NoNewline
    Write-Host "http://localhost:5000" -ForegroundColor Blue
} else {
    Write-Host "Access your application at:"
    Write-Host "  Application: " -NoNewline
    Write-Host $appUrl -ForegroundColor Blue
    if ($composeProfile -eq "--profile production") {
        Write-Host "  Direct Frontend: " -NoNewline
        Write-Host "http://localhost:3001" -ForegroundColor Blue
        Write-Host "  Direct Backend: " -NoNewline
        Write-Host "http://localhost:5001" -ForegroundColor Blue
    } else {
        Write-Host "  Via Nginx: " -NoNewline
        Write-Host "http://localhost" -ForegroundColor Blue
    }
}

Write-Host ""
Write-Host "Default admin credentials:"
Write-Host "  Email: " -NoNewline
Write-Host $adminEmail -ForegroundColor Blue
Write-Host "  Password: " -NoNewline
Write-Host $adminPasswordPlain -ForegroundColor Blue
Write-Host ""
Write-Warning "Please change the admin password after first login!"

Write-Host ""
Write-Host "Useful commands:"
Write-Host "  View logs: " -NoNewline
Write-Host "$dockerComposeCmd $composeFile logs -f" -ForegroundColor Blue
Write-Host "  Stop services: " -NoNewline
Write-Host "$dockerComposeCmd $composeFile down" -ForegroundColor Blue
Write-Host "  Restart services: " -NoNewline
Write-Host "$dockerComposeCmd $composeFile restart" -ForegroundColor Blue
Write-Host "  View status: " -NoNewline
Write-Host "$dockerComposeCmd $composeFile ps" -ForegroundColor Blue

Write-Host ""
Write-Info "For more information, see the documentation:"
Write-Host "  https://github.com/genesis-nexus/pulsegen/docs"

Write-Host ""

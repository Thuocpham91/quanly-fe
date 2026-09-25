# ============================================================================== 
# Build Docker Image, Transfer to Remote Server, and Auto-Start Container
# Project: quanly-fe-service
# ==============================================================================

param (
    [string]$ImageName     = "quanly-chicken-fe-service",
    [string]$Tag           = "latest",
    [string]$ServerHost    = "103.72.97.86",
    [string]$ServerUser    = "root",
    [int]   $ServerPort    = 24700,
    [string]$ServerPath    = "/root/quanly-chicken/quanly-chicken-fe-service",
    [string]$ContainerName = "quanly-chicken-fe-service",
    [string]$EnvFile       = ".env.sit"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Helper: pipe bash script qua SSH stdin (tránh lỗi Windows CRLF / argument quoting)
function Invoke-SshScript {
    param([string]$Script, [string[]]$SshConnectArgs)

    $scriptContent = $Script -replace "`r`n", "`n"
    $tmpFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tmpFile, $scriptContent, [System.Text.Encoding]::UTF8)

    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo("ssh")
        $psi.UseShellExecute = $false
        $psi.RedirectStandardInput = $true

        # Windows PowerShell 5.1 does not support ProcessStartInfo.ArgumentList.
        # Build a single Arguments string instead with simple quoting for each token.
        $argTokens = @("-T") + $SshConnectArgs + @("bash", "-s")
        $psi.Arguments = ($argTokens | ForEach-Object {
            if ($_ -match '[\s"]') {
                '"' + ($_ -replace '"', '\"') + '"'
            } else {
                $_
            }
        }) -join ' '

        $proc = [System.Diagnostics.Process]::Start($psi)
        $input = [System.IO.File]::OpenRead($tmpFile)
        $input.CopyTo($proc.StandardInput.BaseStream)
        $input.Close()
        $proc.StandardInput.Close()
        $proc.WaitForExit()
        return $proc.ExitCode
    } finally {
        Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  🚀 FRONTEND: BUILD -> TRANSFER -> DEPLOY" -ForegroundColor Cyan
Write-Host "  Server      : $ServerUser@$ServerHost`:$ServerPort" -ForegroundColor Cyan
Write-Host "  Remote Path : $ServerPath" -ForegroundColor Cyan
Write-Host "  Image       : $ImageName`:$Tag" -ForegroundColor Cyan
Write-Host "  Container   : $ContainerName" -ForegroundColor Cyan
Write-Host "  Env File    : $EnvFile" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# ─────────────────────────────────────────────────────────────
# STEP 1: Check Docker Daemon
# ─────────────────────────────────────────────────────────────
Write-Host "`n[1/6] Checking local Docker daemon..." -ForegroundColor Yellow
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker daemon is running normally." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# STEP 2: Read configuration from .env file
# ─────────────────────────────────────────────────────────────
Write-Host "`n[2/6] Reading environment variables from '$EnvFile'..." -ForegroundColor Yellow
$ViteApiUrl = "http://localhost:9004/api/v1"
$VirtualHost = "gagiongsamoanh.com"
$FePort = "5173"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line.StartsWith("#") -and $line -match "^VITE_API_URL=(.+)$") {
            $ViteApiUrl = $matches[1].Trim()
        }
        if (-not $line.StartsWith("#") -and $line -match "^VIRTUAL_HOST=(.+)$") {
            $VirtualHost = $matches[1].Trim()
        }
        if (-not $line.StartsWith("#") -and $line -match "^FE_PORT=(.+)$") {
            $FePort = $matches[1].Trim()
        }
    }
    Write-Host "   -> VITE_API_URL: $ViteApiUrl" -ForegroundColor Cyan
    Write-Host "   -> VIRTUAL_HOST: $VirtualHost" -ForegroundColor Cyan
    Write-Host "   -> FE_PORT: $FePort" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ '$EnvFile' not found, using default values: $ViteApiUrl | $VirtualHost" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────────
# STEP 3: Build Docker Image (platform linux/amd64)
# ─────────────────────────────────────────────────────────────
$FullImage = "$ImageName`:$Tag"
Write-Host "`n[3/6] Building Docker image '$FullImage' (platform: linux/amd64)..." -ForegroundColor Yellow
Write-Host "   (This process may take 1-3 minutes depending on dependencies)" -ForegroundColor Gray

docker build --platform linux/amd64 `
    --build-arg "VITE_API_URL=$ViteApiUrl" `
    -t $FullImage .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed! Please check the errors above." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Built image '$FullImage' successfully!" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# STEP 4: Export Docker Image to .tar file
# ─────────────────────────────────────────────────────────────
$TarFile = "$ImageName.tar"
Write-Host "`n[4/6] Exporting Docker image to file '$TarFile'..." -ForegroundColor Yellow

if (Test-Path $TarFile) {
    Remove-Item -Force $TarFile -ErrorAction SilentlyContinue
}

docker save -o $TarFile $FullImage
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $TarFile)) {
    Write-Host "❌ Failed to save .tar file!" -ForegroundColor Red
    exit 1
}

$TarSizeMB = [math]::Round((Get-Item $TarFile).Length / 1MB, 2)
Write-Host "✅ Saved '$TarFile' ($TarSizeMB MB)." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# STEP 5: Validate remote environment, create directory & Upload files to Server via SCP
# ─────────────────────────────────────────────────────────────
function Invoke-ScpWithRetry {
    param(
        [string]$Source,
        [string]$Destination,
        [int]$Retries = 3
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        Write-Host "   -> Attempt ${attempt}/${Retries}: uploading '$Source'..." -ForegroundColor Gray

        # Use the modern SFTP-based SCP mode instead of -O; legacy SCP mode can cause
        # connection resets and broken pipes on some remote hosts.
        & scp -T -P $ServerPort -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=20 -o ServerAliveInterval=30 -o ServerAliveCountMax=3 `
            $Source "$ServerUser@$ServerHost`:$Destination"

        if ($LASTEXITCODE -eq 0) {
            return
        }

        Write-Host "      ⚠️ Upload attempt $attempt failed. Retrying in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }

    throw "Failed to upload '$Source' after $Retries attempts."
}

if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Local file 'docker-compose.yml' not found in current directory." -ForegroundColor Red
    exit 1
}

Write-Host "`n[5/6] Preparing remote server and uploading files to $ServerHost`:$ServerPort..." -ForegroundColor Yellow
Write-Host "   -> Checking remote Docker environment..." -ForegroundColor Gray

$RemotePrecheck = @"
set -e
mkdir -p $ServerPath
if ! command -v docker >/dev/null 2>&1; then
  echo 'Docker is not installed on remote server.'
  exit 1
fi
systemctl is-active docker >/dev/null 2>&1 || systemctl start docker
if ! docker info >/dev/null 2>&1; then
  echo 'Docker daemon is not running on remote server.'
  exit 1
fi
docker network inspect gasy-network >/dev/null 2>&1 || docker network create gasy-network

echo 'Remote Docker environment is ready.'
"@

$SshConnArgs = @("-p", "$ServerPort", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=20", "-o", "ServerAliveInterval=30", "-o", "ServerAliveCountMax=5", "$ServerUser@$ServerHost")
$exitCode = Invoke-SshScript -Script $RemotePrecheck -SshConnectArgs $SshConnArgs
if ($exitCode -ne 0) {
    Write-Host "❌ Remote Docker environment is not ready. Please install/start Docker and ensure network 'gasy-network' exists." -ForegroundColor Red
    Remove-Item -Force $TarFile -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "   -> Remote directory '$ServerPath' is ready." -ForegroundColor Green

try {
    Invoke-ScpWithRetry -Source $TarFile -Destination "$ServerPath/"
    Write-Host "   -> Uploading 'docker-compose.yml'..." -ForegroundColor Gray
    Invoke-ScpWithRetry -Source "docker-compose.yml" -Destination "$ServerPath/"

    if (Test-Path $EnvFile) {
        Write-Host "   -> Uploading '$EnvFile' as '.env'..." -ForegroundColor Gray
        Invoke-ScpWithRetry -Source $EnvFile -Destination "$ServerPath/.env"
    }
} catch {
    Write-Host "❌ Failed to upload files to server: $($_.Exception.Message)" -ForegroundColor Red
    Remove-Item -Force $TarFile -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ All files uploaded to server successfully!" -ForegroundColor Green

# Remove local .tar file to free up space
Remove-Item -Force $TarFile -ErrorAction SilentlyContinue
Write-Host "🧹 Deleted local file '$TarFile'." -ForegroundColor Gray

# ─────────────────────────────────────────────────────────────
# STEP 6: Load Image & Run Container on Server
# ─────────────────────────────────────────────────────────────
Write-Host "`n[6/6] Starting container on server..." -ForegroundColor Yellow

$RemoteCommands = @"
set -e

echo '==> 1. Loading Docker image into Docker daemon...'
docker load -i $ServerPath/$TarFile
rm -f $ServerPath/$TarFile

echo '==> 2. Verifying image exists...'
if ! docker image inspect $FullImage > /dev/null 2>&1; then
  echo 'ERROR: Image $FullImage not found after docker load!'
  exit 1
fi
echo 'Image $FullImage loaded successfully.'

echo '==> 3. Checking Docker network gasy-network...'
docker network inspect gasy-network >/dev/null 2>&1 || docker network create gasy-network

echo '==> 4. Restarting service with Docker Compose...'
cd $ServerPath
docker compose down 2>/dev/null || true
docker compose up -d --force-recreate

echo '==> 5. Current container status:'
docker ps --filter "name=$ContainerName"
"@

$exitCode = Invoke-SshScript -Script $RemoteCommands -SshConnectArgs $SshConnArgs

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host " 🎉 FRONTEND DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host " 🌐 Domain access : https://$VirtualHost" -ForegroundColor Cyan
    Write-Host " 🌐 Or Direct IP  : http://$ServerHost`:3011" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Host "⚠️ There were warnings during server execution. Please check the logs." -ForegroundColor Yellow
}

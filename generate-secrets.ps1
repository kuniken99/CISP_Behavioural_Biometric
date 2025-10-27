# CBBA Production Secrets Generator
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CBBA Production Secrets Generator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Generate JWT Secret Key
Write-Host "[1/3] Generating JWT Secret Key..." -ForegroundColor Yellow
$jwtKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
Write-Host "JWT_SECRET_KEY:" -ForegroundColor Green
Write-Host $jwtKey -ForegroundColor White
Write-Host ""

# Generate Encryption Key
Write-Host "[2/3] Generating Encryption Key..." -ForegroundColor Yellow
$encKey = -join ((0..63) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) })
Write-Host "ENCRYPTION_KEY:" -ForegroundColor Green
Write-Host $encKey -ForegroundColor White
Write-Host ""

# Generate Database Password
Write-Host "[3/3] Generating SQL Password..." -ForegroundColor Yellow
$upperChars = 65..90 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$lowerChars = 97..122 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$numbers = 48..57 | Get-Random -Count 4 | ForEach-Object {[char]$_}
$specialChars = "!@#$%^&*".ToCharArray() | Get-Random -Count 2
$dbPassword = -join (($upperChars + $lowerChars + $numbers + $specialChars) | Get-Random -Count 14)
Write-Host "SQL_ADMIN_PASSWORD:" -ForegroundColor Green
Write-Host $dbPassword -ForegroundColor White
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "BACKEND Configuration:" -ForegroundColor Magenta
Write-Host "Jwt__Key = $jwtKey"
Write-Host "Jwt__Issuer = DbaConsole"
Write-Host "Jwt__Audience = DbaConsoleUsers"
Write-Host ""

Write-Host "PYTHON SERVICE Configuration:" -ForegroundColor Magenta
Write-Host "ENCRYPTION_KEY = $encKey"
Write-Host "FLASK_PORT = 5001"
Write-Host ""

Write-Host "DATABASE Configuration:" -ForegroundColor Magenta
Write-Host "Admin Username = cbbaadmin"
Write-Host "Admin Password = $dbPassword"
Write-Host ""

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Save these secrets securely!" -ForegroundColor Red
Write-Host "Generation complete!" -ForegroundColor Green

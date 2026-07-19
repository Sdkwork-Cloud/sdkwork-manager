$ErrorActionPreference = "Stop"

$listenAddress = $env:SDKWORK_CLAW_DATABASE_HOST
if ([string]::IsNullOrWhiteSpace($listenAddress)) {
    $listenAddress = "127.0.0.1"
}
if ($listenAddress -notin @("127.0.0.1", "localhost")) {
    throw "WSL PostgreSQL portproxy requires a loopback SDKWORK_CLAW_DATABASE_HOST"
}
$listenAddress = "127.0.0.1"

$listenPort = 5432
if (-not [string]::IsNullOrWhiteSpace($env:SDKWORK_CLAW_DATABASE_PORT)) {
    $parsedPort = 0
    if (-not [int]::TryParse($env:SDKWORK_CLAW_DATABASE_PORT, [ref]$parsedPort) -or
        $parsedPort -lt 1 -or $parsedPort -gt 65535) {
        throw "SDKWORK_CLAW_DATABASE_PORT must be an integer between 1 and 65535"
    }
    $listenPort = $parsedPort
}

$distribution = $env:SDKWORK_MANAGER_WSL_DISTRIBUTION
if ([string]::IsNullOrWhiteSpace($distribution)) {
    $distribution = "Ubuntu-22.04"
}
if ($distribution -notmatch "^[A-Za-z0-9._-]+$") {
    throw "SDKWORK_MANAGER_WSL_DISTRIBUTION contains unsupported characters"
}

$ErrorActionPreference = "Continue"
$addressOutput = & wsl.exe -d $distribution -- sh -lc "hostname -I" 2>&1
$wslExitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($wslExitCode -ne 0) {
    throw "Failed to resolve the IPv4 address for WSL distribution $distribution"
}
$targetAddress = ((($addressOutput | ForEach-Object { $_.ToString() }) -split "\s+") |
    Where-Object { $_ -match "^\d+\.\d+\.\d+\.\d+$" } |
    Select-Object -First 1)
if ([string]::IsNullOrWhiteSpace($targetAddress)) {
    throw "WSL distribution $distribution did not report an IPv4 address"
}

& netsh interface portproxy delete v4tov4 `
    listenaddress=$listenAddress listenport=$listenPort 2>$null | Out-Null
& netsh interface portproxy add v4tov4 `
    listenaddress=$listenAddress listenport=$listenPort `
    connectaddress=$targetAddress connectport=$listenPort | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Failed to refresh $listenAddress`:$listenPort -> $targetAddress`:$listenPort. Run the development command from an elevated terminal."
}

Write-Output "Manager WSL PostgreSQL proxy: $listenAddress`:$listenPort -> $targetAddress`:$listenPort"

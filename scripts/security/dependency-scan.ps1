

# Write-Host "Checking staged files for dependency changes..." -ForegroundColor Cyan

# $stagedFiles = git diff --cached --name-only

# $dependencyFiles = @(
#   "package.json",
#   "package-lock.json",
#   "yarn.lock",
#   "pnpm-lock.yaml"
# )

# $shouldScan = $false

# foreach ($file in $dependencyFiles) {
#   if ($stagedFiles -contains $file) {
#     $shouldScan = $true
#   }
# }

# if (-not $shouldScan) {
#   Write-Host "No dependency changes detected. Skipping Trivy scan." -ForegroundColor Yellow
#   exit 0
# }

Write-Host "Running Trivy dependency scan..." -ForegroundColor Cyan


docker run --rm `
  -v ${PWD}:/appContainer `
  aquasec/trivy `
  fs `
  --scanners vuln `
  --severity HIGH,CRITICAL `
  --ignore-unfixed `
  --debug `
  /appContainer
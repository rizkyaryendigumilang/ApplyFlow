$ErrorActionPreference = 'Stop'
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('job-tracker-pb-' + [guid]::NewGuid().ToString('N'))
$process = $null

New-Item -ItemType Directory -Path $tempRoot | Out-Null
try {
  if ($env:PB_SMOKE_SKIP_HOOKS -ne 'true') { Copy-Item -Recurse -Force (Join-Path $PSScriptRoot '..\pocketbase\pb_hooks') (Join-Path $tempRoot 'pb_hooks') }
  Copy-Item -Recurse -Force (Join-Path $PSScriptRoot '..\pocketbase\pb_migrations') (Join-Path $tempRoot 'pb_migrations')
  $cachedZip = Join-Path $PSScriptRoot 'pocketbase_0.22.57_windows_amd64.zip'
  $zip = Join-Path $tempRoot 'pocketbase.zip'
  if (Test-Path $cachedZip) {
    Copy-Item $cachedZip $zip
  } else {
    Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/pocketbase/pocketbase/releases/download/v0.22.57/pocketbase_0.22.57_windows_amd64.zip' -OutFile $cachedZip
    Copy-Item $cachedZip $zip
  }
  $hash = (Get-FileHash -Algorithm SHA256 $zip).Hash
  if ($hash -ne '643F5946122C36303FBE84788D0C8755B030FAC9D248EC84C7BFF3FF5C7FB8EF') { throw "PocketBase binary checksum mismatch: $hash" }
  Expand-Archive -Path $zip -DestinationPath $tempRoot -Force
  $logOut = Join-Path $tempRoot 'pocketbase.stdout.log'
  $logErr = Join-Path $tempRoot 'pocketbase.stderr.log'
  $process = Start-Process -FilePath (Join-Path $tempRoot 'pocketbase.exe') -ArgumentList 'serve','--http=127.0.0.1:18090','--dir=pb_data' -WorkingDirectory $tempRoot -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru

  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    try { Invoke-RestMethod -Uri 'http://127.0.0.1:18090/api/health' | Out-Null; $ready = $true; break } catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) {
    $outText = Get-Content $logOut -Raw -ErrorAction SilentlyContinue
    $errText = Get-Content $logErr -Raw -ErrorAction SilentlyContinue
    throw "PocketBase did not become healthy.`n--- STDOUT ---`n$outText`n--- STDERR ---`n$errText"
  }

  $suffix = [guid]::NewGuid().ToString('N').Substring(0, 10)
  $password = 'ContractPassword123!'
  $emailA = "contract-a-$suffix@example.com"
  $emailB = "contract-b-$suffix@example.com"
  $users = @()
  foreach ($label in @('a', 'b')) {
    $email = if ($label -eq 'a') { $emailA } else { $emailB }
    $body = @{email=$email; password=$password; passwordConfirm=$password; displayName="Contract $label"} | ConvertTo-Json
    $users += Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:18090/api/collections/users/records' -ContentType 'application/json' -Body $body
  }

  $env:PB_TEST_URL = 'http://127.0.0.1:18090'
  $env:PB_TEST_EMAIL_A = $emailA
  $env:PB_TEST_PASSWORD_A = $password
  $env:PB_TEST_EMAIL_B = $emailB
  $env:PB_TEST_PASSWORD_B = $password
  node (Join-Path $PSScriptRoot 'backend-contract.mjs')
  if ($LASTEXITCODE -ne 0) {
    Write-Output '--- PocketBase stdout ---'
    Get-Content $logOut -Raw -ErrorAction SilentlyContinue
    Write-Output '--- PocketBase stderr ---'
    Get-Content $logErr -Raw -ErrorAction SilentlyContinue
    exit $LASTEXITCODE
  }
  Write-Output 'native PocketBase smoke test passed'
} finally {
  if ($process -and -not $process.HasExited) { 
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue 
    Start-Sleep -Milliseconds 300
  }
  if (Test-Path -LiteralPath $tempRoot) { 
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue 
  }
}

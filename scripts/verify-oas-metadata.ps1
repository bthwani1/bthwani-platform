#!/usr/bin/env pwsh
# Verify that all OAS files have required metadata: servers, contact, description

$ErrorActionPreference = "Stop"

$REPO_ROOT = $PSScriptRoot | Split-Path -Parent
$SERVICES_DIR = "$REPO_ROOT\oas\services"
$MASTER_FILE = "$REPO_ROOT\oas\master\Master_OpenAPI.yaml"

$FAILED = $false
$FAILED_FILES = @()

function Test-OASMetadata {
    param(
        [string]$FilePath
    )
    
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $issues = @()
    
    # Check info.description
    if ($content -notmatch '(?m)^\s*description\s*:') {
        $issues += "Missing 'info.description'"
    }
    
    # Check info.contact
    if ($content -notmatch '(?m)^\s*contact\s*:') {
        $issues += "Missing 'info.contact'"
    } elseif ($content -notmatch '(?m)^\s*email\s*:\s*support@bthwani\.com') {
        # Check if contact.email exists (more lenient check)
        if ($content -notmatch '(?m)^\s*email\s*:') {
            $issues += "Missing 'info.contact.email'"
        }
    }
    
    # Check servers
    if ($content -notmatch '(?m)^servers\s*:') {
        $issues += "Missing 'servers' section"
    } elseif ($content -notmatch '(?m)^\s*-\s*url\s*:') {
        $issues += "Empty 'servers' array (no URLs found)"
    }
    
    return $issues
}

Write-Host "Verifying OAS metadata (servers/contact/description)..." -ForegroundColor Cyan
Write-Host ""

# Check master file
if (Test-Path $MASTER_FILE) {
    $relativeMaster = $MASTER_FILE.Replace($REPO_ROOT, "").TrimStart("\")
    Write-Host "Checking master file: $relativeMaster" -ForegroundColor Yellow
    $masterIssues = Test-OASMetadata -FilePath $MASTER_FILE
    if ($masterIssues.Count -gt 0) {
        Write-Host "  [FAILED]" -ForegroundColor Red
        foreach ($issue in $masterIssues) {
            Write-Host "    - $issue" -ForegroundColor Red
        }
        $FAILED = $true
        $FAILED_FILES += $relativeMaster
    } else {
        Write-Host "  [PASSED]" -ForegroundColor Green
    }
    Write-Host ""
}

# Check service files
if (-not (Test-Path $SERVICES_DIR)) {
    Write-Host "Warning: Services directory not found: $SERVICES_DIR" -ForegroundColor Yellow
    exit 1
}

$serviceFiles = Get-ChildItem -Path $SERVICES_DIR -Filter "openapi.yaml" -Recurse -ErrorAction SilentlyContinue

if ($null -eq $serviceFiles -or $serviceFiles.Count -eq 0) {
    Write-Host "Warning: No service files found in $SERVICES_DIR" -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking $($serviceFiles.Count) service file(s)..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $serviceFiles) {
    $relativePath = $file.FullName.Replace($REPO_ROOT, "").TrimStart("\")
    Write-Host "Checking: $relativePath" -ForegroundColor Gray
    
    $issues = Test-OASMetadata -FilePath $file.FullName
    
    if ($issues.Count -gt 0) {
        Write-Host "  [FAILED]" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "    - $issue" -ForegroundColor Red
        }
        $FAILED = $true
        $FAILED_FILES += $relativePath
    } else {
        Write-Host "  [PASSED]" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($FAILED) {
    Write-Host ""
    Write-Host "[FAILED] Verification failed" -ForegroundColor Red
    Write-Host "Files with issues:" -ForegroundColor Yellow
    foreach ($file in $FAILED_FILES) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
} else {
    Write-Host ""
    Write-Host "[PASSED] All OAS files have required metadata!" -ForegroundColor Green
    Write-Host ""
    exit 0
}

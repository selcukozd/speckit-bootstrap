# Smoke Tests for SpecKit Bootstrap (PowerShell)
# Usage: .\scripts\smoke-test.ps1 [-BaseUrl "http://localhost:3000"]

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🧪 Running smoke tests against: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

$TestsPassed = 0
$TestsFailed = 0

function Run-Test {
    param(
        [string]$TestName,
        [string]$Url,
        [int]$ExpectedCode = 200
    )
    
    Write-Host -NoNewline "Testing: $TestName ... "
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
        $statusCode = $response.StatusCode
    } catch {
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        } else {
            $statusCode = 0
        }
    }
    
    if ($statusCode -eq $ExpectedCode) {
        Write-Host "✅ PASS (HTTP $statusCode)" -ForegroundColor Green
        $script:TestsPassed++
        return $true
    } else {
        Write-Host "❌ FAIL (HTTP $statusCode, expected $ExpectedCode)" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
}

# Test 1: Health Check (if your project has one)
# Run-Test -TestName "Health Check" -Url "$BaseUrl/api/health" -ExpectedCode 200

# Test 2: Root endpoint
# Run-Test -TestName "Root Endpoint" -Url "$BaseUrl/" -ExpectedCode 200

# Test 3: CLI Tools (local only)
if ($BaseUrl -eq "http://localhost:3000") {
    Write-Host ""
    Write-Host "🔧 Testing CLI Tools..." -ForegroundColor Cyan
    
    # Test orchestrator plan
    Write-Host -NoNewline "Testing: Orchestrator Plan ... "
    $planResult = npm run speckit:plan -- "Test task" 2>&1 | Out-String
    if ($planResult -match "Task") {
        Write-Host "✅ PASS" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $TestsFailed++
    }
    
    # Test orchestrator status
    Write-Host -NoNewline "Testing: Orchestrator Status ... "
    $statusResult = npm run speckit:status 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PASS" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $TestsFailed++
    }
    
    # Test agent qwen (stub mode)
    Write-Host -NoNewline "Testing: Qwen Agent (stub) ... "
    $qwenResult = npm run agent:qwen -- implement --task "Test" 2>&1 | Out-String
    if ($qwenResult -match "status") {
        Write-Host "✅ PASS" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        $TestsFailed++
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Passed: $TestsPassed" -ForegroundColor Green
Write-Host "❌ Failed: $TestsFailed" -ForegroundColor Red
Write-Host "📈 Total:  $($TestsPassed + $TestsFailed)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($TestsFailed -gt 0) {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
}


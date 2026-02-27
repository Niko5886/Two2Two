# Test script for admin-notifications Edge Function
# Usage: ./test-notifications.ps1 -CronSecret "your-secret-here"

param(
    [Parameter(Mandatory=$true)]
    [string]$CronSecret,
    
    [Parameter(Mandatory=$false)]
    [int]$BatchSize = 25,
    
    [Parameter(Mandatory=$false)]
    [string]$FunctionUrl = "https://codjrsxeqmeoscnjyeyj.supabase.co/functions/v1/admin-notifications"
)

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $CronSecret"
}

$url = "$FunctionUrl`?batch=$BatchSize"

Write-Host "Testing admin-notifications function..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Results:" -ForegroundColor Yellow
    Write-Host "  Processed: $($response.processed)" -ForegroundColor White
    Write-Host "  Sent: $($response.sent)" -ForegroundColor Green
    Write-Host "  Failed: $($response.failed)" -ForegroundColor $(if ($response.failed -gt 0) { "Red" } else { "White" })
    
    if ($response.message) {
        Write-Host "  Message: $($response.message)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

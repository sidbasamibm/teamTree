# ============================================
# NovaCart AWS ECS Deployment Script
# Automates: Build -> Push -> Update Task Definition -> Restart Service
# ============================================

param(
    [string]$Component = "all",  # "backend", "frontend", "router", or "all"
    [switch]$SkipBuild = $false
)

# Configuration
$ACCOUNT_ID = "043309334049"
$REGION = "us-east-1"
$GROUP = "team3"
$CLUSTER = "novacart-cluster"
$SERVICE = "novacart-group$GROUP"
$REGISTRY = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "NovaCart AWS Deployment Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Account ID:  $ACCOUNT_ID" -ForegroundColor White
Write-Host "  Region:      $REGION" -ForegroundColor White
Write-Host "  Group:       $GROUP" -ForegroundColor White
Write-Host "  Component:   $Component" -ForegroundColor White
Write-Host ""

# Generate timestamp tag
$TAG = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "Image Tag: $TAG" -ForegroundColor Green
Write-Host ""

# Login to ECR
if (!$SkipBuild) {
    Write-Host "Step 1: Logging into ECR..." -ForegroundColor Yellow
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REGISTRY
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ECR login failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Logged in successfully!" -ForegroundColor Green
    Write-Host ""
}

# Build and push images
$BACKEND_TAG = $TAG
$FRONTEND_TAG = $TAG
$ROUTER_TAG = $TAG

function Build-And-Push {
    param($ServiceName, $Directory)

    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "Building: $ServiceName" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan

    $ImageName = "novacart-${ServiceName}-group${GROUP}"
    $FullImageName = "${REGISTRY}/${ImageName}:${TAG}"

    Write-Host "Image: $FullImageName" -ForegroundColor White
    Write-Host ""

    # Build
    docker build --no-cache --platform linux/amd64 -t $FullImageName $Directory
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed for $ServiceName!" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Pushing $ServiceName..." -ForegroundColor Yellow
    docker push $FullImageName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed for $ServiceName!" -ForegroundColor Red
        exit 1
    }

    Write-Host "Successfully pushed: $ServiceName" -ForegroundColor Green
    Write-Host ""
}

# Build components based on parameter
if (!$SkipBuild) {
    Write-Host "Step 2: Building and Pushing Docker Images..." -ForegroundColor Yellow
    Write-Host ""

    if ($Component -eq "all" -or $Component -eq "backend") {
        Build-And-Push "backend" ".\backend"
    }

    if ($Component -eq "all" -or $Component -eq "frontend") {
        Build-And-Push "frontend" ".\frontend"
    }

    if ($Component -eq "all" -or $Component -eq "router") {
        Build-And-Push "router" ".\router"
    }
} else {
    Write-Host "Skipping build (using existing images)" -ForegroundColor Yellow
    Write-Host ""
}

# Read current task definition
Write-Host "Step 3: Updating Task Definition..." -ForegroundColor Yellow
$TaskDefPath = ".\task_definition.json"

if (!(Test-Path $TaskDefPath)) {
    Write-Host "Error: task_definition.json not found!" -ForegroundColor Red
    exit 1
}

# Read and update task definition
$TaskDef = Get-Content $TaskDefPath -Raw | ConvertFrom-Json

# Update image tags
foreach ($container in $TaskDef.containerDefinitions) {
    if ($Component -eq "all" -or $Component -eq "backend") {
        if ($container.name -eq "backend") {
            $container.image = "${REGISTRY}/novacart-backend-group${GROUP}:${BACKEND_TAG}"
            Write-Host "  Updated backend image tag: $BACKEND_TAG" -ForegroundColor Green
        }
    }
    if ($Component -eq "all" -or $Component -eq "frontend") {
        if ($container.name -eq "frontend") {
            $container.image = "${REGISTRY}/novacart-frontend-group${GROUP}:${FRONTEND_TAG}"
            Write-Host "  Updated frontend image tag: $FRONTEND_TAG" -ForegroundColor Green
        }
    }
    if ($Component -eq "all" -or $Component -eq "router") {
        if ($container.name -eq "router") {
            $container.image = "${REGISTRY}/novacart-router-group${GROUP}:${ROUTER_TAG}"
            Write-Host "  Updated router image tag: $ROUTER_TAG" -ForegroundColor Green
        }
    }
}

# Save updated task definition
$TaskDef | ConvertTo-Json -Depth 10 | Set-Content $TaskDefPath
Write-Host "Task definition updated!" -ForegroundColor Green
Write-Host ""

# Register new task definition
Write-Host "Step 4: Registering Task Definition with ECS..." -ForegroundColor Yellow
$RegisterResult = aws ecs register-task-definition --cli-input-json "file://$TaskDefPath" --region $REGION --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to register task definition!" -ForegroundColor Red
    exit 1
}

$NewRevision = $RegisterResult.taskDefinition.revision
Write-Host "Registered new task definition: novacart-group${GROUP}:${NewRevision}" -ForegroundColor Green
Write-Host ""

# Check current service state
Write-Host "Step 5: Checking current service state..." -ForegroundColor Yellow
$CurrentService = aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION --output json | ConvertFrom-Json

if ($CurrentService.services.Count -eq 0) {
    Write-Host "Error: Service $SERVICE not found in cluster $CLUSTER!" -ForegroundColor Red
    Write-Host "Available services:" -ForegroundColor Yellow
    aws ecs list-services --cluster $CLUSTER --region $REGION --output text
    exit 1
}

$CurrentDesiredCount = $CurrentService.services[0].desiredCount
Write-Host "Current desired count: $CurrentDesiredCount" -ForegroundColor White

# Ensure at least 1 task is desired
$DesiredCount = if ($CurrentDesiredCount -eq 0) { 1 } else { $CurrentDesiredCount }

if ($CurrentDesiredCount -eq 0) {
    Write-Host "Service is scaled to 0, will scale up to 1 task" -ForegroundColor Yellow
}
Write-Host ""

# Update ECS service to use new task definition
Write-Host "Step 6: Updating ECS Service..." -ForegroundColor Yellow
aws ecs update-service `
    --cluster $CLUSTER `
    --service $SERVICE `
    --task-definition "novacart-group${GROUP}:${NewRevision}" `
    --desired-count $DesiredCount `
    --force-new-deployment `
    --region $REGION `
    --output json > $null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to update service!" -ForegroundColor Red
    exit 1
}

Write-Host "Service update initiated!" -ForegroundColor Green
Write-Host ""

# Wait for deployment
Write-Host "Step 7: Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
Write-Host ""

$MaxWaitTime = 300  # 5 minutes
$WaitInterval = 10
$ElapsedTime = 0

while ($ElapsedTime -lt $MaxWaitTime) {
    Start-Sleep -Seconds $WaitInterval
    $ElapsedTime += $WaitInterval

    # Check service status
    $ServiceInfo = aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION --output json | ConvertFrom-Json
    $Deployment = $ServiceInfo.services[0].deployments | Where-Object { $_.status -eq "PRIMARY" }

    $Running = $Deployment.runningCount
    $Desired = $Deployment.desiredCount

    Write-Host "  Progress: $Running/$Desired tasks running... ($ElapsedTime seconds)" -ForegroundColor Cyan

    if ($Running -eq $Desired -and $Desired -gt 0) {
        Write-Host ""
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
        break
    }
}

if ($ElapsedTime -ge $MaxWaitTime) {
    Write-Host ""
    Write-Host "Deployment is taking longer than expected." -ForegroundColor Yellow
    Write-Host "Check status with: .\check-ecs.ps1" -ForegroundColor Yellow
}

# Get public IP
Write-Host ""
Write-Host "Step 8: Getting Public IP..." -ForegroundColor Yellow

$TaskArn = aws ecs list-tasks --cluster $CLUSTER --service $SERVICE --region $REGION --query 'taskArns[0]' --output text

if (![string]::IsNullOrEmpty($TaskArn) -and $TaskArn -ne "None") {
    Start-Sleep -Seconds 5  # Wait for ENI to attach

    $EniId = aws ecs describe-tasks --cluster $CLUSTER --tasks $TaskArn --region $REGION --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text

    if (![string]::IsNullOrEmpty($EniId) -and $EniId -ne "None") {
        $PublicIp = aws ec2 describe-network-interfaces --network-interface-ids $EniId --region $REGION --query 'NetworkInterfaces[0].Association.PublicIp' --output text

        Write-Host ""
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host "Deployment Complete!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Application URL: http://$PublicIp:9000" -ForegroundColor Green
        Write-Host "Health Check:    http://$PublicIp:9000/api/health" -ForegroundColor Green
        Write-Host ""
        Write-Host "Image Tags:" -ForegroundColor Yellow
        if ($Component -eq "all" -or $Component -eq "backend") {
            Write-Host "  Backend:  $BACKEND_TAG" -ForegroundColor White
        }
        if ($Component -eq "all" -or $Component -eq "frontend") {
            Write-Host "  Frontend: $FRONTEND_TAG" -ForegroundColor White
        }
        if ($Component -eq "all" -or $Component -eq "router") {
            Write-Host "  Router:   $ROUTER_TAG" -ForegroundColor White
        }
        Write-Host ""
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "To check logs: aws logs tail /ecs/novacart-group$GROUP --follow" -ForegroundColor Gray
Write-Host "To check status: .\check-ecs.ps1" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

# ECS Task Status Checker
$CLUSTER = "novacart-cluster"
$TASK_FAMILY = "novacart-groupteam3"
$REGION = "us-east-1"

Write-Host "Checking ECS Task Status..." -ForegroundColor Cyan
Write-Host ""

# Find running tasks
Write-Host "Finding running tasks..." -ForegroundColor Yellow
$TASK_ARN = aws ecs list-tasks --cluster $CLUSTER --family $TASK_FAMILY --desired-status RUNNING --region $REGION --query 'taskArns[0]' --output text

if ([string]::IsNullOrEmpty($TASK_ARN) -or $TASK_ARN -eq "None") {
    Write-Host "No running tasks found!" -ForegroundColor Red
    Write-Host "Checking for any tasks..." -ForegroundColor Yellow
    aws ecs list-tasks --cluster $CLUSTER --family $TASK_FAMILY --region $REGION
    exit
}

Write-Host "Task found: $TASK_ARN" -ForegroundColor Green
Write-Host ""

# Task status
Write-Host "Task Status:" -ForegroundColor Yellow
aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN --region $REGION --query 'tasks[0].{LastStatus:lastStatus,DesiredStatus:desiredStatus,HealthStatus:healthStatus}' --output table

Write-Host ""
Write-Host "Container Status:" -ForegroundColor Yellow
aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN --region $REGION --query 'tasks[0].containers[*].{Name:name,Status:lastStatus,ExitCode:exitCode}' --output table

# Get network info
Write-Host ""
Write-Host "Getting network information..." -ForegroundColor Yellow
$ENI_ID = aws ecs describe-tasks --cluster $CLUSTER --tasks $TASK_ARN --region $REGION --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text

if (![string]::IsNullOrEmpty($ENI_ID)) {
    Write-Host "Network Interface: $ENI_ID" -ForegroundColor Cyan

    $SG_ID = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $REGION --query 'NetworkInterfaces[0].Groups[0].GroupId' --output text
    Write-Host "Security Group: $SG_ID" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "Security Group Inbound Rules:" -ForegroundColor Yellow
    aws ec2 describe-security-groups --group-ids $SG_ID --region $REGION --query 'SecurityGroups[0].IpPermissions[*].{Port:FromPort,Protocol:IpProtocol,Source:IpRanges[0].CidrIp}' --output table

    $PUBLIC_IP = aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $REGION --query 'NetworkInterfaces[0].Association.PublicIp' --output text
    Write-Host ""
    Write-Host "Public IP: $PUBLIC_IP" -ForegroundColor Green
    Write-Host "Test URL: http://$($PUBLIC_IP):9000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Recent Logs:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan

$LOG_GROUP = "/ecs/novacart-groupteam3"
$containers = @("backend", "frontend", "router")

foreach ($container in $containers) {
    Write-Host ""
    Write-Host "Logs for: $container" -ForegroundColor Cyan
    $LOG_STREAM = aws logs describe-log-streams --log-group-name $LOG_GROUP --log-stream-name-prefix "$container/" --order-by LastEventTime --descending --max-items 1 --region $REGION --query 'logStreams[0].logStreamName' --output text 2>$null

    if (![string]::IsNullOrEmpty($LOG_STREAM) -and $LOG_STREAM -ne "None") {
        aws logs get-log-events --log-group-name $LOG_GROUP --log-stream-name $LOG_STREAM --limit 10 --region $REGION --query 'events[*].message' --output text 2>$null
    } else {
        Write-Host "No logs found" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

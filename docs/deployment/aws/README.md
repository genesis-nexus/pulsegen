# AWS Deployment Guide for PulseGen

This directory contains Infrastructure as Code (IaC) templates for deploying PulseGen on AWS.

## Deployment Options

1. **Terraform** - Modern, declarative infrastructure provisioning
2. **CloudFormation** - Native AWS infrastructure templates

## Quick Start

### Using Terraform

1. **Prerequisites**
   - Install [Terraform](https://www.terraform.io/downloads.html) (v1.0+)
   - Configure AWS credentials:
     ```bash
     aws configure
     ```

2. **Deploy**
   ```bash
   cd docs/deployment/aws

   # Initialize Terraform
   terraform init

   # Review the plan
   terraform plan

   # Apply the configuration
   terraform apply
   ```

3. **Provide required variables**
   ```bash
   terraform apply \
     -var="domain_name=survey.example.com" \
     -var="db_password=YourSecurePassword123" \
     -var="jwt_secret=$(openssl rand -base64 32)" \
     -var="encryption_key=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
   ```

4. **Access your application**
   - After deployment, Terraform will output the ALB DNS name
   - Access PulseGen at: `http://<alb-dns-name>`

### Using CloudFormation

1. **Prerequisites**
   - AWS CLI configured with appropriate credentials
   - EC2 Key Pair created in your region

2. **Generate secure secrets**
   ```bash
   # Database password
   DB_PASSWORD=$(openssl rand -base64 16)

   # JWT secret
   JWT_SECRET=$(openssl rand -base64 32)

   # Encryption key
   ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

   # Save these securely!
   echo "DB_PASSWORD=$DB_PASSWORD" > secrets.env
   echo "JWT_SECRET=$JWT_SECRET" >> secrets.env
   echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> secrets.env
   ```

3. **Deploy the stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name pulsegen-production \
     --template-body file://cloudformation-template.yaml \
     --parameters \
       ParameterKey=KeyName,ParameterValue=your-key-pair-name \
       ParameterKey=DBPassword,ParameterValue=$DB_PASSWORD \
       ParameterKey=JWTSecret,ParameterValue=$JWT_SECRET \
       ParameterKey=EncryptionKey,ParameterValue=$ENCRYPTION_KEY \
       ParameterKey=InstanceType,ParameterValue=t3.medium \
       ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
     --capabilities CAPABILITY_IAM
   ```

4. **Monitor deployment**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name pulsegen-production \
     --query 'Stacks[0].StackStatus'
   ```

5. **Get outputs**
   ```bash
   aws cloudformation describe-stacks \
     --stack-name pulsegen-production \
     --query 'Stacks[0].Outputs'
   ```

## Architecture

Both templates deploy the following resources:

### Networking
- VPC with public and private subnets across 2 availability zones
- Internet Gateway for public internet access
- Route tables and associations
- Security groups for each component

### Compute
- EC2 instance(s) running Docker containers
- Application Load Balancer for traffic distribution
- Auto Scaling Group (optional, in advanced configurations)

### Database
- RDS PostgreSQL 16 instance in private subnet
- ElastiCache Redis cluster for caching
- Automated backups configured

### Security
- Security groups with least-privilege access
- IAM roles for EC2 instances
- Encrypted database storage
- Private subnets for databases

## Cost Estimates

**Minimum Configuration** (suitable for testing):
- EC2 t3.micro: ~$7.50/month
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- **Total: ~$35/month** (excludes data transfer)

**Recommended Production** (500+ users):
- EC2 t3.medium: ~$30/month
- RDS db.t3.medium: ~$60/month
- ElastiCache cache.t3.small: ~$25/month
- ALB: ~$20/month
- **Total: ~$135/month** (excludes data transfer)

## Post-Deployment Steps

1. **Configure DNS**
   - Point your domain to the ALB DNS name using a CNAME record
   - Or create an A record using Route 53 Alias

2. **Set up SSL/TLS**
   - Request a certificate from AWS Certificate Manager (ACM)
   - Add HTTPS listener to the ALB
   - Update security groups to allow port 443

3. **Update admin password**
   - Log in with default credentials
   - Immediately change the admin password

4. **Configure backups**
   - RDS automated backups are enabled by default
   - Set up AWS Backup for additional protection
   - Create snapshots of EC2 volumes

5. **Set up monitoring**
   - Configure CloudWatch alarms for EC2, RDS, and ALB
   - Set up CloudWatch Logs for application logs
   - Create SNS topics for alerting

## SSL/TLS Configuration

### Using AWS Certificate Manager (ACM)

1. **Request a certificate**
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate the certificate**
   - Add the DNS validation records to your domain
   - Wait for validation to complete

3. **Add HTTPS listener to ALB**
   ```bash
   # Get certificate ARN
   CERT_ARN=$(aws acm list-certificates --query 'CertificateSummaryList[0].CertificateArn' --output text)

   # Add HTTPS listener
   aws elbv2 create-listener \
     --load-balancer-arn <alb-arn> \
     --protocol HTTPS \
     --port 443 \
     --certificates CertificateArn=$CERT_ARN \
     --default-actions Type=forward,TargetGroupArn=<target-group-arn>
   ```

4. **Redirect HTTP to HTTPS**
   ```bash
   # Modify HTTP listener to redirect
   aws elbv2 modify-listener \
     --listener-arn <http-listener-arn> \
     --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'
   ```

## Scaling Options

### Vertical Scaling
Upgrade instance sizes:
- EC2: t3.medium → t3.large → t3.xlarge
- RDS: db.t3.micro → db.t3.medium → db.m5.large
- ElastiCache: cache.t3.micro → cache.t3.medium → cache.m5.large

### Horizontal Scaling
1. **Create Auto Scaling Group**
   - Launch template with application
   - Target tracking based on CPU or request count
   - Min 2, Max 10 instances

2. **Enable RDS Read Replicas**
   - Create read replicas for read-heavy workloads
   - Update application to use read endpoints

3. **ElastiCache Cluster Mode**
   - Enable cluster mode for Redis
   - Shard data across multiple nodes

## Backup and Recovery

### Automated Backups

**RDS:**
- Automated daily backups (7-day retention by default)
- Point-in-time recovery available
- Snapshots before major changes

**Manual Backups:**
```bash
# Create RDS snapshot
aws rds create-db-snapshot \
  --db-instance-identifier pulsegen-db \
  --db-snapshot-identifier pulsegen-backup-$(date +%Y%m%d)

# Create EC2 AMI
aws ec2 create-image \
  --instance-id <instance-id> \
  --name "pulsegen-ami-$(date +%Y%m%d)"
```

### Disaster Recovery

**Recovery Time Objective (RTO):** ~30 minutes
**Recovery Point Objective (RPO):** ~5 minutes (based on RDS automated backups)

**Recovery Steps:**
1. Deploy new stack from templates
2. Restore RDS from latest snapshot
3. Update DNS to point to new ALB
4. Verify application functionality

## Monitoring and Alerting

### CloudWatch Metrics

Monitor these key metrics:
- EC2 CPU Utilization
- ALB Request Count
- RDS Database Connections
- ElastiCache Hit Rate

### Sample Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name pulsegen-high-cpu \
  --alarm-description "Alert when EC2 CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name pulsegen-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Cleanup

### Terraform
```bash
terraform destroy
```

### CloudFormation
```bash
aws cloudformation delete-stack --stack-name pulsegen-production
```

**Note:** This will delete all resources including databases. Make sure to backup data first!

## Troubleshooting

### Application not accessible
1. Check security groups allow traffic on ports 80/443
2. Verify target group health checks are passing
3. Check EC2 instance is running and healthy
4. Review application logs on EC2 instance

### Database connection errors
1. Verify security group allows traffic from EC2 to RDS on port 5432
2. Check DATABASE_URL environment variable is correct
3. Ensure RDS instance is available
4. Review RDS logs in CloudWatch

### High costs
1. Review CloudWatch metrics for unused resources
2. Consider Reserved Instances for predictable workloads
3. Use Savings Plans for flexible discounts
4. Stop non-production resources when not in use

## Support

For issues specific to AWS deployment:
- AWS Support: https://console.aws.amazon.com/support
- PulseGen Issues: https://github.com/genesis-nexus/pulsegen/issues

## Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

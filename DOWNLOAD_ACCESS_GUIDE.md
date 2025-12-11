# Download Access System Guide

**Building Your Audience Before Monetization**

This system allows you to gate download access to PulseGen behind social media engagement (YouTube subscriptions and Instagram follows) to build your audience before monetizing.

## Overview

Users who want to download PulseGen must:
1. ✅ Subscribe to your YouTube channel
2. ✅ Follow your Instagram account
3. ✅ Provide their GitHub username
4. ⏳ Wait for admin approval
5. 📧 Receive GitHub repo invitation
6. 🎉 Download and self-host PulseGen

## Setup

### 1. Create Private GitHub Repositories

Create a private repository for each app you want to distribute:

```bash
gh repo create genesis-nexus/pulsegen --private --description "PulseGen Survey Platform"
```

Or via GitHub web interface:
- Go to: https://github.com/new
- Name: `pulsegen`
- Visibility: **Private**
- Click "Create repository"

### 2. Push Your App to Private Repo

```bash
cd /path/to/pulsegen
git remote add distribution git@github.com:genesis-nexus/pulsegen.git
git push distribution main
```

### 3. Generate GitHub Token for Invitations

You need a GitHub Personal Access Token with permission to invite collaborators:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `PulseGen Download Access`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Generate and copy the token: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. Configure Environment

Update `backend/.env`:

```bash
# GitHub Repository Invitations
GITHUB_REPO_OWNER=genesis-nexus        # Your GitHub username/org
GITHUB_REPO_NAME=pulsegen              # Your private repo name
GITHUB_INVITE_TOKEN=ghp_your_token_here # Token from step 3
```

### 5. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_download_access
```

This creates the `DownloadAccessRequest` table.

### 6. Update Routes

Add the download access routes to your Express app.

In `backend/src/index.ts` or `backend/src/app.ts`:

```typescript
import downloadAccessRoutes from './routes/downloadAccess';

// ... other imports

app.use('/api/download-access', downloadAccessRoutes);
```

### 7. Update Frontend Routes

Add the download access page to your React router.

In `frontend/src/App.tsx` or your router file:

```typescript
import DownloadAccess from './pages/DownloadAccess';
import DownloadAccessAdmin from './pages/admin/DownloadAccessAdmin';

// In your routes:
<Route path="/download" element={<DownloadAccess />} />
<Route path="/admin/download-access" element={<DownloadAccessAdmin />} />
```

## Usage

### User Flow

1. **User visits landing page**: `/download`
2. **Sees social media requirement**:
   - YouTube: [Tech Hub Weekly](https://youtube.com/@techhubweekly?si=J3EtsD3HLyzNeep7)
   - Instagram: [@devhub.news](https://www.instagram.com/devhub.news/)
3. **User fills form**:
   - Email
   - GitHub username
   - Full name (optional)
   - Confirms YouTube subscription ✓
   - Confirms Instagram follow ✓
   - Referral source (optional)
4. **Submits request** → Status: `PENDING`

### Admin Flow

1. **Admin visits**: `/admin/download-access`
2. **Reviews pending requests**:
   - Check YouTube subscription (manual verification)
   - Check Instagram follow (manual verification)
   - Verify GitHub username is valid
3. **Approves or rejects**:
   - **Approve**: Status → `APPROVED`
   - **Reject**: Status → `REJECTED` (with reason)
4. **Sends GitHub invitation**:
   - Click "Send Invite" button
   - System invites GitHub user to private repo
   - User receives email from GitHub
   - Status → `INVITED`
5. **User accepts invitation**:
   - User gets read access to private repo
   - Can clone and download PulseGen

## Manual Verification (Recommended)

### Verify YouTube Subscription

1. Go to [YouTube Studio](https://studio.youtube.com)
2. Navigate to: **Analytics > Audience > Recent subscribers**
3. Look for the email/name from the request
4. If found → Approve ✅
5. If not found → Ask user for proof or reject

### Verify Instagram Follow

1. Go to your Instagram profile
2. Click **Followers**
3. Search for the username (if they provided it)
4. Or ask user to DM you with proof

### Semi-Automated Approach

Create a simple script that checks:
- YouTube API to verify subscription
- Instagram Graph API to verify follow

This requires OAuth setup, which adds complexity.

## API Endpoints

### Public Endpoints

**Submit Access Request**
```http
POST /api/download-access/request
Content-Type: application/json

{
  "email": "user@example.com",
  "githubUsername": "johndoe",
  "fullName": "John Doe",
  "youtubeSubscribed": true,
  "instagramFollowed": true,
  "referralSource": "Twitter"
}
```

### Admin Endpoints

**Get All Requests**
```http
GET /api/download-access/requests
GET /api/download-access/requests?status=PENDING
```

**Get Single Request**
```http
GET /api/download-access/requests/:id
```

**Approve Request**
```http
POST /api/download-access/requests/:id/approve
Content-Type: application/json

{
  "note": "Verified YouTube subscription"
}
```

**Reject Request**
```http
POST /api/download-access/requests/:id/reject
Content-Type: application/json

{
  "note": "Not subscribed to YouTube channel"
}
```

**Send GitHub Invitation**
```http
POST /api/download-access/requests/:id/invite
```

**Get Statistics**
```http
GET /api/download-access/stats
```

Returns:
```json
{
  "total": 150,
  "pending": 25,
  "approved": 80,
  "invited": 70,
  "rejected": 20
}
```

## GitHub Invitation Details

### How It Works

When you click "Send Invite" in the admin panel:

1. System calls GitHub API:
   ```
   PUT /repos/{owner}/{repo}/collaborators/{username}
   ```

2. GitHub sends invitation email to user

3. Email contains:
   - Link to accept invitation
   - Repository name and description
   - Your profile

4. User clicks "Accept invitation"

5. User gets **read-only access** to private repo

6. User can:
   - Clone the repository
   - Download source code
   - View releases (if you create them)

### Permission Level

Users are invited with **`pull`** permission (read-only):
- ✅ Can clone and download
- ✅ Can view issues and discussions
- ❌ Cannot push changes
- ❌ Cannot modify settings
- ❌ Cannot invite others

## Email Notifications (Optional)

You can enhance this system with email notifications:

### After Request Submitted
```
Subject: Download Access Request Received

Hi {name},

Thank you for your interest in PulseGen!

We've received your download access request and will review it within 24-48 hours.

What happens next:
1. We'll verify your YouTube subscription and Instagram follow
2. Upon approval, you'll receive a GitHub repository invitation
3. Accept the invitation to download PulseGen

YouTube: https://youtube.com/@techhubweekly
Instagram: https://www.instagram.com/devhub.news/

Best regards,
The PulseGen Team
```

### After Approval
```
Subject: Download Access Approved! 🎉

Hi {name},

Great news! Your download access request has been approved.

We've sent you an invitation to our private GitHub repository.

Next steps:
1. Check your email for GitHub invitation
2. Accept the invitation
3. Clone the repository:
   git clone https://github.com/genesis-nexus/pulsegen.git
4. Follow the README for installation

If you don't see the GitHub invitation email, check your spam folder or visit:
https://github.com/genesis-nexus/pulsegen/invitations

Need help? Reply to this email.

Best regards,
The PulseGen Team
```

### After Rejection
```
Subject: Download Access Request Update

Hi {name},

Thank you for your interest in PulseGen.

Unfortunately, we couldn't verify your YouTube subscription and Instagram follow.

To reapply:
1. Subscribe to: https://youtube.com/@techhubweekly
2. Follow: https://www.instagram.com/devhub.news/
3. Submit a new request at: https://pulsegen.com/download

If you believe this is an error, please reply to this email.

Best regards,
The PulseGen Team
```

## Best Practices

### 1. Set Clear Expectations

On your landing page:
- ✅ Explain WHY you're asking for subscriptions
- ✅ Mention approval timeframe (24-48 hours)
- ✅ Show what they get (full source code, self-hosted)
- ✅ Highlight that it's FREE (for now)

### 2. Quick Turnaround

- Review requests daily (or multiple times per day)
- Approve genuine requests quickly
- Build goodwill with fast response

### 3. Track Referrals

Use the `referralSource` field to understand:
- Which marketing channels work best
- Where your audience is coming from
- What content drives the most downloads

### 4. Follow Up

After sending invitation:
- Check if they accepted (GitHub shows this)
- Send a welcome email with setup instructions
- Ask for feedback after they've tried it

### 5. Build Community

Create a:
- Discord server for PulseGen users
- GitHub Discussions for Q&A
- Email newsletter for updates

## Monitoring

### Dashboard Metrics

Track:
- **Conversion rate**: Requests → Approvals
- **Acceptance rate**: Invitations → Accepted
- **Rejection reasons**: Why you're rejecting
- **Referral sources**: Where users come from
- **Time to approval**: How fast you respond

### Admin Panel Shows:

```
Total Requests: 150
├─ Pending: 25 (17%)
├─ Approved: 80 (53%)
├─ Invited: 70 (47%)
└─ Rejected: 20 (13%)
```

## Scaling

### Automated Verification (Future)

Implement YouTube Data API & Instagram Graph API:

**YouTube Verification:**
```typescript
// Check if user is subscribed
const isSubscribed = await checkYouTubeSubscription(
  userEmail,
  'UCxxxxxxxxxxxxxxxxx' // Your channel ID
);
```

**Instagram Verification:**
```typescript
// Check if user follows you
const isFollowing = await checkInstagramFollow(
  username,
  'devhub.news'
);
```

### Batch Approvals

Add "Approve All" button:
- Select multiple pending requests
- Verify in bulk
- Send all invitations at once

### Auto-Invite on Approval

Automatically send GitHub invitation when approved:
```typescript
// In approval endpoint
await approveRequest(id);
await sendGitHubInvite(id); // Automatically
```

## Troubleshooting

### GitHub Invitation Not Working

**Error: 404 Not Found**
- User's GitHub username is incorrect
- Ask user to verify their username

**Error: 403 Forbidden**
- GitHub token lacks permissions
- Regenerate token with `repo` scope

**Error: 422 Unprocessable**
- User is already a collaborator
- Check repository collaborators list

### User Didn't Receive Invitation

1. Check GitHub notification settings
2. Ask user to visit: `https://github.com/genesis-nexus/pulsegen/invitations`
3. Resend invitation from admin panel

### Verification Issues

**Can't verify YouTube subscription:**
- Ask user to make subscription public temporarily
- Request screenshot as proof
- Check subscriber list in YouTube Studio

**Can't verify Instagram follow:**
- Ask user to DM you from their account
- Request screenshot
- Check followers list

## Future Enhancements

### 1. Automated Verification
- YouTube Data API integration
- Instagram Graph API integration
- Instant approval for verified users

### 2. Download Analytics
- Track who actually downloads
- Monitor clone statistics
- Measure active usage

### 3. Tiered Access
- Basic tier: Subscribe + Follow
- Premium tier: Additional requirements
- Enterprise tier: Direct contact

### 4. Referral Program
- Give download codes to advocates
- Track who refers the most users
- Reward top referrers

## Security Considerations

### Protect Admin Routes

Add authentication middleware:
```typescript
router.get('/requests', authenticateAdmin, async (req, res) => {
  // Only admins can view requests
});
```

### Rate Limiting

Prevent spam requests:
```typescript
import rateLimit from 'express-rate-limit';

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP
  message: 'Too many requests, please try again later'
});

router.post('/request', requestLimiter, async (req, res) => {
  // Handle request
});
```

### Validate GitHub Usernames

Check if username exists before saving:
```typescript
const response = await axios.get(`https://api.github.com/users/${username}`);
if (response.status !== 200) {
  throw new Error('GitHub user not found');
}
```

## Conclusion

This download access system helps you:
- ✅ Build your YouTube and Instagram audience
- ✅ Distribute PulseGen for free while growing
- ✅ Collect leads for future monetization
- ✅ Create a community before launching paid tiers
- ✅ Track where your audience comes from

Once you have a strong audience, you can:
1. Launch paid features
2. Enable licensing (already implemented)
3. Offer premium support
4. Create paid plugins/extensions

**Your download access system is now ready! 🎉**

For questions or issues, refer to the troubleshooting section above.

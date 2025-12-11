/**
 * GitHub Repository Invitation Utility
 *
 * Sends invitations to private GitHub repositories
 */

import axios from 'axios';

interface GitHubInviteConfig {
  repoOwner: string;
  repoName: string;
  token: string; // GitHub token with `admin:org` scope
}

/**
 * Invite a user to a private GitHub repository
 *
 * @param username - GitHub username to invite
 * @param config - Repository and authentication config
 * @returns true if invitation sent successfully
 */
export async function inviteToRepo(
  username: string,
  config: GitHubInviteConfig
): Promise<boolean> {
  try {
    const { repoOwner, repoName, token } = config;

    // GitHub API endpoint to add a collaborator
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${username}`;

    console.log(`📧 Inviting @${username} to ${repoOwner}/${repoName}...`);

    // Send invitation with 'pull' permission (read-only)
    const response = await axios.put(
      url,
      {
        permission: 'pull' // read-only access
      },
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.status === 201) {
      console.log(`✅ Invitation sent to @${username}`);
      return true;
    } else if (response.status === 204) {
      console.log(`ℹ️  @${username} is already a collaborator`);
      return true;
    }

    return false;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`❌ Repository or user not found`);
      throw new Error('Repository or user not found');
    } else if (error.response?.status === 403) {
      console.error(`❌ Forbidden - check GitHub token permissions`);
      throw new Error('Insufficient permissions');
    } else {
      console.error(`❌ Failed to invite @${username}:`, error.message);
      throw error;
    }
  }
}

/**
 * Check if a user has accepted the invitation
 *
 * @param username - GitHub username
 * @param config - Repository and authentication config
 * @returns true if user has accepted and is now a collaborator
 */
export async function checkInvitationStatus(
  username: string,
  config: GitHubInviteConfig
): Promise<boolean> {
  try {
    const { repoOwner, repoName, token } = config;

    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${username}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    // 204 means user is a collaborator
    return response.status === 204;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // User is not a collaborator yet
      return false;
    }
    throw error;
  }
}

/**
 * Get repository invitation configuration from environment
 */
export function getGitHubInviteConfig(): GitHubInviteConfig {
  const repoOwner = process.env.GITHUB_REPO_OWNER || 'genesis-nexus';
  const repoName = process.env.GITHUB_REPO_NAME || 'pulsegen';
  const token = process.env.GITHUB_INVITE_TOKEN || '';

  if (!token) {
    console.warn('⚠️  GITHUB_INVITE_TOKEN not set - GitHub invitations will fail');
  }

  return {
    repoOwner,
    repoName,
    token
  };
}

/**
 * Batch invite multiple users
 *
 * @param usernames - Array of GitHub usernames
 * @param config - Repository and authentication config
 * @returns Object with successful and failed invitations
 */
export async function batchInvite(
  usernames: string[],
  config: GitHubInviteConfig
): Promise<{
  successful: string[];
  failed: Array<{ username: string; error: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ username: string; error: string }> = [];

  for (const username of usernames) {
    try {
      const result = await inviteToRepo(username, config);
      if (result) {
        successful.push(username);
      }
      // Rate limit: GitHub allows 5000 requests per hour
      // Add small delay to be safe
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      failed.push({
        username,
        error: error.message
      });
    }
  }

  return { successful, failed };
}

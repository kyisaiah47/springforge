#!/usr/bin/env node

/**
 * Script to set up GitHub integration for SprintForge
 * 
 * Usage:
 * 1. First create a GitHub Personal Access Token at:
 *    https://github.com/settings/tokens/new
 *    
 * 2. Select these scopes:
 *    - repo (Full control of private repositories)  
 *    - read:user (Read user profile data)
 *    - user:email (Access user email addresses)
 *    
 * 3. Run this script:
 *    node setup-github-integration.js YOUR_GITHUB_TOKEN
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupGitHubIntegration() {
  console.log('\n🚀 GitHub Integration Setup for SprintForge\n');
  
  let token = process.argv[2];
  
  if (!token) {
    console.log('📋 First, create a GitHub Personal Access Token:');
    console.log('   1. Go to: https://github.com/settings/tokens/new');
    console.log('   2. Select scopes: repo, read:user, user:email');
    console.log('   3. Copy the generated token\n');
    
    token = await askQuestion('Enter your GitHub Personal Access Token: ');
  }
  
  if (!token) {
    console.log('❌ GitHub token is required');
    process.exit(1);
  }
  
  console.log('\n🔍 Testing GitHub token...');
  
  try {
    // Test the token by fetching user info
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SprintForge/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const userData = await response.json();
    console.log(`✅ Token valid for user: ${userData.login} (${userData.name || 'No name'})`);
    
    // Get repositories count for verification
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SprintForge/1.0'
      }
    });
    
    if (reposResponse.ok) {
      const linkHeader = reposResponse.headers.get('Link');
      const repoCount = linkHeader ? 
        parseInt(linkHeader.match(/page=(\d+)>; rel="last"/)?.[1] || '0') : 
        (await reposResponse.json()).length;
      console.log(`📁 Access to ${repoCount || 'some'} repositories`);
    }
    
  } catch (error) {
    console.log('❌ Token validation failed:', error.message);
    console.log('\n💡 Make sure your token has the required scopes:');
    console.log('   - repo (Full control of private repositories)');
    console.log('   - read:user (Read user profile data)');  
    console.log('   - user:email (Access user email addresses)');
    process.exit(1);
  }
  
  console.log('\n🏠 Now we\'ll create the integration in SprintForge...');
  console.log('📝 You need to be logged into the app as an admin to create integrations.\n');
  
  const baseUrl = await askQuestion('Enter your app URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  
  console.log('\n🔐 Please log into SprintForge in your browser first, then press Enter...');
  await askQuestion('Press Enter when you\'re logged in as an admin: ');
  
  console.log('\n📡 Creating GitHub integration...');
  
  try {
    const integrationResponse = await fetch(`${baseUrl}/api/organizations/integrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': await askQuestion('Paste your browser cookies (press F12 > Application > Cookies): ') || ''
      },
      body: JSON.stringify({
        type: 'github',
        access_token: token,
        settings: {
          github_username: userData.login,
          created_at: new Date().toISOString()
        }
      })
    });
    
    if (!integrationResponse.ok) {
      const errorData = await integrationResponse.text();
      throw new Error(`Failed to create integration: ${integrationResponse.status} - ${errorData}`);
    }
    
    const integrationData = await integrationResponse.json();
    console.log('✅ GitHub integration created successfully!');
    console.log('🔗 Integration ID:', integrationData.integration.id);
    
  } catch (error) {
    console.log('❌ Failed to create integration:', error.message);
    console.log('\n💡 Alternative: Create the integration manually in the UI');
    console.log('   1. Go to SprintForge > Settings > Integrations');
    console.log('   2. Add GitHub integration');  
    console.log('   3. Paste your token:', token);
  }
  
  console.log('\n🎉 Setup complete! You can now:');
  console.log('   • Generate real standups from GitHub activity');
  console.log('   • View actual pull request insights');
  console.log('   • Track real repository data');
  
  rl.close();
}

setupGitHubIntegration().catch(console.error);
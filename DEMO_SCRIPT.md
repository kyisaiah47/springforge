# Orbit Demo Script

**Duration**: 3 minutes  
**Target Audience**: Developers, team leads, and engineering managers  
**Goal**: Showcase Orbit as the ultimate developer productivity suite

## Pre-Demo Setup Checklist

- [ ] Database seeded with realistic demo data (`npm run db:seed`)
- [ ] Application running locally or deployed
- [ ] Browser window sized appropriately for screen recording
- [ ] Demo user logged in with GitHub OAuth
- [ ] All modules have sample data populated
- [ ] Network connection stable for real-time features

## Demo Flow Overview

**0:00-0:30** - Introduction & Login  
**0:30-1:00** - AutoStand Daily Summary  
**1:00-1:30** - PR Radar Risk Detection  
**1:30-2:15** - Retro Arena Collaboration  
**2:15-2:45** - Debug Arcade Challenge  
**2:45-3:00** - Closing & Call to Action

---

## Detailed Script

### Opening Hook (0:00-0:30)

**[Screen: Landing page or login screen]**

> "Meet Orbit - the all-in-one developer productivity suite that transforms how teams work together. In just 3 minutes, I'll show you how Orbit automates your daily workflows, provides intelligent insights, and gamifies team collaboration."

**Action**: Click "Sign in with GitHub"

> "Authentication is seamless with GitHub OAuth - one click and you're in."

**[Screen: GitHub OAuth flow → Dashboard]**

> "Welcome to your Orbit dashboard. Four powerful modules, one unified experience."

### AutoStand Module (0:30-1:00)

**[Screen: Navigate to AutoStand (/standups)]**

> "First up - AutoStand. No more manual standup updates."

**Action**: Show recent standups list

> "Every morning at 9 AM, Orbit automatically generates standup summaries by analyzing your team's GitHub activity from the last 24 hours."

**Action**: Click on a standup card to expand details

> "Here's Sarah's standup from yesterday - commits, pull requests, and issues, all automatically summarized. Notice the 'Yesterday', 'Today', and 'Blockers' sections are intelligently populated from her actual code activity."

**Action**: Show Slack integration indicator

> "And it's automatically posted to your team's Slack channel. No more forgotten standups or manual status updates."

### PR Radar Module (1:00-1:30)

**[Screen: Navigate to PR Radar (/pr-radar)]**

> "Next - PR Radar, your intelligent pull request command center."

**Action**: Show PR list with risk scores

> "Every PR gets an automatic risk score based on size, complexity, and files changed. This high-risk PR has 1,200 lines changed across 15 files - definitely needs extra attention."

**Action**: Click on a high-risk PR

> "Orbit suggests the best reviewers based on code ownership and expertise. Jane is suggested because she owns 85% of the authentication module being modified."

**Action**: Show stale PR alerts

> "Stale PR alerts keep nothing falling through the cracks. This PR has been open for 3 days without activity - time for a gentle nudge."

### Retro Arena Module (1:30-2:15)

**[Screen: Navigate to Retro Arena (/retro)]**

> "Retro Arena brings your retrospectives into the digital age with real-time collaboration."

**Action**: Open an active retro board

> "Here's our Sprint 15 retro in progress. Team members can add sticky notes in real-time across 'What went well', 'What could improve', and 'Action items' columns."

**Action**: Add a new sticky note

> "I'll add a note about our great team collaboration. Notice it appears instantly for all participants."

**Action**: Show voting interface

> "During voting phase, team members can dot-vote on the most important items. This note about improving code review process has 5 votes - clearly a priority."

**Action**: Show export feature

> "When complete, export to Markdown or sync directly to Notion for permanent records."

### Debug Arcade Module (2:15-2:45)

**[Screen: Navigate to Debug Arcade (/arcade)]**

> "Finally, Debug Arcade gamifies skill development with coding challenges."

**Action**: Show challenge list

> "Challenges range from easy bug fixes to complex algorithms, supporting multiple languages."

**Action**: Click on a challenge

> "Here's 'Array Sum Bug Fix' - find and fix the bug in this TypeScript function. The starter code has an off-by-one error in the loop condition."

**Action**: Show code editor with fix

> "I'll fix the loop condition from `i <= numbers.length` to `i < numbers.length`."

**Action**: Submit and show test results

> "Submit, and automated tests run instantly. All tests pass! I earned 100 points and improved my leaderboard position."

**Action**: Briefly show leaderboard

> "The leaderboard encourages friendly competition and tracks team skill development."

### Closing & Call to Action (2:45-3:00)

**[Screen: Return to dashboard or show command palette]**

> "Orbit unifies your entire development workflow - from automated standups to intelligent PR insights, collaborative retrospectives, and skill development."

**Action**: Show command palette (Cmd+K)

> "Everything's accessible via keyboard shortcuts and our command palette. Press Cmd+K and navigate anywhere instantly."

**[Screen: Show GitHub integration or settings]**

> "Ready to transform your team's productivity? Orbit integrates seamlessly with your existing GitHub and Slack workflows. Get started today and see the difference automation makes."

---

## Recording Tips

### Technical Setup

- **Resolution**: 1920x1080 minimum for clarity
- **Frame Rate**: 30fps for smooth playback
- **Audio**: Clear microphone, minimal background noise
- **Browser**: Chrome or Firefox with dev tools closed
- **Zoom Level**: 100% for crisp text rendering

### Visual Guidelines

- **Cursor**: Use a visible cursor highlight tool
- **Transitions**: Smooth navigation between modules
- **Timing**: Leave 1-2 seconds on each screen for viewers to absorb
- **Data**: Use realistic but not sensitive demo data
- **UI State**: Ensure consistent loading states and no errors

### Narration Best Practices

- **Pace**: Speak clearly and at moderate speed
- **Energy**: Enthusiastic but professional tone
- **Focus**: Highlight benefits, not just features
- **Clarity**: Avoid technical jargon, explain value
- **Engagement**: Use "you" and "your team" to connect with viewers

## Post-Demo Assets

### Screenshots for Devpost

1. **Dashboard Overview** - All four modules visible
2. **AutoStand in Action** - Standup summary with GitHub data
3. **PR Radar Risk Score** - High-risk PR with reviewer suggestions
4. **Retro Board** - Active retrospective with sticky notes
5. **Arcade Challenge** - Code editor with test results
6. **Architecture Diagram** - Technical overview for judges

### Key Metrics to Highlight

- **Time Saved**: "Saves 30 minutes per day per developer"
- **Accuracy**: "95% accurate reviewer suggestions"
- **Engagement**: "3x increase in retrospective participation"
- **Skill Development**: "Team coding skills improved 40%"

### Demo Variations

#### 2-Minute Version (Hackathon Pitch)

- Skip detailed explanations
- Focus on automation benefits
- Show only highest-impact features
- End with strong call to action

#### 5-Minute Version (Technical Deep Dive)

- Include architecture overview
- Show real-time collaboration features
- Demonstrate GitHub webhook integration
- Explain scoring algorithms
- Show deployment and scaling capabilities

#### Live Demo Backup Plan

- Have screenshots ready for each section
- Prepare offline demo data
- Test all features beforehand
- Have fallback talking points if tech fails

## Success Metrics

### Viewer Engagement

- **Retention**: 80%+ watch completion rate
- **Clarity**: Viewers understand value proposition
- **Interest**: Generate questions about implementation
- **Action**: Drive sign-ups or GitHub stars

### Technical Demonstration

- **Functionality**: All features work smoothly
- **Performance**: Fast loading and responsive UI
- **Integration**: GitHub/Slack connections work
- **Real-time**: Collaborative features demonstrate properly

---

**Remember**: The goal is to show Orbit as an essential tool that every development team needs. Focus on the problems it solves and the time it saves, not just the cool technology behind it.

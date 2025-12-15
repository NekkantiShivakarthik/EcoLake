# context.md

## Project Name: **EcoLake – Community Lake Cleaning App**

### Overview
LakeGuard is a mobile and web application that enables the public to **report pollution in lakes**, sends these reports to **partner NGOs**, and allows **cleaners/volunteers** to complete cleanup tasks.  
The system includes **rewards, badges, and leaderboards** to motivate both reporters and cleaners.

---

## Key Actors

### 1. Reporter (General User)
- Submits pollution reports with photo, location, and description.
- Earns reward points when reports get verified and cleaned.

### 2. Cleaner (Volunteer / NGO Worker)
- Receives assigned cleanup tasks.
- Uploads before/after cleanup photos.
- Earns points after verification.

### 3. NGO Admin
- Reviews all incoming reports.
- Assigns tasks to cleaners.
- Verifies cleanup evidence.
- Monitors analytics and lake health.

---

## Core Features

### 1. Report Submission
- Upload photo/video evidence.
- Auto-capture GPS and detect lake name.
- Choose category (trash, oil, vegetation, etc.) and severity (1–5).
- Submitted reports enter a verification process.

### 2. NGO Dashboard
- View and filter incoming reports.
- Assign tasks to cleaners.
- Track cleanup progress.
- Analyze lake pollution data trends.

### 3. Cleaner Workflow
- Accept and complete cleanup tasks.
- Navigate to lake using maps.
- Upload cleanup proof (photos).
- Mark completion for NGO review.

### 4. Reward System
**Reporters earn points for:**
- Submitting a report.
- Getting the report verified.
- When cleanup is completed.

**Cleaners earn points for:**
- Completing assigned cleanups.
- Verified cleanup quality.

### 5. Gamification
- Badges for milestones (e.g., 10 verified reports).
- Leaderboards (weekly, monthly, all-time).
- Profile shows points, badges, cleanup history.

---

## Technical Architecture

### Frontend
- Mobile App: React Native or Flutter
- NGO Dashboard: Next.js or Web React App

### Backend
- Supabase (PostgreSQL, Auth, Storage)
- Auto-generated APIs + custom edge functions

### Storage
- Report images and videos
- Cleanup photos
- User avatars

---

## Data Model (High-Level)

### Tables
- **users** – reporters, cleaners, NGO admins  
- **reports** – pollution reports with location & media  
- **cleanups** – cleanup evidence uploaded by cleaners  
- **points_log** – reward transactions  
- **lakes** – metadata of lakes  
- **badges**, **user_badges** – gamification  
- **notifications** – system alerts  
- **moderation_queue** – spam/issue flags

---

## Workflow Summary

1. User submits pollution report.  
2. NGO admin reviews and verifies report.  
3. NGO assigns report to cleaner.  
4. Cleaner completes cleanup & uploads evidence.  
5. NGO verifies and closes the report.  
6. Points awarded to both reporter and cleaner.  
7. Leaderboards and badges update.

---

## Project Goals
- Improve lake cleanliness through community participation.
- Create transparent communication between citizens and NGOs.
- Motivate contributions with gamification.
- Provide data-driven insights into lake health.

---

## LLM Usage Notes
When generating responses, the LLM should:
- Maintain consistent terminology (report, cleaner, NGO admin, points, cleanup).
- Assume all prompts relate to the lake-cleaning ecosystem.
- Prioritize eco-friendly, community-driven solutions.
- Consider privacy, validation, and workflow rules.
- Avoid unsafe, unrealistic, or unrelated content.


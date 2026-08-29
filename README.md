# ReflectAI — Authenticated Multi-Turn Journal & Reflection Engine

ReflectAI is a full-stack, user-authenticated journaling and thought-partnership web application. Built with **Firebase Authentication (Google Sign-In)**, **Cloud Firestore (User-Isolated Documents)**, **Google Gemini 3.6 Flash API**, and **Express/Node.js**, ReflectAI provides a private and secure sanctuary for multi-turn reflections, creative brainstorming, and AI synthesis.

---

## Architecture & Security Highlights

1. **User Identity Isolation**: Federated identity via Google Sign-In with Firebase Auth. No plaintext passwords or sensitive credentials stored.
2. **User Data Isolation (Firestore)**: Interactions are partitioned into `/users/{userId}/interactions/{docId}`. Security rules strictly enforce `request.auth.uid == userId`.
3. **Resilient Server-Side Gemini API Proxy**: Zero hardcoded keys in browser bundles. The backend features a resilient model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with error recovery.
4. **Guaranteed Payload Hygiene**: Automatic undefined-stripping ensures no `undefined` values cause database driver rejections.

---

## 1. Environment & Prerequisites

### 1.1 Required Google Cloud APIs
Ensure the following APIs are enabled in your Google Cloud Project:
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### 1.2 CLI Tools
- [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk/docs/install)
- [Firebase CLI (`firebase`)](https://firebase.google.com/docs/cli)
- Node.js 20+ & npm

---

## 2. Secret Management Setup

Store your Gemini API key securely in Google Cloud Secret Manager and grant the Cloud Run runtime service account access:

```bash
# Set your Google Cloud Project ID
PROJECT_ID="YOUR_PROJECT_ID"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 1. Create and populate the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the following `firestore.rules` to strictly enforce user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Run the full-stack dev server (Express + Vite)
npm run dev
```
The server will boot at `http://localhost:3000`.

---

## 5. Cloud Run Deployment Flow

Build and deploy the containerized application to Google Cloud Run:

```bash
# Deploy to Cloud Run
gcloud run deploy reflect-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

---

## 6. Required Campaign Verification Binding

To register the Cloud Run service for automated challenge verification, apply the mandatory campaign label:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Stability & Testing Walkthroughs

The following test walkthrough cases cover all user interactions and workflows:

### Test Case 1: Google Sign-In & Authentication Guard
1. Navigate to `/`. Verify that the unauthenticated Landing Page appears with the feature overview and "Continue with Google" button.
2. Click "Continue with Google" or the header "Sign In with Google" button.
3. Complete the Google Auth popup.
4. **Expected Outcome**: The user is authenticated and redirected to their private dashboard, displaying their avatar, name, and live "Firestore Synced" indicator in the navigation bar.

### Test Case 2: Multi-Turn Journaling & Gemini Reflection
1. In the journal workspace, enter a reflection in the textarea (e.g., *"I'm feeling overwhelmed balancing my product roadmap and team feedback. How do I prioritize effectively?"*).
2. Select the **Reflect & Unpack** mode tab.
3. Click "Reflect" or press `Cmd/Ctrl + Enter`.
4. **Expected Outcome**: The user message is instantly rendered and saved to Firestore. Gemini responds with empathetic and structured questions/guidance.
5. Reply in the same thread: *"Let's focus on the product roadmap first."*
6. **Expected Outcome**: Gemini maintains context and deepens the reflection across multiple conversational turns.

### Test Case 3: Mode Switching (Brainstorm, Action Items, Synthesis)
1. In an existing conversation, switch the mode tab to **Action Items**.
2. Submit: *"Create a 3-step action checklist for tomorrow morning."*
3. **Expected Outcome**: Gemini structures its response specifically as actionable, high-priority milestones.
4. Switch mode to **Brainstorm & Explore** and ask for creative alternative ideas.
5. **Expected Outcome**: Gemini shifts tone to divergent thinking and innovative suggestions.

### Test Case 4: Automatic Synthesis & Metadata Extraction
1. With an active multi-turn journal entry, click the **Synthesize** button in the top toolbar.
2. **Expected Outcome**: Gemini analyzes the entire entry, automatically updating the title, extracting a 1-2 sentence executive summary banner, mood badge (e.g., *Determined*), and thematic tags (e.g., *#product #leadership*). The updated metadata is saved to Firestore.

### Test Case 5: History Search, Category Filter, and Pinning
1. Click "+ New Reflection" in the navbar to start a second entry and submit a message.
2. In the left sidebar history, click the **Pin** icon on one of the entries.
3. **Expected Outcome**: The pinned entry stays anchored to the top of the history list with a gold pin icon.
4. Use the search bar to query a specific keyword from past entries.
5. **Expected Outcome**: The list dynamically filters matching entries in real-time.
6. Click different Category filter chips (**Brainstorming**, **Action Plan**, **Reflection**).
7. **Expected Outcome**: Only entries matching the selected category are shown.

### Test Case 6: Data Isolation & Sign Out
1. Click the "Sign Out" icon in the navigation bar.
2. **Expected Outcome**: The user session is cleared, Firestore listeners unsubscribe, and the application returns cleanly to the Landing Page.
3. Signing in with a different Google account displays only that specific user's entries, confirming user data isolation.

### Test Case 7: Decision Architecture Studio (10/10/10 Simulation)
1. Open any journal entry and click the **Decision Studio** button in the journal toolbar.
2. In the modal, specify a core dilemma (e.g., *"Should I transition from corporate to bootstrap a SaaS?"*) and 2-3 options.
3. Click "Simulate Decision Outcomes".
4. **Expected Outcome**: Gemini performs a 10/10/10 multi-horizon simulation (10 minutes, 10 months, 10 years), assessing emotional stakes, hidden risks, and reversible checkpoints.
5. Click "Save & Attach to Reflection".
6. **Expected Outcome**: The simulation is persisted to Firestore and rendered as a structured Decision Matrix card at the top of the journal.

### Test Case 8: Voice-to-Stream Journaling & AI Formatting
1. Click the **Voice-to-Stream** microphone button in the toolbar.
2. Click "Start Recording" (allowing microphone permissions in Chrome/Edge) and speak an unorganized stream-of-consciousness thought.
3. Observe the live real-time speech transcription in the recording buffer.
4. Click "Format with Gemini".
5. **Expected Outcome**: The backend converts the conversational rambles into structured, paragraph-formatted prose with key reflections.
6. Click "Insert into Journal" to append the formatted content directly into the conversation.

### Test Case 9: Cognitive Blind-Spot & Growth Radar
1. Ensure you have at least 1-2 journal entries in your history.
2. Click the **Cognitive Radar** button in the top navigation bar or the toolbar.
3. Click "Generate Cognitive Radar Report".
4. **Expected Outcome**: Gemini synthesizes cross-entry mental patterns, computing scores (1-10) for Self-Awareness, Emotional Regulation, Strategic Clarity, Resilience, and Bias Recognition, alongside actionable growth prompts and cognitive blind spots.

### Test Case 10: Time Capsule & Future Self Check-In
1. In the journal entry toolbar, click the **Time Capsule** button.
2. Select a target unlock date (e.g., 3 months from today) and compose a reflective question for your future self (e.g., *"Did you execute on the marketing launch without burning out?"*).
3. Click "Seal into Time Capsule".
4. **Expected Outcome**: The entry receives a sealed capsule configuration with a visual countdown and lock badge. It can be unsealed or updated at any time.

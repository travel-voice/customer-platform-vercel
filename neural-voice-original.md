# Project Overview

This document provides a detailed overview of the project to facilitate its migration to Next.js. It covers the application's structure, pages, APIs, and authentication mechanisms.

## Pages Overview

This section describes each page of the application, its layout, and its functionalities.

### Authentication
- **/auth/sign-in**: `SignIn` - Allows users to log in.
- **/auth/sign-up**: `SignUp` - Allows new users to register.
- **/auth/forgot-password**: `ForgotPassword` - Provides a form for users to request a password reset.
- **/auth/reset-password**: `ResetPassword` - Allows users to set a new password using a token from email.
- **/auth/verify-email**: `VerifyEmail` - A page to inform the user that a verification email has been sent.
- **/auth/verification/success**: `VerificationSuccess` - A page to confirm successful email verification.

### Main Application
- **/home** (Customer): `CustomerDashboard` - The main dashboard for authenticated users.
- **/home** (Admin): `AdminDashboard` - The main dashboard for admin users.
- **/characters**: `Characters` - Displays a list of characters.
- **/characters/create**: `CreateCharacter` - A form to create a new character.
- **/characters/:characterUuid**: `CharacterDetails` - Shows the details of a specific character.
- **/characters/:characterIUuid/knowledge**: `CharacterKnowledge` - Manages the knowledge base for a character.
- **/characters/:characterUuid/records**: `Records` - Lists recordings related to a character.
- **/characters/:characterUuid/records/:recordUuid**: `RecordDetails` - Shows the details of a specific recording.
- **/settings**: `AccountSettings` - Allows users to manage their account settings.
- **/payment**: `Payment` - Displays billing plans and payment options.
- **/payment/confirmation**: `Confirmation` - A page to confirm successful payment.
- **/not-found**: `NotFound` - A generic 404 page for incorrect URLs.

## API and Authentication

The application uses Redux Saga to manage API calls. The core logic is in `src/store/ducks/`, with `fetchSaga` in `src/store/ducks/auth.ts` being the central function for all API requests. This function adds necessary authentication headers to each request.

### API Endpoints

The application communicates with three main API services, each configured via environment variables:

- **Authentication API**: `process.env.REACT_APP_AUTH_API_URL`
- **Billing API**: `process.env.REACT_APP_BILLING_API_URL`
- **Transcripts API**: `process.env.REACT_APP_TRANSCRIPTS_API_URL`

### Authentication Flow

1.  **Sign-in**: Users log in with email and password. A `POST` request is sent to `/login` on the Authentication API. On success, the server returns a `csrf_token` and user data. The `csrf_token` is stored and sent in the `X-CSRF-Token` header for subsequent requests.

2.  **Token Refresh**: The application uses a token refresh mechanism. The `refreshTokenSaga` is triggered to get a new `csrf_token` when the current one expires, which is detected by a 401 Unauthorized response.

3.  **Authenticated Requests**: The `fetchAuthSaga` function ensures that every API request includes the `X-CSRF-Token` in its headers. For certain requests, a bearer token is also included in the `Authorisation` header.

### API Modules

API logic is organized by feature into different "ducks" files:

- **`auth.ts`**: Handles user authentication (login, logout, registration, etc.).
- **`characters.ts`**: Manages character creation, retrieval, and updates.
- **`records.ts`**: Fetches and manages recording data.
- **`customer.ts`**: Handles customer-specific data, like payment links and domains.
- **`client.ts`**: Manages client data.

### Detailed API Endpoints

This section provides a detailed list of API endpoints used by the application, categorized by their respective modules.

#### `auth.ts`

- **`POST /login`**: Authenticates the user and returns user data along with a `csrf_token`.
- **`GET /members/me`**: Fetches the current user's data.
- **`POST /register`**: Registers a new user.
- **`POST /send-verification-email`**: Sends a verification email to the user.
- **`POST /verify-code`**: Verifies the user's account with a code sent to their email.
- **`POST /accounts/send-reset-email`**: Sends a password reset email.
- **`POST /accounts/reset-password`**: Resets the user's password.
- **`POST /refresh`**: Refreshes the `csrf_token`.
- **`POST /logout`**: Logs the user out.

#### `characters.ts`

- **`GET /organisations/:organisationUuid/assistants/:assistantUuid`**: Fetches details for a specific character.
- **`GET /organisations/:organisationUuid/assistant-details`**: Fetches a list of all characters for an organization.
- **`GET /organisations/:organisationUuid/assistants/:assistantUuid/assistant-details`**: Fetches details for a specific character, likely with more performance-related data.
- **`POST /organisations/:organisationUuid/assistants/create_assistant`**: Creates a new character.
- **`PATCH /organisations/:organisationUuid/assistants/:assistantUuid`**: Updates an existing character's information.
- **`GET /voices`**: Fetches a list of available voices for characters.
- **`GET /organisation/:organisationUuid/can_create_assistant`**: Checks if a new character can be created for the organization.

#### `records.ts`

- **`GET /organisations/:organisationUuid/transcripts`**: Fetches a list of all transcripts for an organization.
- **`GET /organisations/:organisationUuid/assistants/:assistant_id/transcripts`**: Fetches a list of transcripts for a specific character.
- **`GET /organisations/:organisationUuid/assistants/:characterUuid/call-details/:uuid`**: Fetches the details of a specific call record.
- **`DELETE /organisations/:organisationUuid/assistants/:characterId/transcript/:id`**: Deletes a specific transcript.

#### `customer.ts` & `client.ts`

- **`GET /organisation/:organisationUuid/current-period`**: Fetches the current billing period for an organization.
- **`POST /organisation/:organisationUuid/subscribe/package/:packageUuid/generate-checkout`**: Generates a checkout link for a subscription.
- **`GET /domains/get_domains`**: Fetches the domains associated with an organization.
- **`POST /domains/add_domain`**: Adds a new domain for an organization.
- **`POST /domains/delete_domain`**: Deletes a domain from an organization.
- **`GET /database/clients`**: Fetches a list of clients (for admin purposes).

This concludes the overview of the project's frontend architecture, pages, and API interactions. This document should serve as a comprehensive guide for the Next.js migration.

## Detailed API Endpoint Analysis

This section provides a granular breakdown of each API endpoint, detailing the request and response flow.

### Authentication API (`auth.ts`)

This API handles all user authentication processes, including sign-up, login, and password management.

#### Response Data Structures

The primary data object returned by several authentication endpoints is the `user` object, which has the following structure:

*   **`IUser`**:
    ```typescript
    interface IUser {
      uuid: UUID;
      created_at: string;
      updated_at: string;
      email: string;
      first_name: string;
      last_name: string;
      is_verified: boolean;
      role?: 'admin' | 'customer';
      avatar?: string;
      organisation_uuid: UUID;
    }
    ```

#### `POST /login`

*   **Purpose**: To authenticate a user with their email and password.
*   **Saga**: `signInSaga`
*   **Trigger**: Dispatched by the `signIn` action from the `SignIn` page component.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/login`
    *   **Body**: A `FormData` object containing the user's `email` and `password`.
    *   **Source of Data**: The email and password are provided by the user through the sign-in form.
*   **Response Handling**:
    *   On success, the response contains a `user` object (conforming to the `IUser` structure) and a `csrf_token`.
    *   The `auth` state in the Redux store is updated with the user information, the `csrf_token`, and the `authorized` status is set to `true` if the user is verified.
*   **Post-Action**: If the user is not yet verified (`user.is_verified` is `false`), the `sendVerificationCodeSaga` is called to initiate the email verification process.

#### `GET /members/me` (Session Loading)

*   **Purpose**: To fetch the profile of the currently authenticated user. This is a crucial part of the session loading process.
*   **Saga**: `getCurrentUserSaga`
*   **Trigger**: Dispatched by the `getCurrentUserAction` from the main application layout (`src/components/Layout/Main/index.tsx`). This happens whenever a page using this layout is loaded.
*   **Request Details**:
    *   **Method**: `GET`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/members/me`
    *   **Authentication**: The request automatically includes the `X-CSRF-Token` via `fetchSaga`.
*   **Response Handling**:
    *   On success, the response body contains the `user` object (conforming to the `IUser` structure).
    *   The `auth` state in the Redux store is updated with this user object.
*   **Usage**: This endpoint is not called by individual pages, but by the main layout. It ensures that the user's data is always available in the application's state for any authenticated page that needs it (like the dashboard, which uses the `organisation_uuid` to fetch other data).

#### `POST /register`

*   **Purpose**: To create a new user account.
*   **Saga**: `signUpSaga`
*   **Trigger**: Dispatched by the `signUpAction` from the `SignUp` page component.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/register`
    *   **Body**: A JSON object containing `first_name`, `last_name`, `email`, `organisation_name`, and `password`.
    *   **Source of Data**: The user provides this information through the sign-up form.
*   **Response Handling**:
    *   On success, the response contains the new `user` object (conforming to the `IUser` structure).
    *   The `auth` state in the Redux store is updated with the new user's information.
*   **Post-Action**: After successful registration, the `sendVerificationCodeSaga` is called to start the email verification process.

#### `POST /send-verification-email`

*   **Purpose**: To send a verification code to a user's email address.
*   **Saga**: `sendVerificationCodeSaga`
*   **Trigger**: This saga is called automatically after a successful sign-up or sign-in if the user is not yet verified. It can also be triggered manually by the `sendVerificationCodeAction`.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/send-verification-email`
*   **Response Handling**:
    *   A successful response indicates that the email has been sent. The application then typically redirects the user to the `VerifyEmail` page.

#### `POST /verify-code`

*   **Purpose**: To verify a user's account using the code sent to their email.
*   **Saga**: `verifyByCodeSaga`
*   **Trigger**: Dispatched by the `verifyByCodeAction` from the `VerifyEmail` page component.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/verify-code`
    *   **Body**: A JSON object containing the `code` provided by the user.
*   **Response Handling**:
    *   On success, the `user` object in the Redux store is updated to mark the user as verified (`is_verified: true`). The `isVerificationInProgress` flag is also updated.
*   **Post-Action**: The user is typically redirected to a `VerificationSuccess` page or to the main dashboard.

#### `POST /accounts/send-reset-email`

*   **Purpose**: To initiate the password reset process by sending a reset link to the user's email.
*   **Saga**: `forgotPasswordSaga`
*   **Trigger**: Dispatched by the `forgotPasswordAction` from the `ForgotPassword` page.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/accounts/send-reset-email?email=${encodeURIComponent(email)}`
    *   **Source of Data**: The user's email is provided through the forgot password form.
*   **Response Handling**:
    *   On success, the `isEmailSent` flag in the `auth` state is set to `true`, and the UI is updated to inform the user that a reset email has been sent.

#### `POST /accounts/reset-password`

*   **Purpose**: To set a new password for the user using a token from the reset email.
*   **Saga**: `resetPasswordSaga`
*   **Trigger**: Dispatched by the `resetPasswordAction` from the `ResetPassword` page.
*   **Request Details**:
    *   **Method**: `POST`
    *   **URL**: `${process.env.REACT_APP_AUTH_API_URL}/accounts/reset-password`
    *   **Body**: A `FormData` object containing the `password` and `token`.
    *   **Source of Data**: The new password is provided by the user, and the token is extracted from the URL of the password reset link.
*   **Response Handling**:
    *   On success, the `isPasswordChanged` flag in the `auth` state is set to `true`.
*   **Post-Action**: The user is typically redirected to the sign-in page to log in with their new password.

### Critical Authentication Details for Next.js Migration

Based on questions from the Next.js development team, here are the crucial authentication implementation details:

#### Token System

**The application uses TWO different authentication mechanisms:**

1. **CSRF Token**: This is the primary authentication token returned by `/login` and used for nearly all API calls
2. **Bearer Token**: This is an environment variable (`REACT_APP_ACCESS_TOKEN`) used only for very specific external API calls (like Google OAuth)

#### `/login` Response Format

The `/login` endpoint returns:

```json
{
  "user": {
    "uuid": "string",
    "created_at": "string",
    "updated_at": "string", 
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "is_verified": boolean,
    "role": "admin" | "customer",
    "avatar": "string (optional)",
    "organisation_uuid": "string"
  },
  "csrf_token": "string"
}
```

#### Authentication Headers

**For nearly all API calls, you only need:**
- `X-CSRF-Token: {csrf_token}` (from login response)
- `credentials: 'include'` (for cookies)

**Bearer tokens are rarely used and only when:**
- An explicit `token` is passed in the API call options (which doesn't happen for standard app functionality)

#### Which Endpoints Require Bearer Token

Based on the code analysis, Bearer tokens are only used when:
1. The API call explicitly passes `{ authorization: true, token: 'some-specific-token' }` options to `fetchSaga`
2. This is NOT used by any of the standard dashboard or application functionality
3. Only used for external services like Google OAuth in `signInByTokenSaga`

#### Headers Implementation

The `fetchAuthSaga` function automatically adds headers as follows:

```typescript
// Always included
headers: {
  'Accept': 'application/json',
  'credentials': 'include'
}

// Added if csrfToken exists and authorization !== false
headers['X-CSRF-Token'] = csrfToken;

// Added if token is provided in options and authorization !== false  
headers['Authorisation'] = `Bearer ${token}`;
```

**Note**: There's a typo in the original code - it uses `'Authorisation'` instead of `'Authorization'` (British vs American spelling).

#### 401 Error Handling

When a 401 error occurs:
1. The app calls `/refresh` to get a new CSRF token
2. If refresh fails, the user is logged out
3. If refresh succeeds, the original request is retried

#### Recommendation for Next.js Team

1. Store the `csrf_token` from `/login` response
2. Include `X-CSRF-Token` header in all authenticated requests  
3. Use `credentials: 'include'` for cookie-based session management
4. Implement 401 error handling with token refresh logic

**You do NOT need any Bearer token or `NEXT_PUBLIC_ACCESS_TOKEN` environment variable for the dashboard or standard app functionality.**

### Customer Dashboard Page

#### Page Functionality

The Customer Dashboard provides a high-level overview of the user's account and character performance. The page should display:

*   **Total Calls**: The total number of calls handled across all characters.
*   **Average Call Duration**: The average duration of the calls.
*   **Remaining Time**: The time remaining on the user's current plan.
*   **Overall Sentiment**: A chart visualizing the breakdown of call sentiments (positive, neutral, negative).
*   **Latest Recordings**: A list of the most recent call recordings.

#### Data Fetching and API Calls

The data for the dashboard is sourced from different parts of the application state and fetched via separate API calls.

##### Remaining Time (`customer.ts`)

*   **API Endpoint**: `GET /organisation/:organisationUuid/current-period`
*   **Purpose**: To fetch the user's current billing period information, which includes the remaining time on their plan.
*   **Saga**: `getCustomerPeriodSaga`
*   **Trigger**: Dispatched by the `getCustomerPeriodAction` in the `CustomerDashboard` component's `useEffect` hook.
*   **Request Details**:
    *   **Method**: `GET`
    *   **URL**: `${process.env.REACT_APP_BILLING_API_URL}/organisation/:organisationUuid/current-period`
    *   **Source of Data**: The `:organisationUuid` is retrieved from the authenticated `user` object in the Redux store.
*   **Response Handling**:
    *   On success, the response contains a `period` object.
    *   This data is stored in the `customer` slice of the Redux store and used to calculate and display the remaining time.
    *   **Response Structure (`IPeriod`)**:
        ```typescript
        interface IPeriod {
          id: number;
          period_start_utc: string;
          period_end_utc: string;
          usage_seconds: number;
          client_id: number;
          package_id: number;
          rMins: number;
          rSecs: number;
          tMins: number;
          tSecs: number;
        }
        ```

##### Other Analytics (`characters.ts`)

The other analytics on the dashboard (Total Calls, Average Call Duration, and Overall Sentiment) are derived from the `stats` object in the `characters` slice of the Redux store. This data is fetched along with the character list when the `/organisations/:organisationUuid/assistant-details` endpoint is called. Please refer to the documentation for the `characters.ts` API for more details.

*   **Data Structure (`ICharactersStats`)**:
    ```typescript
    interface ICharactersStats {
      callsHandled: number;
      callsDuration: number;
      sentimental: {
        positive: number;
        neutral: number;
        negative: number;
      };
    }
    ```

#### Detailed Dashboard Data Mapping

Now that the Next.js team has login working, here's exactly what APIs the dashboard calls and how to map the responses:

##### 1. Dashboard Stats (Total Calls, Average Duration, Sentiment)

**API Call**: `GET /organisations/:organisationUuid/assistant-details`
- **When**: Called automatically when dashboard loads (via characters component)
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistant-details`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "character_performances": [
    {
      "assistant_uuid": "string",
      "assistant_avatar_url": "string", 
      "assistant_name": "string",
      "assistant_purpose": "string",
      "percentPositive": 85,
      "emptyCount": 12,
      "successCount": 145,
      "totalCount": 157
    }
  ],
  "total_successful_calls": 145,
  "call_dur_avg": 180.5,
  "pieChart": {
    "pos": 70,
    "neu": 20, 
    "neg": 10
  }
}
```

**How to Map to Dashboard**:
```typescript
// For the three main stats tiles:
const totalCalls = response.total_successful_calls; // → "Total Calls"
const avgDuration = response.call_dur_avg; // → "Average calls duration" (in seconds)
const remainingTime = ""; // → from separate API call below

// For sentiment chart:
const sentiment = {
  positive: response.pieChart.pos,
  neutral: response.pieChart.neu, 
  negative: response.pieChart.neg
};
```

##### 2. Remaining Time

**API Call**: `GET /organisation/:organisationUuid/current-period`
- **When**: Called on dashboard mount
- **URL**: `${BILLING_API_URL}/organisation/${user.organisation_uuid}/current-period`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "id": 123,
  "period_start_utc": "2024-01-01T00:00:00Z",
  "period_end_utc": "2024-02-01T00:00:00Z", 
  "usage_seconds": 7200,
  "client_id": 456,
  "package_id": 789,
  "rMins": 58,
  "rSecs": 30,
  "tMins": 120,
  "tSecs": 0
}
```

**How to Map to Dashboard**:
```typescript
// Display logic for remaining time
const getRemainingTime = () => {
  const { rMins, rSecs } = response;
  
  if (!rMins && !rSecs) return "0";
  if (rMins && rMins >= 1) return rMins.toLocaleString();
  if (rSecs && rSecs < 10) return `00:0${rSecs}`;
  return `00:${rSecs}`;
};

const getRemainingTimeLabel = () => {
  const { rMins, rSecs } = response;
  
  if (rMins === 1) return "Minute Remaining";
  if (!rMins && rSecs) return "Seconds Remaining";
  return "Minutes Remaining";
};
```

##### 3. Latest Recordings

**API Call**: `GET /organisations/:organisationUuid/transcripts`
- **When**: Called on dashboard mount 
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/transcripts?page=1&size=10`
- **Headers**: `X-CSRF-Token` (Bearer token NOT needed - the `{ authorization: true }` option only adds Bearer header if a specific token is passed, which it isn't)

**Raw API Response Structure**:
```json
{
  "transcripts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "id": "uuid-string",
      "createdAt": "2024-01-15T14:30:00Z",
      "durationSeconds": 180,
      "assistantId": "assistant-uuid",
      "character_name": "Assistant Name",
      "analysis": {
        "sentimentScore": 0.75
      },
      "stereoRecordingUrl": "https://...",
      "messages": [
        {
          "role": "user",
          "message": "Hello"
        },
        {
          "role": "bot", 
          "message": "Hi there!"
        }
      ],
      "summary": "Call summary text"
    }
  ],
  "total": 156
}
```

**How to Map to Dashboard**:
```typescript
// Transform each transcript:
const records = response.transcripts.map(item => ({
  id: item._id,
  uuid: item.id,
  key: item.id,
  date: new Date(item.createdAt),
  duration: item.durationSeconds, // seconds
  handler: {
    id: item.assistantId,
    name: item.character_name
  },
  sentiment: mapSentimentScore(item.analysis.sentimentScore), // "positive"/"neutral"/"negative"
  audio: item.stereoRecordingUrl,
  messages: item.messages.filter(msg => msg.role === 'bot' || msg.role === 'user'),
  summary: item.summary
}));

// Sentiment mapping function:
function mapSentimentScore(score: number): string {
  if (score >= 0.6) return "positive";
  if (score >= 0.4) return "neutral"; 
  return "negative";
}
```

##### API Call Order for Dashboard

1. **On page load**: Call `/organisations/:organisationUuid/assistant-details` to get stats
2. **On page load**: Call `/organisation/:organisationUuid/current-period` to get remaining time
3. **On page load**: Call `/organisations/:organisationUuid/transcripts` to get latest recordings

All three can be called in parallel since they don't depend on each other.

### Character Details/Edit Page

#### Page Access and User Account Relationship

**URL Structure**: `/characters/:characterUuid`
- Characters are accessed via UUID in the URL (e.g., `/characters/abc-123-def`)
- Characters are tied to user accounts through the `organisationUuid` from the authenticated user
- The page requires both the `characterUuid` (from URL params) and `user.organisation_uuid` (from auth state) to fetch data

#### Page Functionality

The Character Details page serves as both a view and edit interface for individual characters. It contains:

**Main Sections:**
- **Content Tab**: Edit first message and system prompt
- **Voice Tab**: Select and preview different voice options  
- **Sentiment Tab**: View sentiment analysis (only appears if character has call data)
- **Recent Calls**: List of latest recordings for this character
- **Try Now Button**: Embedded widget for testing the character

#### Data Fetching APIs

The page makes multiple API calls on load to gather all character information:

##### 1. Character Details

**API Call**: `GET /organisations/:organisationUuid/assistants/:assistantUuid`
- **When**: Called immediately when page loads
- **URL**: `${BILLING_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "activation_id": "string",
  "avatar_url": "string", 
  "booking_url": "string",
  "description": "string",
  "first_message": "Hello! How can I help you today?",
  "is_active": true,
  "locale": "en-US",
  "model_id": 123,
  "name": "Assistant Name",
  "organisation_id": 456,
  "retrieval_augmented_generation_uuid": "uuid-string",
  "system_prompt": "You are a helpful assistant...",
  "uuid": "character-uuid",
  "voice_id": "lcMyyd2HUfFzxdCaC4Ta"
}
```

**How to Map for Display**:
```typescript
// This data populates the edit forms
const characterData = {
  name: response.name,
  firstMessage: response.first_message, // → Content tab form
  systemPrompt: response.system_prompt, // → Content tab form  
  voiceId: response.voice_id, // → Voice tab selection
  activationId: response.activation_id, // → Try Now button & display
  avatarUrl: response.avatar_url,
  isActive: response.is_active
};
```

##### 2. Character Performance Stats

**API Call**: `GET /organisations/:organisationUuid/assistants/:assistantUuid/assistant-details`
- **When**: Called simultaneously with character details
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}/assistant-details`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "assistant_uuid": "character-uuid",
  "assistant_avatar_url": "string",
  "assistant_name": "string", 
  "assistant_purpose": "string",
  "percentPositive": 75,
  "emptyCount": 5,
  "successCount": 95,
  "totalCount": 100,
  "pieChart": {
    "pos": 70,
    "neu": 20,
    "neg": 10
  }
}
```

**How to Map for Display**:
```typescript
// This data is used for the Sentiment tab
const sentimentData = {
  positive: response.pieChart.pos,
  neutral: response.pieChart.neu, 
  negative: response.pieChart.neg
};

// Only show Sentiment tab if total calls > 0
const totalCalls = response.pieChart.pos + response.pieChart.neu + response.pieChart.neg;
const showSentimentTab = totalCalls > 0;
```

##### 3. Available Voices

**API Call**: Static list (no actual API call)
- **Implementation**: Uses local `VOICES_LIST` constant
- **Data Structure**:
```typescript
interface IVoice {
  id: string;
  name: string; 
  gender: string;
  age: string;
  accent: string;
}

// Example voices:
const voices = [
  {
    id: "lcMyyd2HUfFzxdCaC4Ta",
    name: "Sarah", 
    gender: "Female",
    age: "Middle Aged",
    accent: "British"
  },
  // ... more voices
];
```

**Voice Preview**: Audio files are served from `/voices/${voiceId}.mp3` (static files)

##### 4. Character's Recent Calls

**API Call**: `GET /organisations/:organisationUuid/assistants/:assistantUuid/transcripts`
- **When**: Called by the LatestRecordings component
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}/transcripts`
- **Headers**: `X-CSRF-Token` (same as dashboard recordings)

### Character Update/Edit APIs

#### Content Tab Updates (First Message & System Prompt)

**API Call**: `PATCH /organisations/:organisationUuid/assistants/:assistantUuid`
- **Trigger**: When user clicks "Save Character" in Content tab
- **URL**: `${BILLING_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}`
- **Headers**: `X-CSRF-Token` + `Content-Type: application/json`

**Request Body Structure**:
```json
{
  "first_message": "Updated greeting message",
  "system_prompt": "Updated system instructions..."
}
```

**Request Processing**:
```typescript
// The saga cleans the request body:
const requestBody = {
  first_message: formData.first_message || undefined,
  system_prompt: formData.system_prompt || undefined,
  voice_id: formData.voice_id || undefined
};

// Remove undefined values before sending
Object.keys(requestBody).forEach(key => {
  if (requestBody[key] === undefined) {
    delete requestBody[key];
  }
});
```

#### Voice Tab Updates

**API Call**: Same `PATCH /organisations/:organisationUuid/assistants/:assistantUuid`
- **Trigger**: When user clicks "Save Character" in Voice tab
- **Request Body**: Only the voice_id field
```json
{
  "voice_id": "lcMyyd2HUfFzxdCaC4Ta"
}
```

#### Update Response Handling

**Response**: The API returns the updated character object (same structure as GET)
**State Update**: The response data is merged with the existing character data in Redux store

#### API Call Sequence for Character Edit Page

1. **On page load**: 
   - Call character details API
   - Call character stats API  
   - Load voices list (static)
   - Call recent recordings API

2. **On form submit**:
   - Call update API with only changed fields
   - Reload character data to reflect changes

All character data is scoped by the user's `organisation_uuid`, ensuring users can only access and edit characters within their organization.

### Call Recording Details Page

#### Page Access and User Account Relationship

**URL Structure**: `/characters/:characterUuid/records/:recordUuid`
- Call records are accessed via both character UUID and record UUID in the URL
- Records are tied to user accounts through the `organisationUuid` from the authenticated user
- The page requires `characterUuid`, `recordUuid` (from URL params) and `user.organisation_uuid` (from auth state) to fetch data
- Users can only access call records for characters within their organization

#### Page Functionality

The Call Recording Details page displays comprehensive information about a specific phone call. It contains:

**Main Sections:**
- **Call Info Header**: Date, time, audio playback, sentiment, and delete button
- **Collected Data Tab**: Customer information gathered during the call
- **Summary Tab**: AI-generated summary of the call
- **Transcript Tab**: Full conversation between user and assistant
- **Notes Tab**: Manual notes (currently read-only display)

#### Data Fetching API

The page makes one primary API call to get all call record information:

##### Call Record Details

**API Call**: `GET /organisations/:organisationUuid/assistants/:characterUuid/call-details/:recordUuid`
- **When**: Called immediately when page loads
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}/call-details/${recordUuid}`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "id": "record-uuid",
  "datetime": "2024-01-15T14:30:00Z",
  "duration": 180,
  "customer_data": {
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john@example.com",
    "phone_number": "+1234567890",
    "business_name": "Acme Corp",
    "domain_url": "https://acme.com",
    "external_id": "EXT-123"
  },
  "sentiment": "positive",
  "recording_url": "https://storage.vapi.ai/path/to/audio.mp3",
  "transcript": [
    {
      "role": "user",
      "message": "Hello, I need help with my account"
    },
    {
      "role": "bot", 
      "message": "Hi! I'd be happy to help you with your account. Can you tell me your name?"
    }
  ],
  "summary": "Customer called to inquire about account status. Provided contact information and resolved issue successfully."
}
```

**How to Map for Display**:
```typescript
// Header info (RecordInfo component)
const callInfo = {
  id: response.id,
  date: new Date(response.datetime),
  duration: response.duration, // seconds
  sentiment: response.sentiment, // "positive" | "neutral" | "negative"
  audio: response.recording_url
};

// Collected Data Tab
const customerData = response.customer_data; // Display as key-value pairs

// Summary Tab  
const summary = response.summary; // Plain text display

// Transcript Tab
const messages = response.transcript
  .filter(msg => msg.role === 'bot' || msg.role === 'user')
  .map((msg, index) => ({
    id: index,
    role: msg.role, // "user" or "bot"
    content: msg.message
  }));

// Notes Tab
const notes = ""; // Currently always empty, no API field for notes
```

#### Display Components

##### 1. Call Info Header (RecordInfo)
- **Date/Time**: Formatted from `datetime` field
- **Audio Playback**: Uses same AudioWave component as dashboard (direct URL)
- **Sentiment**: Color-coded tag (positive=green, neutral=blue, negative=red)  
- **Delete Button**: Triggers delete confirmation modal

##### 2. Collected Data Tab
- **Data Display**: Shows all key-value pairs from `customer_data` object
- **Field Names**: Automatically formats underscore_case to readable text
- **Empty State**: Shows "No collected data yet" if no customer data

##### 3. Summary Tab
- **Content**: Plain text display of AI-generated call summary
- **Empty State**: Shows "No summary yet" if summary field is empty

##### 4. Transcript Tab  
- **Message List**: Scrollable conversation history
- **Role Styling**: User messages styled differently from bot messages
- **Filtering**: Only shows "user" and "bot" role messages
- **Empty State**: Shows "No transcript yet" if no messages

##### 5. Notes Tab
- **Content**: Plain text display (currently always empty)
- **Empty State**: Shows "No notes yet" 

### Call Record Management APIs

#### Delete Call Record

**API Call**: `DELETE /organisations/:organisationUuid/assistants/:characterId/transcript/:recordId`
- **Trigger**: When user confirms deletion in modal
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistants/${characterUuid}/transcript/${recordUuid}`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)
- **Request Body**: None (DELETE request)

**Response Handling**:
- **Success**: Returns empty response, sets `record: null` in store
- **Effect**: Automatically navigates user back to previous page
- **Error**: Shows error notification

#### API Call Sequence for Call Details Page

1. **On page load**: 
   - Call record details API to get all call information
   - Populate all tabs with returned data

2. **On delete action**:
   - Show confirmation modal
   - If confirmed, call delete API
   - Navigate back to previous page on success

#### Data Flow Summary

```typescript
// URL: /characters/char-123/records/rec-456
const { characterUuid, recordUuid } = useParams(); // "char-123", "rec-456"
const { organisation_uuid } = user; // From auth state

// API Call
GET /organisations/${organisation_uuid}/assistants/${characterUuid}/call-details/${recordUuid}

// Response maps to multiple UI sections:
{
  // → Call Info Header
  datetime, duration, sentiment, recording_url,
  
  // → Collected Data Tab  
  customer_data: { first_name, email, ... },
  
  // → Summary Tab
  summary: "AI generated summary...",
  
  // → Transcript Tab
  transcript: [{ role: "user", message: "..." }, ...]
}
```

All call record data is scoped by the user's `organisation_uuid`, ensuring users can only access call records within their organization and for characters they own. 

### Characters List Page

#### Page Access and User Account Relationship

**URL Structure**: `/characters`
- Characters are tied to user accounts through the `organisationUuid` from the authenticated user
- The page requires `user.organisation_uuid` (from auth state) to fetch data
- Users can only see and manage characters within their organization
- Page includes pagination (4 characters per page)

#### Page Functionality

The Characters List page serves as the main hub for managing all characters. It contains:

**Main Features:**
- **Character Grid**: Displays characters in a 4-column responsive grid
- **+ New Character Button**: Opens character creation modal (if allowed)
- **Character Tiles**: Each shows avatar, name, purpose, and performance stats
- **Manage Button**: Links to individual character details/edit page
- **Pagination**: Navigate through multiple pages of characters
- **Auto-redirect**: If no characters exist, automatically redirects to `/characters/create`

#### Data Fetching APIs

The page makes two API calls to determine what to display:

##### 1. Characters List

**API Call**: `GET /organisations/:organisationUuid/assistant-details`
- **When**: Called on page load and when pagination changes
- **URL**: `${TRANSCRIPTS_API_URL}/organisations/${user.organisation_uuid}/assistant-details?page=${page}&size=4`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "character_performances": [
    {
      "assistant_uuid": "char-uuid-123",
      "assistant_avatar_url": "https://storage.example.com/avatar.png",
      "assistant_name": "Sarah",
      "assistant_purpose": "Customer support assistant",
      "percentPositive": 85,
      "emptyCount": 12,
      "successCount": 145,
      "totalCount": 157
    }
  ],
  "total_successful_calls": 145,
  "call_dur_avg": 180.5,
  "pieChart": {
    "pos": 70,
    "neu": 20,
    "neg": 10
  },
  "length": 3
}
```

**How to Map for Display**:
```typescript
// Transform each character for the grid
const characters = response.character_performances.map(character => ({
  uuid: character.assistant_uuid,
  key: character.assistant_uuid,
  image: character.assistant_avatar_url,
  name: character.assistant_name,
  purpose: character.assistant_purpose,
  isActive: true, // Always true in current implementation
  rating: character.percentPositive, // % positive sentiment
  emptyCount: character.emptyCount,
  successCount: character.successCount,
  totalCount: character.totalCount
}));

const total = response.length; // For pagination
```

##### 2. Character Creation Permission Check

**API Call**: `GET /organisation/:organisationUuid/can-create-assistant`
- **When**: Called on page load to determine if "New Character" button should work
- **URL**: `${BILLING_API_URL}/organisation/${user.organisation_uuid}/can-create-assistant`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Response**: Boolean value indicating if user can create more characters
```json
true
```

**Usage**: 
- If `true`: Clicking "New Character" opens creation modal
- If `false`: Clicking "New Character" shows limits reached modal

### Character Creation Process

#### Character Creation Modal

The creation process involves a modal with the following form fields:

**Required Fields:**
- **Avatar Image**: PNG file upload (max 2MB, auto-cropped to circular)
- **Name**: Character name (text input with validation)
- **Voice**: Selection from available voices with preview

#### Character Creation API

**API Call**: `POST /organisations/:organisationUuid/assistants/create_assistant`
- **Trigger**: When user fills form and clicks save in creation modal
- **URL**: `${BILLING_API_URL}/organisations/${organisationUuid}/assistants/create_assistant`
- **Headers**: `X-CSRF-Token` + `Content-Type: application/json`

**Request Body Structure**:
```json
{
  "organisation_uuid": "user-org-uuid",
  "name": "Sarah",
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "elevenlabs_voice_id": "lcMyyd2HUfFzxdCaC4Ta"
}
```

**Request Processing**:
```typescript
// Form data from creation modal
const formData = {
  name: "Sarah",
  image_data: "base64-encoded-image", // From file upload
  elevenlabs_voice_id: "lcMyyd2HUfFzxdCaC4Ta" // From voice selection
};

// API request body
const requestBody = {
  organisation_uuid: user.organisation_uuid,
  name: formData.name,
  image_data: formData.image_data,
  elevenlabs_voice_id: formData.elevenlabs_voice_id
};

// Auto-generate default image if none provided
if (!requestBody.image_data) {
  const voice = VOICES_LIST.find(v => v.id === requestBody.elevenlabs_voice_id);
  if (voice) {
    requestBody.image_data = await getDefaultImage(`/default_${voice.gender.toLowerCase()}.png`);
  }
}
```

#### Image Processing

**Image Upload Requirements**:
- **File Type**: PNG only
- **Size Limit**: 2MB maximum
- **Processing**: Auto-compressed and cropped to 500x500px circular format
- **Output**: Base64 encoded string in `data:image/png;base64,` format

**Default Images**: If no image uploaded, uses gender-based defaults:
- `/default_female.png` for female voices
- `/default_male.png` for male voices

#### Voice Selection

**Voice Options**: Uses static `VOICES_LIST` with structure:
```typescript
interface IVoice {
  id: string;           // "lcMyyd2HUfFzxdCaC4Ta"
  name: string;         // "Sarah"
  gender: string;       // "Female"
  age: string;          // "Middle Aged"
  accent: string;       // "British"
}
```

**Voice Preview**: Audio samples available at `/voices/${voiceId}.mp3`

#### Creation Flow

1. **User clicks "+ New Character"**
2. **Check creation permission** (can-create-assistant API)
3. **If allowed**: Show creation modal
4. **If blocked**: Show limits reached modal
5. **User fills form** (name, image, voice)
6. **Form validation** (name required, voice required)
7. **Image processing** (compress, crop, convert to base64)
8. **API call** to create character
9. **On success**: 
   - Close creation modal
   - Show success modal
   - Refresh characters list
   - Reset pagination to page 1

#### Character Display Format

Each character tile shows:
- **Avatar**: Circular image (100px diameter)
- **Name**: Character name
- **Purpose**: Character description/purpose
- **Performance Stats**:
  - Empty Calls count
  - Calls Handled count  
  - Total Calls count
  - % Positive sentiment (color-coded: green ≥90%, blue 50-89%, red <50%)
- **Manage Button**: Links to `/characters/${uuid}` for editing

#### API Call Sequence for Characters Page

1. **On page load**:
   - Call creation permission check API
   - Call characters list API for current page

2. **On pagination change**:
   - Call characters list API for new page

3. **On character creation**:
   - Validate form data
   - Process image upload
   - Call character creation API
   - Refresh characters list on success

4. **Navigation**:
   - Click "Manage" → `/characters/${characterUuid}`
   - Auto-redirect if no characters → `/characters/create`

All character data is scoped by `organisation_uuid`, ensuring users only see and can create characters within their organization. 

### Billing and Payment System

#### Page Access and User Account Relationship

**URL Structure**: `/payment` (Plans page) and `/payment/confirmation` (Post-payment confirmation)
- Billing is tied to user accounts through the `organisationUuid` from the authenticated user
- Payment status affects user authorization and feature access
- Stripe integration handles all payment processing

#### Billing Page Functionality

The billing system consists of multiple components handling different aspects of payment:

**Main Features:**
- **Plans Display**: Shows available subscription plans with features and pricing
- **Stripe Checkout**: Generates secure payment links through Stripe
- **Payment Confirmation**: Handles post-payment user experience
- **Invoice Management**: Displays billing history and downloadable invoices
- **Usage Tracking**: Monitors remaining minutes/credits on current plan

#### Billing Data Fetching APIs

The billing system uses several APIs to manage subscriptions and payments:

##### 1. Available Plans

**API Call**: Static data (no actual API call)
- **Implementation**: Uses local `PLANS` constant from `src/store/constants.ts`
- **When**: Called when payment page loads

**Plan Data Structure**:
```typescript
interface IPlan {
  id: UUID;                    // "8d2dccd5-58b0-4a39-b50f-412a21de6d89"
  name: string;               // "Lite", "Standard", "Professional"
  description: string;        // Plan description
  currency: string;           // "gbp"
  price: number;             // 50, 400, 1650 (in pounds)
  period: string;            // "month"
  features: IPlanFeature[];  // List of features with enabled/disabled status
  isActive?: boolean;        // Marks the "Most Popular" plan
}

interface IPlanFeature {
  label: string;             // "200 Neural Voice minutes"
  isEnabled: boolean;        // true/false for this plan
}
```

**Example Plans Structure**:
```json
[
  {
    "id": "8d2dccd5-58b0-4a39-b50f-412a21de6d89",
    "name": "Lite",
    "description": "Basic AI voice features ideal for startup web and phone use",
    "price": 50,
    "currency": "gbp",
    "period": "month",
    "features": [
      {
        "label": "200 Neural Voice minutes",
        "isEnabled": true
      },
      {
        "label": "CRM integration", 
        "isEnabled": false
      }
    ]
  },
  {
    "id": "cda5e9a0-4858-4c74-b942-1affee0871a7",
    "name": "Standard",
    "price": 400,
    "features": [
      {
        "label": "1,000 Neural Voice minutes",
        "isEnabled": true
      }
    ]
  },
  {
    "id": "8255dd54-314b-400a-ba9f-6ce00e5ea2ed", 
    "name": "Professional",
    "price": 1650,
    "features": [
      {
        "label": "5,000 Neural Voice minutes",
        "isEnabled": true
      }
    ]
  }
]
```

##### 2. Stripe Payment Link Generation

**API Call**: `POST /organisation/:organisationUuid/subscribe/package/:packageUuid/generate-checkout`
- **When**: Called when user clicks "Purchase" button on any plan
- **URL**: `${BILLING_API_URL}/organisation/${user.organisation_uuid}/subscribe/package/${planId}/generate-checkout`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Request Details**:
- **Method**: `POST`
- **Body**: Empty (plan selection is in URL path)
- **Response**: Stripe checkout URL string

**Payment Flow**:
```typescript
// User clicks "Purchase" on a plan
const handlePurchase = (planId: string) => {
  // 1. Call payment link API
  getPaymentLink({ 
    organisationUuid: user.organisation_uuid, 
    packageUuid: planId 
  });
};

// 2. API returns Stripe checkout URL
// Response: "https://checkout.stripe.com/pay/cs_test_123..."

// 3. Automatically redirect to Stripe
window.open(paymentLink, '_self', 'noreferrer');
```

##### 3. Current Billing Period (Usage Tracking)

**API Call**: `GET /organisation/:organisationUuid/current-period`
- **When**: Called on dashboard load to show remaining minutes
- **URL**: `${BILLING_API_URL}/organisation/${user.organisation_uuid}/current-period`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Response Structure** (already documented in dashboard section):
```json
{
  "id": 123,
  "period_start_utc": "2024-01-01T00:00:00Z",
  "period_end_utc": "2024-02-01T00:00:00Z",
  "usage_seconds": 7200,
  "client_id": 456,
  "package_id": 789,
  "rMins": 58,        // Remaining minutes
  "rSecs": 30,        // Remaining seconds
  "tMins": 120,       // Total minutes in plan
  "tSecs": 0
}
```

### Invoice Management System

#### Invoice History API

**API Call**: `GET https://api.stripe.com/v1/invoices`
- **When**: Called when viewing billing history
- **URL**: `https://api.stripe.com/v1/invoices?expand[0]=total_count&${params}`
- **Headers**: Uses Stripe secret key from `REACT_APP_STRIPE_SECRET_ID` environment variable

**Request Parameters**:
```typescript
interface IGetInvoicesParams {
  limit?: number;              // Page size (default: pageSize from config)
  starting_after?: string;     // For pagination (invoice ID)
  ending_before?: string;      // For pagination (invoice ID)
}
```

**Stripe Invoice Response Structure**:
```json
{
  "data": [
    {
      "id": "in_1234567890",
      "total": 5000,                    // Amount in pence (£50.00)
      "currency": "gbp",
      "status": "paid",                 // "paid" | "draft" | "open"
      "number": "INV-001",
      "customer_email": "user@example.com",
      "expires_at": 1640995200,         // Unix timestamp
      "created": 1640908800,            // Unix timestamp
      "hosted_invoice_url": "https://invoice.stripe.com/i/...",
      "invoice_pdf": "https://pay.stripe.com/invoice/.../pdf"
    }
  ],
  "total_count": 25
}
```

**Invoice Display Mapping**:
```typescript
// Transform Stripe data for display
const invoiceData = response.data.map(invoice => ({
  id: invoice.id,
  amount: `£${invoice.total / 100}`,          // Convert pence to pounds
  currency: invoice.currency.toUpperCase(),
  status: invoice.status,                     // Color-coded tags
  number: invoice.number,                     // Clickable link to Stripe
  customerEmail: invoice.customer_email,
  dueDate: moment(invoice.expires_at * 1000).format('DD MMM'),
  createdDate: moment(invoice.created * 1000).format('DD MMM, HH:MM'),
  hostedUrl: invoice.hosted_invoice_url,      // External Stripe invoice
  pdfUrl: invoice.invoice_pdf                 // Direct PDF download
}));
```

### Payment Status and Authorization

#### User Authorization Logic

The application determines user access based on payment status through several mechanisms:

1. **Session-based Authorization**: The `authorized` flag in auth state
2. **Current Period Check**: Valid billing period with remaining usage
3. **Feature Gating**: Some features may be restricted based on plan level

#### Post-Payment Confirmation

**URL**: `/payment/confirmation`
- **Purpose**: Shown after successful Stripe payment
- **Functionality**: Confirms payment success and updates user authorization
- **Automatic Actions**: 
  - Calls `checkIsUserPaid()` to refresh authorization status
  - Displays success message
  - Provides "Back Home" navigation

### Stripe Integration Details

#### Payment Processing Flow

1. **Plan Selection**: User views plans on `/payment` page
2. **Purchase Click**: Triggers payment link generation API
3. **Stripe Redirect**: User redirected to Stripe Checkout
4. **Payment Processing**: Handled entirely by Stripe
5. **Return Redirect**: Stripe redirects to `/payment/confirmation`
6. **Authorization Update**: App refreshes user payment status
7. **Access Granted**: User can now access paid features

#### Environment Variables Required

- `REACT_APP_BILLING_API_URL`: Your billing API base URL
- `REACT_APP_STRIPE_SECRET_ID`: Stripe secret key for invoice API access

#### Security Considerations

- **Payment Processing**: All handled by Stripe (PCI compliant)
- **API Security**: Uses CSRF tokens for billing API calls
- **Invoice Access**: Direct Stripe API access with secret key
- **No Stored Payment Data**: No credit card info stored in your system

### API Call Sequence for Billing

1. **Plans Page Load**:
   - Load static plans data
   - Display available subscription options

2. **Purchase Flow**:
   - User selects plan
   - Generate Stripe checkout link
   - Redirect to Stripe payment page
   - User completes payment on Stripe
   - Redirect back to confirmation page
   - Update user authorization status

3. **Usage Monitoring**:
   - Dashboard loads current period data
   - Display remaining minutes/usage
   - Track consumption against plan limits

4. **Invoice Management**:
   - Load invoice history from Stripe API
   - Display paginated invoice list
   - Provide PDF downloads and external links

All billing data is scoped by `organisation_uuid`, ensuring proper data isolation between different customer organizations. 

### Account Settings Page

#### Page Access and User Account Relationship

**URL Structure**: `/account-settings`
- Account settings are tied to user accounts through the `organisationUuid` from the authenticated user
- The page requires `user.organisation_uuid` (from auth state) to manage domains
- Users can only manage domains and scripts within their organization
- Page consists of two main sections: Domain Setup and Embed Script

#### Page Functionality

The Account Settings page provides essential configuration for integrating characters into websites:

**Main Features:**
- **Domain Registration**: Add and manage authorized domains for script usage
- **Domain Management**: View, add, and delete registered domains
- **Embed Script**: Generate and copy integration script for websites
- **Domain Validation**: Ensures script only works on registered domains

#### Data Fetching APIs

The account settings page uses several APIs for domain management:

##### 1. Get Registered Domains

**API Call**: `GET /domains/get_domains`
- **When**: Called on page load to display existing domains
- **URL**: `${BILLING_API_URL}/domains/get_domains?organisation_uuid=${user.organisation_uuid}`
- **Headers**: `X-CSRF-Token` (no Bearer token needed)

**Raw API Response Structure**:
```json
{
  "domains": [
    {
      "uuid": "domain-uuid-123",
      "domain": "app.neural-voice.ai",
      "comments": "Production domain",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "uuid": "domain-uuid-456", 
      "domain": "www.example.com",
      "comments": "",
      "created_at": "2024-01-10T14:20:00Z",
      "updated_at": "2024-01-10T14:20:00Z"
    }
  ]
}
```

**Domain Data Structure**:
```typescript
interface IDomain {
  uuid: UUID;           // Unique identifier for deletion
  domain: string;       // Domain name without protocol
  comments: string;     // Optional description
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
}
```

##### 2. Add Domain

**API Call**: `POST /domains/add_domain`
- **When**: Called when user adds a new domain via input field
- **URL**: `${BILLING_API_URL}/domains/add_domain`
- **Headers**: `X-CSRF-Token` + `Content-Type: application/json`

**Request Body Structure**:
```json
{
  "organisationUuid": "user-org-uuid",
  "domain": "app.neural-voice.ai"
}
```

**Response Structure**:
```json
{
  "message": "Domain added successfully"
}
```

**Add Domain Flow**:
```typescript
// User types domain and clicks add button
const handleAddDomain = (domainName: string) => {
  // 1. Validate form input
  if (!domainName || !user.organisation_uuid) return;
  
  // 2. Call add domain API
  addDomain({ 
    organisationUuid: user.organisation_uuid, 
    domain: domainName 
  });
  
  // 3. Clear input field
  form.resetFields();
  
  // 4. Show success notification
  // 5. Refresh domains list automatically
};
```

##### 3. Delete Domain

**API Call**: `POST /domains/remove_domain`
- **When**: Called when user clicks delete button on a domain
- **URL**: `${BILLING_API_URL}/domains/remove_domain`
- **Headers**: `X-CSRF-Token` + `Content-Type: application/json`

**Request Body Structure**:
```json
{
  "organisationUuid": "user-org-uuid",
  "domainUuid": "domain-uuid-123"
}
```

**Delete Domain Flow**:
```typescript
// User clicks delete button on domain
const handleDeleteDomain = (domainUuid: string) => {
  // 1. Call delete domain API
  deleteDomain({ 
    organisationUuid: user.organisation_uuid, 
    domainUuid: domainUuid 
  });
  
  // 2. Show loading state
  // 3. Refresh domains list automatically after deletion
  // 4. Remove domain from UI
};
```

### Embed Script Functionality

#### Script Generation

The embed script section provides the integration code for websites:

**Script Template**:
```html
<script src="${REACT_APP_NV_SCRIPT_URL}"></script>
```

**Environment Variable Required**:
- `REACT_APP_NV_SCRIPT_URL`: URL to the Neural Voice script file

#### Script Features

**Copy to Clipboard**:
- One-click copying of the embed script
- Automatic notification when copied
- Warning if no domains are registered

**Domain Validation**:
- Script only functions on registered domains
- Prevents unauthorized usage of characters
- Security through domain whitelist

**Integration Instructions**:
- Clear guidance on script placement
- Recommendation to place before closing `</body>` tag
- Domain format examples provided

### Domain Management UI

#### Domain Registration Form

**Input Field Features**:
- Text input for domain name entry
- Add button integrated into input field (suffix)
- Real-time validation on form submission
- Clear format instructions and examples

**Domain Format Requirements**:
- Exclude protocol (no `https://`)
- Include subdomains (e.g., `www.`, `app.`)
- Example format: `app.neural-voice.ai`

#### Domain List Display

**Domain List Features**:
- Displays all registered domains in a vertical list
- Each domain shows the domain name
- Delete button for each domain (X icon)
- Responsive layout with proper spacing

**Domain List Item Structure**:
```typescript
// Each domain row displays:
{
  domain: "app.neural-voice.ai",     // Domain name
  uuid: "domain-uuid-123",           // For deletion
  actions: ["delete"]                // Available actions
}
```

#### User Experience Flow

1. **Page Load**:
   - Fetch existing domains for organization
   - Display domain list if any exist
   - Show embed script with copy functionality

2. **Add Domain**:
   - User enters domain in input field
   - Click add button or press enter
   - Domain gets validated and added
   - Success notification shown
   - Domain list refreshes automatically
   - Input field clears

3. **Delete Domain**:
   - User clicks delete (X) button on domain
   - Domain gets removed via API
   - Domain list refreshes automatically
   - Domain disappears from UI

4. **Copy Script**:
   - User clicks "Copy Code" button
   - Script copied to clipboard
   - Success notification shown
   - Warning if no domains registered

### API Call Sequence for Account Settings

1. **Page Load**:
   - Call `getDomains()` to fetch existing domains
   - Display domain list and embed script

2. **Domain Management**:
   - Add domain: `addDomain()` → refresh domains list
   - Delete domain: `deleteDomain()` → refresh domains list
   - Both operations automatically refresh the list

3. **Script Integration**:
   - Generate script from environment variable
   - Copy to clipboard with user feedback
   - Validate domain registration status

### Security and Validation

**Domain Security**:
- All domains scoped by `organisation_uuid`
- Users can only manage their organization's domains
- Script only works on registered domains

**Input Validation**:
- Domain format validation on client side
- Server-side validation for domain uniqueness
- Proper error handling and user feedback

**API Security**:
- CSRF token protection for all domain operations
- Organization-scoped access control
- Secure domain whitelist management

All account settings data is scoped by `organisation_uuid`, ensuring users can only manage domains and scripts within their organization. 

## Complete API Reference

This section provides a comprehensive reference of all API endpoints used in the application, including request/response formats, headers, and data structures.

### Environment Variables

The application uses three main API services:

- `REACT_APP_AUTH_API_URL`: Authentication service
- `REACT_APP_BILLING_API_URL`: Billing and organization management
- `REACT_APP_TRANSCRIPTS_API_URL`: Call recordings and analytics

### Authentication Headers

All API requests use consistent authentication:

**Standard Headers:**
- `X-CSRF-Token`: CSRF token from login response (required for all requests)
- `Content-Type: application/json` (for POST/PUT requests)

**Special Cases:**
- **Stripe Invoice API**: Uses `Authorization: Bearer ${STRIPE_SECRET_KEY}` instead of CSRF
- **Dashboard Recordings**: May optionally include `Authorization: Bearer ${ACCESS_TOKEN}` from environment

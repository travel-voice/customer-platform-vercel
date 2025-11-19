# Vapi Structured Data Extraction - Implementation Guide

## Overview

This implementation enables automatic extraction of structured data from voice calls using Vapi's structured output feature. When a user selects data variables to extract on the agent's "Data Extraction" tab, the system:

1. Saves the configuration to the database
2. Creates/updates a Vapi Structured Output resource
3. Links it to the Vapi Assistant
4. Receives extracted data in the webhook after each call

## Architecture

### Database Schema

**Table: `agents`**
- `data_extraction_config` (JSONB): Stores the selected datapoints with their descriptions and types
- `vapi_structured_output_id` (TEXT): Stores the Vapi Structured Output resource ID

**Table: `calls`**
- `extracted_data` (JSONB): Stores all call data including the `structuredData` field

### Flow Diagram

```
User selects datapoints in UI
         ↓
Frontend calls PATCH /api/agents/[agentId]
         ↓
API saves data_extraction_config to DB
         ↓
API builds JSON Schema from config
         ↓
API creates/updates Vapi Structured Output
         ↓
API links Structured Output to Vapi Assistant via artifactPlan
         ↓
[Call happens]
         ↓
Vapi sends end-of-call-report webhook
         ↓
Webhook extracts message.artifact.structuredData[0]
         ↓
Webhook saves to calls.extracted_data.structuredData
```

## Setup Instructions

### 1. Run Database Migration

Execute the SQL migration to add the new column:

```bash
# Option A: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/006_add_structured_output_id.sql
# 3. Execute

# Option B: Via Supabase CLI
supabase db push
```

The migration adds:
```sql
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS vapi_structured_output_id TEXT;
```

### 2. Environment Variables

Ensure you have the Vapi API key set:

```env
VAPI_PRIVATE_KEY=your_vapi_private_key_here
```

### 3. Test the Flow

1. **Select Data Extraction Variables:**
   - Navigate to an agent's details page
   - Go to the "Data" tab
   - Select datapoints you want to extract (e.g., customer.email, customer.phone)
   - Click "Save Selection"

2. **Verify Backend Processing:**
   Check console logs for:
   ```
   Created Vapi structured output: <id>
   Linked structured output to assistant
   ```

3. **Make a Test Call:**
   - Use the agent to make a test call
   - Ensure the conversation includes the information you want to extract

4. **Check Webhook:**
   After the call ends, check logs for:
   ```
   Structured data extracted: Yes
   Structured data keys: [...]
   ```

5. **Verify Database:**
   Check the `calls` table - the `extracted_data` JSONB should contain:
   ```json
   {
     "structuredData": {
       "customer.email": "user@example.com",
       "customer.phone": "+1234567890",
       ...
     },
     ...
   }
   ```

## How It Works

### 1. Data Extraction Configuration

When a user selects datapoints, the frontend sends:

```json
{
  "data_extraction_config": {
    "customer.email": {
      "description": "The customer's email address for communication and booking confirmations",
      "type": "string"
    },
    "customer.phone": {
      "description": "The customer's primary contact phone number",
      "type": "string"
    }
  }
}
```

### 2. JSON Schema Generation

The backend converts this to a Vapi-compatible JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "customer.email": {
      "type": "string",
      "description": "The customer's email address for communication and booking confirmations"
    },
    "customer.phone": {
      "type": "string",
      "description": "The customer's primary contact phone number"
    }
  },
  "required": [],
  "description": "Extracted data from the call conversation"
}
```

### 3. Vapi API Calls

**Creating Structured Output:**
```typescript
POST https://api.vapi.ai/structured-output
{
  "name": "Agent Name - Data Extraction",
  "schema": { /* JSON Schema */ }
}
// Response: { id: "structured-output-id", ... }
```

**Linking to Assistant:**
```typescript
PATCH https://api.vapi.ai/assistant/{assistantId}
{
  "artifactPlan": {
    "structuredOutputIds": ["structured-output-id"]
  }
}
```

### 4. Webhook Response

After a call, Vapi sends:

```json
{
  "message": {
    "type": "end-of-call-report",
    "artifact": {
      "structuredData": [
        {
          "customer.email": "john@example.com",
          "customer.phone": "+1234567890"
        }
      ]
    }
  }
}
```

The webhook extracts `message.artifact.structuredData[0]` and saves it.

## Important Notes

### Field Requirements
- All fields are currently **optional** to avoid extraction failures
- If a field isn't mentioned in the call, it won't be in the output
- You can modify `buildStructuredOutputSchema()` to mark specific fields as required

### Schema Updates
- When a user changes their data extraction selection:
  - If they had a previous selection: Updates the existing structured output
  - If it's their first selection: Creates a new structured output
  - If they clear all selections: Unlinks the structured output from the assistant

### Each Agent Has Its Own Schema
- Each agent can have different datapoints
- The schema is unique per agent
- Changing one agent's schema doesn't affect others

### Data Types Supported
- `string`: Text data (emails, names, addresses)
- `number`: Decimal numbers (prices, ratings)
- `integer`: Whole numbers (ages, counts)
- `boolean`: True/false values (preferences, flags)

## Displaying Structured Data in UI

To display the extracted data in the call review page:

```typescript
// In your call details component
const structuredData = call.extracted_data?.structuredData;

if (structuredData) {
  // Display the extracted fields
  Object.entries(structuredData).forEach(([key, value]) => {
    const datapoint = TRAVEL_DATAPOINTS.find(dp => dp.id === key);
    console.log(`${datapoint?.label}: ${value}`);
  });
}
```

## Troubleshooting

### Structured Data Not Appearing

1. **Check Console Logs:**
   - API should log "Created/Updated Vapi structured output"
   - Webhook should log "Structured data extracted: Yes"

2. **Verify Vapi Assistant:**
   - Get the assistant via Vapi API
   - Check if `artifactPlan.structuredOutputIds` contains your ID

3. **Check Database:**
   - Verify `agents.vapi_structured_output_id` is set
   - Verify `agents.data_extraction_config` has your datapoints

4. **Test Call Content:**
   - Ensure the call conversation actually mentions the information
   - The AI can only extract what's discussed in the call

### Common Issues

**"Structured output update error"**
- Check your `VAPI_PRIVATE_KEY` is correct
- Verify the assistant exists in Vapi
- Check Vapi API rate limits

**Empty structuredData**
- The conversation might not have mentioned the fields
- Check if the descriptions are clear enough for the AI
- Try making required fields more prominent in the system prompt

## API Reference

### PATCH /api/agents/[agentId]

**Request Body:**
```typescript
{
  data_extraction_config?: Record<string, {
    description: string;
    type: 'string' | 'number' | 'integer' | 'boolean';
  }>;
  // ... other agent fields
}
```

**Process:**
1. Validates agent ownership
2. Builds JSON Schema from config
3. Creates/updates Vapi Structured Output
4. Links to Vapi Assistant
5. Updates database

### POST /api/vapi/webhook

**Vapi Payload:**
```typescript
{
  message: {
    type: 'end-of-call-report';
    artifact: {
      structuredData: Array<Record<string, any>>;
      // ... other fields
    };
    // ... other fields
  };
}
```

**Extraction:**
- Retrieves `message.artifact.structuredData[0]`
- Stores in `calls.extracted_data.structuredData`

## Future Enhancements

- [ ] Add ability to mark fields as required
- [ ] Add validation rules for extracted data
- [ ] Show extraction confidence scores
- [ ] Allow custom data types and formats
- [ ] Add data extraction analytics
- [ ] Export extracted data to CSV/Excel
- [ ] Integration with CRM systems

## Files Modified

1. `supabase/migrations/006_add_structured_output_id.sql` - Database migration
2. `lib/vapi/client.ts` - Added Vapi Structured Output API methods
3. `app/api/agents/[agentId]/route.ts` - Handles schema creation/updates
4. `app/api/vapi/webhook/route.ts` - Extracts structured data from webhook

## References

- [Vapi Structured Outputs Documentation](https://docs.vapi.ai/assistants/structured-outputs)
- [JSON Schema Specification](https://json-schema.org/)


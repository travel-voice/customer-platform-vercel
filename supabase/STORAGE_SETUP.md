# Setting Up Storage Bucket for Knowledge Base

Since storage bucket creation and policies require elevated permissions that are not available in migrations, follow these steps in the Supabase Dashboard:

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** > **Storage**
2. Click **New bucket**
3. Configure:
   - **Name**: `agent_knowledge_base`
   - **Public bucket**: ❌ (keep it **private**)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty (we validate in the API)
4. Click **Create bucket**

## Step 2: Add Storage Policies

Navigate to **Storage** > **Policies** for the `agent_knowledge_base` bucket and add the following three policies:

### Policy 1: Upload Files
- **Policy name**: `Users can upload knowledge base files`
- **Policy command**: `INSERT`
- **Target roles**: `authenticated`
- **WITH CHECK** expression:
```sql
bucket_id = 'agent_knowledge_base' AND
(storage.foldername(name))[1] IN (
  SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  )
)
```

### Policy 2: View Files
- **Policy name**: `Users can view knowledge base files`
- **Policy command**: `SELECT`
- **Target roles**: `authenticated`
- **USING** expression:
```sql
bucket_id = 'agent_knowledge_base' AND
(storage.foldername(name))[1] IN (
  SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  )
)
```

### Policy 3: Delete Files
- **Policy name**: `Users can delete knowledge base files`
- **Policy command**: `DELETE`
- **Target roles**: `authenticated`
- **USING** expression:
```sql
bucket_id = 'agent_knowledge_base' AND
(storage.foldername(name))[1] IN (
  SELECT uuid::text FROM public.agents WHERE organization_uuid IN (
    SELECT organization_uuid FROM public.users WHERE uuid = auth.uid()
  )
)
```

## What This Does

These policies ensure that:
- Users can only upload files to folders corresponding to their own agents
- Users can only view files for agents in their organization
- Users can only delete files they have access to
- All files are stored in a private, non-public bucket

Once these are set up, the Knowledge Base feature will be fully functional!


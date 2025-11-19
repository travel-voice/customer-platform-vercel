-- Create storage bucket for agent images
insert into storage.buckets (id, name, public)
values ('agent-images', 'agent-images', true)
on conflict (id) do nothing;

-- Set up access policies for the agent-images bucket

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

-- Create policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'agent-images' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'agent-images' and auth.role() = 'authenticated' );

create policy "Users can update their own images"
  on storage.objects for update
  using ( bucket_id = 'agent-images' and auth.uid() = owner );

create policy "Users can delete their own images"
  on storage.objects for delete
  using ( bucket_id = 'agent-images' and auth.uid() = owner );

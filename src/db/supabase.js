import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ixpbxnzjfjopgiljibqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGJ4bnpqZmpvcGdpbGppYnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mjc5NzksImV4cCI6MjEwMTAwMzk3OX0.SM2IDTV8rN-DWuK5FLXllSrVKaYjLcv3HbUOlbQGTo0'
);

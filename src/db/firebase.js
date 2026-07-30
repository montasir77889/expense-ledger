import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ixpbxnzjfjopgiljibqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cGJ4bnpqZmpvcGdpbGppYnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mjc5NzksImV4cCI6MjEwMTAwMzk3OX0.SM2IDTV8rN-DWuK5FLXllSrVKaYjLcv3HbUOlbQGTo0'
);

export async function loadMonthData(monthKey) {
  const { data } = await supabase.from('month_data').select('data').eq('month_key', monthKey).maybeSingle();
  return data?.data || null;
}

export async function saveMonthData(monthKey, monthData) {
  const { data: existing } = await supabase.from('month_data').select('id').eq('month_key', monthKey).maybeSingle();
  if (existing) {
    await supabase.from('month_data').update({ data: monthData }).eq('id', existing.id);
  } else {
    await supabase.from('month_data').insert({ month_key: monthKey, data: monthData });
  }
}

export async function loadMembers() {
  const { data } = await supabase.from('members').select('name').order('id');
  return (data || []).map(r => r.name);
}

export async function saveMembers(members) {
  await supabase.from('members').delete().neq('id', 0);
  if (members.length) {
    await supabase.from('members').insert(members.map(name => ({ name })));
  }
}

export async function loadMonthsList() {
  const { data } = await supabase.from('month_list').select('month_key').order('id');
  return (data || []).map(r => r.month_key);
}

export async function saveMonthsList(list) {
  await supabase.from('month_list').delete().neq('id', 0);
  if (list.length) {
    await supabase.from('month_list').insert(list.map(month_key => ({ month_key })));
  }
}

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://mheitahxwxydnjwbwxkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZWl0YWh4d3h5ZG5qd2J3eGtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQxMzIzNCwiZXhwIjoyMDc4OTg5MjM0fQ.Ig71IV6KAkblClXwpfh5xF4_mLCaKGwKXhy7Suwiex4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
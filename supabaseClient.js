import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://mheitahxwxydnjwbwxkf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZWl0YWh4d3h5ZG5qd2J3eGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MTMyMzQsImV4cCI6MjA3ODk4OTIzNH0.2RPgt9BNADu7qZw7LfUZjPZ0r8qaRC40dhVm7D5maGI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;
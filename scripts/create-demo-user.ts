/**
 * Script to create a demo volunteer user with confirmed email
 * Run this once to set up the demo account
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Replace with your service role key (NOT anon key)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createDemoUser() {
  try {
    console.log('Creating demo volunteer user...');
    
    // Create user with admin API (bypasses email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'volunteer@demo.com',
      password: 'Shiva@2208',
      email_confirm: true, // Mark email as confirmed
      user_metadata: {
        name: 'Demo Volunteer',
        role: 'volunteer',
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Demo user created successfully!');
    console.log('Email: volunteer@demo.com');
    console.log('Password: Shiva@2208');
    console.log('User ID:', authData.user.id);

    // The database trigger should create the profile automatically
    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile was created
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️  Profile not found, creating manually...');
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'volunteer@demo.com',
          name: 'Demo Volunteer',
          role: 'volunteer',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=volunteer@demo.com`,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('✅ Profile created successfully!');
      }
    } else {
      console.log('✅ Profile exists:', profile);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createDemoUser();

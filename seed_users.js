const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://hscailoakoaujugpxlcn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzY2FpbG9ha29hdWp1Z3B4bGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTMzOTMsImV4cCI6MjA4ODcyOTM5M30.0IzF8gLMI2qhtfVYORQWpHUObqztRvfG5kCxviGByoQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  const users = [
    { email: 'admin@portoreal.com.br', role: 'superadmin' },
    { email: 'vendas@portoreal.com.br', role: 'vendas' },
    { email: 'aluguel@portoreal.com.br', role: 'aluguel' },
  ]

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: '123456',
    })
    
    if (error) {
       console.log(`Error signing up ${u.email}:`, error.message)
    } else {
       console.log(`Created user ${u.email}`)
       
       // Update profile role if user created
       if (data.user) {
         await supabase.from('profiles').upsert({
           id: data.user.id,
           full_name: u.email.split('@')[0],
           metas_role: u.role
         })
         console.log(`Profile updated for ${u.email}`)
       }
    }
  }
}

seed()

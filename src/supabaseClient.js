import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If no env vars, export a mock client for UI testing
const isMock = !supabaseUrl || !supabaseKey

const mockUser = { id: 'mock-user-id', email: 'admin@saahas.org' }
const mockSession = { user: mockUser }

const mockAnimals = [
  { id: '1', animal_id: 'DOG-001', name: 'Bruno', species: 'dog', breed: 'Labrador', current_status: 'stable', ward: 'ipd', is_active: true, requires_vet_attention: false, category: 'normal', animal_photos: [] },
  { id: '2', animal_id: 'CAT-001', name: 'Whiskers', species: 'cat', breed: 'Indie', current_status: 'critical', ward: 'opd', is_active: true, requires_vet_attention: true, category: 'normal', animal_photos: [] },
  { id: '3', animal_id: 'DOG-002', name: 'Tommy', species: 'dog', breed: 'Indie', current_status: 'moderate', ward: 'inhouse', is_active: true, requires_vet_attention: true, category: 'paralysed', animal_photos: [] },
]

function makeMockChain(data) {
  const chain = {
    select: () => chain,
    insert: () => chain,
    upsert: () => chain,
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: () => Promise.resolve({ data: data?.[0] || null, error: null }),
    then: (resolve) => resolve({ data, error: null, count: data?.length || 0 }),
  }
  return chain
}

const mockSupabase = { _authCallback: null,
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    signInWithPassword: () => {
      setTimeout(() => mockSupabase._authCallback?.('SIGNED_IN', mockSession), 50)
      return Promise.resolve({ data: { user: mockUser }, error: null })
    },
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (cb) => {
      // fire SIGNED_IN after signInWithPassword is called via Login
      mockSupabase._authCallback = cb
      return { data: { subscription: { unsubscribe: () => {} } } }
    },
  },
  from: (table) => {
    let data = []
    if (table === 'animals') data = mockAnimals
    if (table === 'profiles') data = [{ id: 'mock-user-id', role: 'admin' }]
    if (table === 'monthly_stats') data = []

    const chain = {
      select: () => chain,
      insert: () => chain,
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => chain,
      delete: () => chain,
      eq: (col, val) => {
        if (col === 'ward') data = mockAnimals.filter(a => a.ward === val)
        if (col === 'is_active') data = data.filter(a => a.is_active === val)
        if (col === 'requires_vet_attention') data = data.filter(a => a.requires_vet_attention === val)
        return chain
      },
      neq: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: data?.[0] || null, error: null }),
      then: (resolve) => resolve({ data, error: null, count: data?.length || 0 }),
    }
    return chain
  },
  channel: () => ({
    on: function() { return this },
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { path: 'mock/path.jpg' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
}

export const supabase = isMock ? mockSupabase : createClient(supabaseUrl, supabaseKey)

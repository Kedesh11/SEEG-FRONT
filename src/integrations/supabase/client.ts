/* eslint-disable @typescript-eslint/no-explicit-any */
// Simple stub for Supabase client to keep build green during migration
// All methods are no-ops returning resolved promises with { data: null, error: null }

function chain() {
  return {
    select() { return this; },
    update() { return this; },
    insert() { return this; },
    upsert() { return this; },
    delete() { return this; },
    eq() { return this; },
    order() { return this; },
    limit() { return this; },
    range() { return this; },
    single() { return Promise.resolve({ data: null, error: null }); },
    maybeSingle() { return Promise.resolve({ data: null, error: null }); },
    then(resolver: any) { return Promise.resolve({ data: null, error: null }).then(resolver as any); },
  } as any;
}

export const supabase: any = {
  from(_table: string) { return Object.assign(chain(), { table: _table }); },
  rpc(_fn: string, _args?: any) { return Promise.resolve({ data: null, error: null }); },
  functions: {
    invoke(_name: string, _opts?: any) { return Promise.resolve({ data: null, error: null }); }
  },
  channel(_name: string) { return { subscribe() { return this; }, unsubscribe() { /* no-op */ } } as any; },
  removeChannel(_ch: any) { /* no-op */ },
  auth: {
    onAuthStateChange(_cb?: any) { return { data: { subscription: { unsubscribe() { /* no-op */ } } } }; },
    getSession() { return Promise.resolve({ data: { session: null }, error: null }); },
    getUser() { return Promise.resolve({ data: { user: null }, error: null }); },
    signInWithPassword(_c: any) { return Promise.resolve({ data: { user: null, session: null }, error: null }); },
    signUp(_c: any) { return Promise.resolve({ data: { user: null }, error: null }); },
    signOut(_opts?: any) { return Promise.resolve({ error: null }); },
    updateUser(_c: any) { return Promise.resolve({ data: { user: null }, error: null }); },
    setSession(_c: any) { return Promise.resolve({ data: { session: null }, error: null }); },
    exchangeCodeForSession(_c: any) { return Promise.resolve({ data: { session: null }, error: null }); },
    resetPasswordForEmail(_email: string, _opts?: any) { return Promise.resolve({ data: null, error: null }); },
  },
}; 
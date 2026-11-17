const SUPABASE_URL = 'https://ickkglmeyhzoibskonxz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n5G5KAAIgzSdz9A8S1IsDg_lmzIkq1f'; 
const S = { view: 'welcome', role: null, user: null };
let supabase;

window.onload = function() {
    if (typeof window.supabase === 'undefined') return;
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            S.user = session.user;
            supabase.from('customers').select('*').eq('auth_id', S.user.id).single().then(({ data: profile }) => {
                if (profile) { S.user = { ...S.user, ...profile }; S.role = profile.role; S.view = (S.role === 'admin') ? 'admin' : 'customer'; }
                render();
            });
        } else { render(); }
    });
};

// --- تکه دوم (رندر صفحات) ---

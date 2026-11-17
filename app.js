// تنظیمات Supabase
const SUPABASE_URL = 'https://ickkglmeyhzoibskonxz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n5G5KAAIgzSdz9A8S1IsDg_lmzIkq1f'; 
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// وضعیت برنامه
const S = { view: 'welcome', role: null, user: null };

// شروع برنامه
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        S.user = session.user;
        const { data: profile } = await supabase.from('customers').select('*').eq('auth_id', S.user.id).single();
        if (profile) {
            S.user = { ...S.user, ...profile };
            S.role = profile.role;
            S.view = (S.role === 'admin') ? 'admin' : 'customer';
        }
    }
    render();
}

// رندر کردن صفحات
function render() {
    const main = document.getElementById('main-content');
    const headerUser = document.getElementById('header-user');
    
    if (S.view === 'welcome') {
        headerUser.innerHTML = '';
        main.innerHTML = `
            <div class="card" style="text-align:center; margin-top:50px;">
                <h2>پخش قفل و یراق اهورا</h2>
                <p style="color:var(--mu); font-size:16px; line-height:2;">از اعتماد و همراهی شما سپاسگزاریم؛<br>امید است این خرید آغاز ارتباطی طولانی‌مدت باشد.</p>
                <button onclick="S.view='choice'; render()">ادامه</button>
            </div>
        `;
    }
    else if (S.view === 'choice') {
        headerUser.innerHTML = '';
        main.innerHTML = `
            <div class="card" style="text-align:center;">
                <h2>خوش آمدید</h2>
                <p style="color:var(--mu); margin-bottom:20px;">برای ادامه نوع ورود خود را انتخاب کنید.</p>
                <button onclick="openLogin('admin')">ورود / ثبت‌نام مدیر</button>
                <button class="sec" onclick="openLogin('customer')">ورود / ثبت‌نام مشتری</button>
            </div>
        `;
    } 
    else if (S.view === 'login') {
        main.innerHTML = `
            <div class="card">
                <h2>${S.role === 'admin' ? 'مدیر' : 'مشتری'}</h2>
                <input id="username" placeholder="نام کاربری (شماره موبایل)" type="tel">
                <input id="password" placeholder="رمز عبور" type="password">
                <button onclick="doLogin()" id="btn-login">ورود / ثبت‌نام خودکار</button>
                <div id="login-msg" class="msg"></div>
                <button class="sec" onclick="S.view='choice'; render()" style="margin-top:15px;">بازگشت</button>
            </div>
        `;
    }
    else if (S.view === 'admin' || S.view === 'customer') {
        headerUser.innerHTML = `${S.user.name || S.user.phone} | <a href="#" onclick="doLogout(event)" style="color:var(--rd); text-decoration:none;">خروج</a>`;
        main.innerHTML = `
            <div class="card" style="text-align:center;">
                <h2>پنل ${S.view === 'admin' ? 'مدیریت' : 'مشتری'}</h2>
                <p style="color:var(--gn)">شما با موفقیت وارد شدید.</p>
                <p style="color:var(--mu)">(بخش‌های بعدی در حال ساخت هستند...)</p>
                <button onclick="doLogout(event)" style="background:var(--rd); margin-top:20px;">خروج از حساب</button>
            </div>
        `;
    }
}

window.openLogin = function(role) {
    S.role = role;
    S.view = 'login';
    render();
}

window.doLogin = async function() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    const btn = document.getElementById('btn-login');
    const msg = document.getElementById('login-msg');
    
    if (!user || !pass) { showMsg(msg, 'لطفا اطلاعات را کامل وارد کنید', 'err'); return; }
    if (pass.length < 6) { showMsg(msg, 'رمز عبور باید حداقل ۶ کاراکتر باشد', 'err'); return; }

    btn.innerText = 'در حال بررسی...';
    btn.disabled = true;
    msg.className = 'msg';

    try {
        let email = user.includes('@') ? user : user + '@ahoura.com';
        
        let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password: pass });

        if (authError && authError.message.includes('Invalid login credentials')) {
            btn.innerText = 'در حال ثبت‌نام...';
            let { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password: pass });
            
            if (signUpError) throw new Error(signUpError.message);
            
            await supabase.from('customers').insert([{
                auth_id: signUpData.user.id,
                username: user,
                phone: user,
                role: (S.role === 'admin' && user === '09120000000') ? 'admin' : 'customer',
                name: user
            }]);
            
            authData = signUpData;
            showMsg(msg, 'حساب شما ساخته شد و وارد شدید.', 'ok');
        } else if (authError) {
            throw new Error(authError.message);
        }

        S.user = authData.user;
        const { data: profile } = await supabase.from('customers').select('*').eq('auth_id', S.user.id).single();
        
        if (profile) {
            S.user = { ...S.user, ...profile };
            S.role = profile.role;
        } else {
            S.role = (S.role === 'admin') ? 'admin' : 'customer';
        }
        
        S.view = (S.role === 'admin') ? 'admin' : 'customer';
        render();

    } catch (err) {
        showMsg(msg, 'خطا: ' + err.message, 'err');
        btn.innerText = 'ورود / ثبت‌نام خودکار';
        btn.disabled = false;
    }
}

window.doLogout = async function(e) {
    if(e) e.preventDefault();
    await supabase.auth.signOut();
    S.view = 'choice';
    S.user = null;
    render();
}

function showMsg(el, text, type) {
    el.innerText = text;
    el.className = 'msg ' + type;
}

// اجرای برنامه
document.addEventListener('DOMContentLoaded', () => {
    // صبر می‌کنیم تا کتابخانه Supabase لود شود
    setTimeout(init, 500);
});

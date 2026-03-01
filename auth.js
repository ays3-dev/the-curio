const SUPABASE_URL = 'SUPABASE_URL_PLACEHOLDER'; 
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY_PLACEHOLDER';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const changePfpInput = document.createElement('input');
changePfpInput.type = 'file';
changePfpInput.accept = 'image/*';
changePfpInput.style.display = 'none';
document.body.appendChild(changePfpInput);

const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const toggleText = document.getElementById('auth-toggle-text');
const authError = document.getElementById('auth-error');
const authSubmitBtn = document.getElementById('auth-submit');
const pfpContainer = document.querySelector('.pfp-upload-container');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const pfpInput = document.getElementById('pfp-input');
const pfpPreview = document.getElementById('pfp-preview');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const forgotPwBtn = document.getElementById('forgot-pw-text');
const authButtons = document.getElementById('auth-buttons');
const userMenu = document.getElementById('user-menu');
const navAvatar = document.getElementById('nav-avatar');
const dropdown = document.getElementById('dropdown');
const logoutBtn = document.getElementById('logout-btn');
const darkToggleBtn = document.getElementById('dark-toggle');
const changePfpBtn = document.getElementById('change-pfp');
const DEFAULT_AVATAR = "avatar.png";

async function getAvatarUrl(path) {
    if (!path) return DEFAULT_AVATAR;
    if (path.startsWith('http')) return path;

    const cleanPath = path.replace(/^\/+/, '');

    const { data, error } = await supabaseClient.storage
        .from('avatars')
        .createSignedUrl(cleanPath, 3600);

    if (error) {
        console.error("Supabase Storage Error:", error.message);
        return DEFAULT_AVATAR;
    }

    if (!data || !data.signedUrl) {
        console.warn("No signed URL returned for path:", cleanPath);
        return DEFAULT_AVATAR;
    }

    return `${data.signedUrl}&t=${Date.now()}`;
}

async function updateNavbar(user) {
    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.classList.remove('hidden');
            userMenu.style.display = 'block';
        }

        const { data: { user: freshUser } } = await supabaseClient.auth.getUser();
        const avatarPath = freshUser?.user_metadata?.avatar_url;
                
        const avatar = await getAvatarUrl(avatarPath);
        if (navAvatar) navAvatar.src = avatar;
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) {
            userMenu.classList.add('hidden');
            userMenu.style.display = 'none';
        }
        if (dropdown) dropdown.classList.add('hidden');
    }
} 

supabaseClient.auth.getSession().then(({ data }) => {
    updateNavbar(data.session?.user || null);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateNavbar(session?.user || null);
});

function showAuthModal(mode) {
    if (!authModal) return;
    authError.textContent = '';
    
    if (mode === 'login') {
        authTitle.textContent = 'Log In';
        toggleText.innerHTML = `Don't have an account? <span id="toggle-auth" style="cursor:pointer; color:#6366f1; text-decoration:underline;">Sign Up</span>`;
        if (pfpContainer) pfpContainer.style.display = 'none';
        if (forgotPwBtn) forgotPwBtn.style.display = 'block';
    } else {
        authTitle.textContent = 'Sign Up';
        toggleText.innerHTML = `Already have an account? <span id="toggle-auth" style="cursor:pointer; color:#6366f1; text-decoration:underline;">Log In</span>`;
        if (pfpContainer) pfpContainer.style.display = 'flex';
        if (forgotPwBtn) forgotPwBtn.style.display = 'none';
    }

    authModal.classList.remove('hidden');
    authModal.style.setProperty('display', 'flex', 'important');
}

if (loginBtn) loginBtn.onclick = (e) => { e.preventDefault(); showAuthModal('login'); };
if (signupBtn) signupBtn.onclick = (e) => { e.preventDefault(); showAuthModal('signup'); };

if (toggleText) {
    toggleText.onclick = (e) => {
        if (e.target.id === 'toggle-auth') {
            const currentMode = authTitle.textContent === 'Log In' ? 'signup' : 'login';
            showAuthModal(currentMode);
        }
    };
}

window.onclick = function(event) {
    if (event.target == authModal) {
        authModal.style.setProperty('display', 'none', 'important');
        authModal.classList.add('hidden');
    }
    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (userMenu && !userMenu.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    }
}

if (authSubmitBtn) {
    authSubmitBtn.onclick = async () => {
        const email = usernameInput.value;
        const password = passwordInput.value;
        const isSignUp = authTitle.textContent === 'Sign Up';
        const file = pfpInput?.files[0];

        authError.textContent = 'Processing...';
        authError.style.color = '#64748b';

        if (isSignUp) {
            const { data: authData, error: authErr } = await supabaseClient.auth.signUp({ email, password });
            if (authErr) {
                authError.textContent = authErr.message;
                authError.style.color = '#ff4b4b';
                return;
            }

            let finalAvatarPath = null;
            if (file && authData.user) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;
                
                const { error: uploadErr } = await supabaseClient.storage.from('avatars').upload(fileName, file);
                if (!uploadErr) {
                    finalAvatarPath = fileName;
                } else {
                    console.error("Signup Upload Error:", uploadErr);
                }
            }
            
            await supabaseClient.auth.updateUser({ data: { avatar_url: finalAvatarPath } });
            authError.textContent = 'Success! Check your email.';
            authError.style.color = '#10b981';
        } else {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                authError.textContent = error.message;
                authError.style.color = '#ff4b4b';
            } else {
                authModal.style.display = 'none';
                updateNavbar(data.user);
            }
        }
    };
}


if (changePfpBtn) {
    changePfpBtn.onclick = () => changePfpInput.click();
}

changePfpInput.onchange = async () => {
    const file = changePfpInput.files[0];
    if (!file) return;
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const user = session.user;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabaseClient.storage.from('avatars').upload(fileName, file);
    if (uploadErr) {
        alert("Upload failed: " + uploadErr.message);
        return;
    }

    await new Promise(r => setTimeout(r, 500));
    const { data: updateResult, error: updateErr } = await supabaseClient.auth.updateUser({
        data: { avatar_url: fileName }
    });

    if (updateErr) {
        console.error("Update Error:", updateErr);
        return;
    }

    const { data: refreshData } = await supabaseClient.auth.refreshSession();
    
    await updateNavbar(refreshData.user);
    
    if (dropdown) dropdown.classList.add('hidden');
    alert("Profile Picture Updated!");
};

const togglePwBtn = document.querySelector('.toggle-pw');
const eyeIconSpan = document.querySelector('.eye-icon');
const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

if (togglePwBtn && passwordInput && eyeIconSpan) {
    togglePwBtn.onclick = (e) => {
        e.preventDefault();
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIconSpan.innerHTML = isPassword ? eyeOpenSVG : eyeClosedSVG;
    };
}

if (navAvatar && dropdown) {
    navAvatar.onclick = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    };
}

if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await supabaseClient.auth.signOut();
        location.reload(); 
    };
}

if (pfpPreview && pfpInput) {
    pfpPreview.onclick = () => pfpInput.click();
    pfpInput.onchange = () => {
        const file = pfpInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => pfpPreview.src = e.target.result;
            reader.readAsDataURL(file);
        }
    };
}

if (forgotPwBtn) {
    forgotPwBtn.onclick = async () => {
        const email = usernameInput.value;
        if (!email) {
            authError.textContent = "Please enter your email first!";
            authError.style.color = "#ff4b4b";
            return;
        }
        authError.textContent = "Sending reset link...";
        authError.style.color = "#64748b";
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: 'reset-password.html',
        });
        if (error) {
            authError.textContent = error.message;
            authError.style.color = "#ff4b4b";
        } else {
            authError.textContent = "Check your email for the reset link!";
            authError.style.color = "#10b981";
        }
    };
}



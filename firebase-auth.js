/* ==================================================
   OCTOPÉDIA — Sistema de Autenticação Firebase
   Login + Registro com Email/Google/GitHub
   ================================================== */

class FirebaseAuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
        this.initUI();
    }

    // Monitorar mudanças de autenticação
    initAuthListener() {
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI();
            if (user) {
                console.log('✅ Usuário logado:', user.email);
            }
        });
    }

    // Registro com Email/Senha
    registerWithEmail(email, password, displayName) {
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Salvar nome de usuário
                return userCredential.user.updateProfile({
                    displayName: displayName || email.split('@')[0]
                }).then(() => {
                    // Criar documento do usuário no Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        uid: userCredential.user.uid,
                        email: email,
                        displayName: displayName || email.split('@')[0],
                        createdAt: new Date(),
                        favorites: [],
                        avatar: this.generateAvatar(displayName || email)
                    });
                });
            })
            .catch((error) => {
                console.error('Erro no registro:', error.message);
                alert('Erro: ' + error.message);
                return false;
            });
    }

    // Login com Email/Senha
    loginWithEmail(email, password) {
        return auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('✅ Login realizado:', email);
                return true;
            })
            .catch((error) => {
                console.error('Erro no login:', error.message);
                alert('Erro: Email ou senha incorretos');
                return false;
            });
    }

    // Login com Google
    loginWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        return auth.signInWithPopup(provider)
            .then((result) => {
                console.log('✅ Login Google realizado:', result.user.email);
                // Criar documento do usuário se não existir
                return db.collection('users').doc(result.user.uid).set({
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: new Date(),
                    favorites: []
                }, { merge: true });
            })
            .catch((error) => {
                console.error('Erro no login Google:', error.message);
                return false;
            });
    }

    // Login com GitHub
    loginWithGithub() {
        const provider = new firebase.auth.GithubAuthProvider();
        return auth.signInWithPopup(provider)
            .then((result) => {
                console.log('✅ Login GitHub realizado:', result.user.email);
                return db.collection('users').doc(result.user.uid).set({
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName,
                    photoURL: result.user.photoURL,
                    createdAt: new Date(),
                    favorites: []
                }, { merge: true });
            })
            .catch((error) => {
                console.error('Erro no login GitHub:', error.message);
                return false;
            });
    }

    // Logout
    logout() {
        return auth.signOut()
            .then(() => {
                console.log('✅ Logout realizado');
                this.currentUser = null;
                this.updateUI();
            })
            .catch((error) => {
                console.error('Erro no logout:', error.message);
            });
    }

    // Gerar avatar
    generateAvatar(name) {
        return name.charAt(0).toUpperCase();
    }

    // Atualizar UI
    updateUI() {
        const userSection = document.querySelector('.user-section');
        if (!userSection) return;

        userSection.innerHTML = '';

        if (this.currentUser) {
            userSection.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar" title="${this.currentUser.displayName || this.currentUser.email}">
                        ${this.currentUser.photoURL ? 
                            `<img src="${this.currentUser.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit: cover;">` :
                            this.generateAvatar(this.currentUser.displayName || this.currentUser.email)
                        }
                    </div>
                    <span>${this.currentUser.displayName || this.currentUser.email}</span>
                    <button class="logout-btn" onclick="firebaseAuthManager.logout()">Sair</button>
                </div>
            `;
        } else {
            userSection.innerHTML = `
                <button class="login-btn" onclick="openFirebaseLoginModal()">Login / Cadastro</button>
            `;
        }
    }

    initUI() {
        this.updateUI();
    }
}

const firebaseAuthManager = new FirebaseAuthManager();

// Modal de Login
function openFirebaseLoginModal() {
    const modal = document.getElementById('firebaseAuthModal') || createFirebaseAuthModal();
    modal.style.display = 'block';
    
    document.querySelector('.modal-content').innerHTML = `
        <span class="close" onclick="closeFirebaseAuthModal()">&times;</span>
        <h2>🎮 Bem-vindo à Octopédia</h2>
        <p style="text-align: center; color: #666;">Faça login ou crie uma conta gratuita</p>
        
        <!-- Login Social -->
        <div style="display: grid; gap: 10px; margin: 20px 0;">
            <button onclick="firebaseAuthManager.loginWithGoogle()" style="padding: 12px; border-radius: 12px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: 600; color: #333;">
                🔵 Entrar com Google
            </button>
            <button onclick="firebaseAuthManager.loginWithGithub()" style="padding: 12px; border-radius: 12px; border: 1px solid #ddd; background: white; cursor: pointer; font-weight: 600; color: #333;">
                ⚫ Entrar com GitHub
            </button>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <span style="color: #999;">ou</span>
        </div>

        <!-- Login Email -->
        <form onsubmit="handleFirebaseLogin(event)">
            <h3 style="margin-top: 0; color: #0c5460;">Login com Email</h3>
            <input type="email" id="firebaseLoginEmail" placeholder="Email" required>
            <input type="password" id="firebaseLoginPassword" placeholder="Senha" required>
            <button type="submit" style="width: 100%; margin-top: 15px;">Entrar</button>
        </form>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid rgba(32, 201, 201, .3);">

        <!-- Registro -->
        <form onsubmit="handleFirebaseRegister(event)">
            <h3 style="margin-top: 0; color: #0c5460;">Criar Conta</h3>
            <input type="text" id="firebaseRegisterName" placeholder="Nome (opcional)">
            <input type="email" id="firebaseRegisterEmail" placeholder="Email" required>
            <input type="password" id="firebaseRegisterPassword" placeholder="Senha (min. 6 caracteres)" required>
            <button type="submit" style="width: 100%; margin-top: 15px;">Cadastrar</button>
        </form>

        <p style="text-align: center; font-size: 0.85em; color: #999; margin-top: 20px;">
            Seus dados são seguros com Firebase (Google). Totalmente gratuito! 🚀
        </p>
    `;
}

function createFirebaseAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'firebaseAuthModal';
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content"></div>';
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    document.body.appendChild(modal);
    return modal;
}

function closeFirebaseAuthModal() {
    const modal = document.getElementById('firebaseAuthModal');
    if (modal) modal.style.display = 'none';
}

function handleFirebaseLogin(event) {
    event.preventDefault();
    const email = document.getElementById('firebaseLoginEmail').value;
    const password = document.getElementById('firebaseLoginPassword').value;

    firebaseAuthManager.loginWithEmail(email, password).then(success => {
        if (success) {
            closeFirebaseAuthModal();
        }
    });
}

function handleFirebaseRegister(event) {
    event.preventDefault();
    const name = document.getElementById('firebaseRegisterName').value;
    const email = document.getElementById('firebaseRegisterEmail').value;
    const password = document.getElementById('firebaseRegisterPassword').value;

    firebaseAuthManager.registerWithEmail(email, password, name).then(success => {
        if (success) {
            closeFirebaseAuthModal();
            alert('Conta criada com sucesso! 🎉');
        }
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('firebaseAuthModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
}

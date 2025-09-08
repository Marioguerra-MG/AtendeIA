// ---------- IMPORTS ----------
import { auth, db } from '/my-bd/firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- FUNÇÃO DE TOAST ----------
function showToast(message, type = "success", duration = 4000) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
        container.style.position = "fixed";
        container.style.top = "20px";
        container.style.left = "50%";
        container.style.transform = "translateX(-50%)";
        container.style.zIndex = "9999";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.minWidth = "250px";
    toast.style.backgroundColor = type === "success" ? "#28a745" : "#dc3545";
    toast.style.color = "#fff";
    toast.style.padding = "15px 20px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    toast.style.transition = "all 0.5s ease";
    toast.style.fontSize = "14px";
    toast.style.textAlign = "center";

    container.appendChild(toast);

    void toast.offsetWidth;
    toast.classList.add("show");
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    return new Promise((resolve) => {
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-20px)";
            setTimeout(() => {
                if (container.contains(toast)) container.removeChild(toast);
                resolve();
            }, 500);
        }, duration);
    });
}

// ---------- LOGIN ----------
const formLogin = document.getElementById("form-login");
if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value.trim();

        const loadingToast = showToast("Tentando efetuar login...", "success", 2000);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            await loadingToast;

            showToast("Login realizado com sucesso!", "success");
            setTimeout(() => {
                window.location.href = "/my-app/app/html/main.html";
            }, 1000);

        } catch (error) {
            await loadingToast;
            console.log("Firebase error code:", error.code);
            let mensagem;

            if (error.code === "auth/user-not-found") {
                mensagem = "Usuário não cadastrado. Verifique seu e-mail ou faça seu cadastro.";
            } else if (error.code === "auth/wrong-password") {
                mensagem = "Senha incorreta. Verifique e tente novamente.";
            } else if (error.code === "auth/invalid-email") {
                mensagem = "O e-mail digitado é inválido. Verifique e tente novamente.";
            } else {
                mensagem = "Não foi possível efetuar o login. Verifique seu e-mail e senha.";
            }

            showToast(mensagem, "error");
        }
    });
}

// ---------- CADASTRO ----------
const formCadastro = document.getElementById("form-cadastro");
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("cadastroNome").value.trim();
        const email = document.getElementById("cadastroEmail").value.trim();
        const senha = document.getElementById("cadastroSenha").value.trim();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);

            await setDoc(doc(db, "usuarios", userCredential.user.uid), {
                nome: nome,
                email: email
            });

            showToast("Cadastro realizado! Faça login para continuar.", "success");
            setTimeout(() => {
                window.location.href = "/my-app/app/html/index.html";
            }, 1500);
        } catch (error) {
            console.log("Erro cadastro:", error.code);
            let mensagem = "Erro ao cadastrar. Tente novamente.";
            if (error.code === "auth/email-already-in-use") {
                mensagem = "Este e-mail já está em uso.";
            } else if (error.code === "auth/invalid-email") {
                mensagem = "E-mail inválido. Digite corretamente.";
            } else if (error.code === "auth/weak-password") {
                mensagem = "Senha muito fraca. Use ao menos 6 caracteres.";
            }
            showToast(mensagem, "error");
        }
    });
}

// ---------- ESQUECI A SENHA ----------
const btnEsqueciSenha = document.getElementById("esqueciSenha");
if (btnEsqueciSenha) {
    btnEsqueciSenha.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        if (!email) {
            showToast("Digite seu e-mail antes de solicitar a redefinição.", "error");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            showToast("E-mail de redefinição enviado! Confira sua caixa de entrada.", "success");
        } catch (error) {
            console.error("Erro reset:", error.code);
            let mensagem = "Erro ao enviar e-mail. Tente novamente.";
            if (error.code === "auth/user-not-found") mensagem = "Usuário não encontrado.";
            else if (error.code === "auth/invalid-email") mensagem = "E-mail inválido.";
            showToast(mensagem, "error");
        }
    });
}

// ---------- LOGIN AUTOMÁTICO ----------
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // redireciona se estiver no login/cadastro
        if (window.location.pathname.includes("loginCadastro.html") || window.location.pathname.includes("index.html")) {
            window.location.href = "/my-app/app/html/main.html";
        }
    }
});

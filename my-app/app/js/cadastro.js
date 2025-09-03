// ---------- IMPORTS ----------
import { auth, db } from '/my-bd/firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 500);
    }, duration);
}

// ---------- CADASTRO ----------
const formCadastro = document.getElementById("form-cadastro");
if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("cadastroNome").value.trim();
        const email = document.getElementById("cadastroEmail").value.trim();
        const senha = document.getElementById("cadastroSenha").value.trim();

        // Mensagem inicial de cadastro
        showToast("Criando sua conta...", "success", 2000);

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, senha);

            // Salvar dados extras no Firestore
            await setDoc(doc(db, "usuarios", userCred.user.uid), {
                nome,
                email,
                criadoEm: new Date()
            });

            showToast("Conta criada com sucesso! Redirecionando...", "success");
            setTimeout(() => {
                window.location.href = "/index.html"; // redireciona para login
            }, 1500);

        } catch (error) {
            console.log("Erro no cadastro:", error.code);
            let mensagem;

            switch (error.code) {
                case "auth/email-already-in-use":
                    mensagem = "Este e-mail já está em uso. Tente outro.";
                    break;
                case "auth/invalid-email":
                    mensagem = "O e-mail digitado é inválido. Verifique e tente novamente.";
                    break;
                case "auth/weak-password":
                    mensagem = "A senha é muito fraca. Use pelo menos 6 caracteres.";
                    break;
                default:
                    mensagem = "Não foi possível criar a conta. Tente novamente mais tarde.";
                    break;
            }

            showToast(mensagem, "error");
        }
    });
}

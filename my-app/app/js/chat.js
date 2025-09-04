// ------------------- IMPORTS -------------------
import { db } from '/my-bd/firebase-config.js';
import { collection, query, where, getDocs, updateDoc, increment, doc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ------------------- SELETORES -------------------
const chatContainer = document.querySelector(".chat-container");
const chatBox = document.getElementById("chatBox");
const chatHeader = document.getElementById("chatHeader");

// ------------------- NOMES ALEATÓRIOS -------------------
const primeirosNomes = [
    "Mario", "Lucas", "Ana", "Bruno", "Julia",
    "Lara", "Gabriel", "Beatriz", "Rafael", "Camila",
    "Felipe", "Carla", "Diego", "Mariana", "Thiago",
    "Renata", "Eduardo", "Patricia", "Vinicius", "Amanda"
];

function nomeAleatorio() {
    const indice = Math.floor(Math.random() * primeirosNomes.length);
    return `${primeirosNomes[indice]} Guia Virtual`;
}

// ------------------- UTILITÁRIOS -------------------
function obterUIDDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("uid");
}

function obterSaudacao() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia! 👋";
    if (hora >= 12 && hora < 18) return "Boa tarde! 🌞";
    return "Boa noite! 🌙";
}

// ------------------- USER ID ÚNICO POR VISITANTE -------------------
const userId = "visitante_" + Math.floor(Math.random() * 1000000);

// ------------------- CACHE LOCAL DE USUÁRIOS -------------------
const cacheUsuariosPorBot = {};

// ------------------- MENSAGENS -------------------
function adicionarMensagemNoChat(mensagem, tipo = "usuario") {
    const p = document.createElement("p");
    p.classList.add(tipo);
    p.innerHTML = mensagem.replace(/\n/g, "<br>");
    chatBox.appendChild(p);
    p.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Envia mensagem do usuário, incrementando mensagens e usuários apenas se necessário
async function enviarMensagemUsuario(botId, mensagem) {
    adicionarMensagemNoChat(mensagem, "user");
    const botRef = doc(db, "bots", botId);

    // Usa cache local para verificar se o usuário já foi contado
    if (!cacheUsuariosPorBot[botId]) {
        // Busca inicial dos usuários do bot
        const snapshot = await getDocs(query(collection(db, "bots"), where("__name__", "==", botId)));
        const botData = snapshot.docs[0]?.data();
        cacheUsuariosPorBot[botId] = botData?.usuarios || [];
    }

    const jaUsuario = cacheUsuariosPorBot[botId].includes(userId);

    if (!jaUsuario) {
        cacheUsuariosPorBot[botId].push(userId); // adiciona no cache local
        await updateDoc(botRef, { 
            usuarios: arrayUnion(userId),
            usuariosMensagens: increment(1)
        });
    }
}

// Adiciona mensagem do bot sem contar a saudação
async function adicionarMensagemBotDigitando(botId, mensagem, tempo = 1500, contar=true) {
    const botDigitando = document.createElement("p");
    botDigitando.classList.add("bot");
    botDigitando.textContent = "Digitando... ⏳";
    chatBox.appendChild(botDigitando);
    botDigitando.scrollIntoView({ behavior: "smooth", block: "start" });

    return new Promise(resolve => {
        setTimeout(async () => {
            botDigitando.remove();
            if(contar){
                await updateDoc(doc(db, "bots", botId), { mensagens: increment(1) });
            }
            adicionarMensagemNoChat(mensagem, "bot");
            resolve();
        }, tempo);
    });
}

// ------------------- INICIA CHAT -------------------
async function iniciarChatPublico() {
    const uid = obterUIDDaURL();
    if(!uid){
        chatBox.innerHTML = "<p class='bot'>Link inválido ou UID não encontrado.</p>";
        return;
    }

    chatContainer.style.display = "flex";

    const q = query(collection(db, "bots"), where("uid","==",uid));
    const snapshot = await getDocs(q);
    if(snapshot.empty){
        chatBox.innerHTML = "<p class='bot'>Nenhum bot disponível.</p>";
        return;
    }

    const firstBot = snapshot.docs[0];
    const nomeAssistente = nomeAleatorio();

    // ✅ Mensagens de saudação NÃO contam no total de mensagens
    await adicionarMensagemBotDigitando(firstBot.id, obterSaudacao(), 1500, false);
    await adicionarMensagemBotDigitando(firstBot.id, `Eu sou o ${nomeAssistente}. 🤖`, 2000, false);
    await adicionarMensagemBotDigitando(firstBot.id, "Escolha uma opção abaixo para começar.", 2000, false);

    if(!document.querySelector(".select-container")){
        const container = document.createElement("div");
        container.classList.add("select-container");

        const titulo = document.createElement("p");
        titulo.textContent = "Selecione uma função do bot:";
        titulo.classList.add("bot");
        container.appendChild(titulo);

        const selectChat = document.createElement("select");
        selectChat.classList.add("select-chat");

        const placeholder = document.createElement("option");
        placeholder.textContent = "Selecione...";
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        selectChat.appendChild(placeholder);

        snapshot.forEach(docSnap => {
            const bot = docSnap.data();
            const opt = document.createElement("option");
            opt.value = docSnap.id;
            opt.textContent = bot.funcao || "Função não definida";
            selectChat.appendChild(opt);
        });

        selectChat.addEventListener("change", async ()=>{
            const botId = selectChat.value;
            if(!botId) return;

            const botSnap = await getDocs(query(collection(db, "bots"), where("__name__","==",botId)));
            const botData = botSnap.docs[0]?.data();
            if(!botData) return;

            await enviarMensagemUsuario(botId, botData.funcao || "Bot"); // userId fixo
            await adicionarMensagemBotDigitando(botId, botData.descricao || "Sem resposta configurada.", 1000);

            selectChat.value = "";
        });

        container.appendChild(selectChat);
        chatHeader.appendChild(container);
    }
}

iniciarChatPublico();

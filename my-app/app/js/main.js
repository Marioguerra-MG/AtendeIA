import { db, auth } from '/my-bd/firebase-config.js';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, query, where, onSnapshot, orderBy 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ------------------- SELETORES -------------------
const tabelaBots = document.querySelector(".tabela-bots tbody");
const btnAdd = document.querySelector(".btn-add");
const buscarInput = document.getElementById("buscar");
const totalBotsCard = document.querySelector(".cards .card:nth-child(1) p");
const mensagensCard = document.querySelector(".cards .card:nth-child(2) p");

const formCriarBot = document.getElementById("form-criar-bot");
const formEditarBot = document.getElementById("form-editar-bot");
const modalEditar = document.getElementById("modal-editar-bot");

// Container para cards responsivos
let botCardsContainer = document.querySelector(".bots-cards");
if(!botCardsContainer) {
    botCardsContainer = document.createElement("section");
    botCardsContainer.classList.add("bots-cards");
    const mainEl = document.querySelector(".main");
    if(mainEl) mainEl.appendChild(botCardsContainer);
}

// ------------------- ARRAY GLOBAL -------------------
let listaDeBots = [];

// ------------------- FORMATADOR DE NÚMEROS -------------------
function formatarNumero(num) {
    num = Number(num) || 0;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
}

// ------------------- FUNÇÃO PARA LIMITAR TEXTO -------------------
function limitarTexto(texto, limite = 25) {
    if (!texto) return "";
    if (texto.length > limite) return texto.slice(0, limite) + "...";
    return texto;
}

// ------------------- FUNÇÃO PARA CRIAR LINHA DA TABELA -------------------
function adicionarLinhaTabela(nome, status, funcao, mensagens, id) {
    const novaLinha = document.createElement("tr");
    novaLinha.dataset.id = id;
    novaLinha.innerHTML = `
        <td title="${nome}">${limitarTexto(nome, 25)}</td>
        <td><span class="${status === "Ativo" ? "ativo" : "inativo"}">${status}</span></td>
        <td title="${funcao}">${limitarTexto(funcao, 20)}</td>
        <td>${formatarNumero(mensagens)}</td>
        <td>
            <button class="acao editar">Editar</button>
            <button class="acao deletar">Excluir</button>
        </td>
    `;
    tabelaBots.appendChild(novaLinha);

    novaLinha.querySelector(".editar").addEventListener("click", () => abrirModalEditar(id));
    novaLinha.querySelector(".deletar").addEventListener("click", () => excluirBot(id));
}

const linkPublicoSidebar = document.getElementById("link-publico");

linkPublicoSidebar?.addEventListener("click", async (e) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if(!uid) {
        alert("❌ Usuário não logado.");
        return;
    }
    const link = `${window.location.origin}/my-app/app/html/chat.html?uid=${uid}`;
    try {
        await navigator.clipboard.writeText(link);
        alert("✅ Link público copiado! Compartilhe com seus visitantes.");
    } catch(err) {
        console.error(err);
        alert("❌ Não foi possível copiar o link.");
    }
});


// ------------------- ATUALIZAÇÃO DOS CARDS -------------------
function atualizarCards(snapshot) {
    let totalBots = 0;
    let totalMensagens = 0;

    snapshot.forEach(docSnap => {
        const bot = docSnap.data();
        totalBots++;
        totalMensagens += (bot.mensagens || 0) + (bot.usuariosMensagens || 0);
    });

    if(totalBotsCard) totalBotsCard.textContent = formatarNumero(totalBots);
    if(mensagensCard) mensagensCard.textContent = formatarNumero(totalMensagens);
}

// ------------------- FUNÇÃO DE CARDS RESPONSIVOS -------------------
function atualizarBotsCards(botList) {
    if(!botCardsContainer) return;
    botCardsContainer.innerHTML = "";
    if (window.innerWidth <= 768) {
        botList.forEach(bot => {
            const card = document.createElement("div");
            card.classList.add("bot-card");
            card.dataset.id = bot.id;

            card.innerHTML = `
                <h4 title="${bot.nome}">${limitarTexto(bot.nome, 15)}</h4>
                <p title="${bot.funcao}"><strong>Função:</strong> ${limitarTexto(bot.funcao, 20)}</p>
                <p><strong>Mensagens:</strong> ${formatarNumero(bot.mensagens)}</p>
                <p class="status ${bot.status === "Ativo" ? "ativo" : "inativo"}">${bot.status}</p>
                <div class="acoes">
                    <button class="editar">Editar</button>
                    <button class="deletar">Excluir</button>
                </div>
            `;

            botCardsContainer.appendChild(card);

            card.querySelector(".editar").addEventListener("click", () => abrirModalEditar(bot.id));
            card.querySelector(".deletar").addEventListener("click", () => excluirBot(bot.id));
        });
    }
}

// ------------------- FUNÇÕES DE EDIÇÃO/EXCLUSÃO -------------------
async function abrirModalEditar(id) {
    const docSnap = await getDoc(doc(db, "bots", id));
    if (docSnap.exists() && modalEditar) {
        const bot = docSnap.data();
        document.getElementById("editBotId").value = id;
        document.getElementById("editNomeBot").value = bot.nome;
        document.getElementById("editFuncaoBot").value = bot.funcao || "";
        document.getElementById("editDescricaoBot").value = bot.descricao || "";
        document.getElementById("editStatusBot").value = bot.status || "Ativo";
        modalEditar.style.display = "flex";
    }
}

async function excluirBot(id) {
    if(confirm("Tem certeza que deseja excluir este bot?")) {
        await deleteDoc(doc(db, "bots", id));
    }
}

// ------------------- FIRESTORE LISTENER -------------------
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = "/index.html";
        return;
    }
    const uid = user.uid;

    const qBots = query(collection(db, "bots"), where("uid", "==", uid));
    onSnapshot(qBots, snapshot => {
        tabelaBots.innerHTML = "";
        listaDeBots = [];

        snapshot.forEach(docSnap => {
            const bot = docSnap.data();
            const mensagens = (bot.mensagens || 0) + (bot.usuariosMensagens || 0);
            adicionarLinhaTabela(bot.nome, bot.status, bot.funcao, mensagens, docSnap.id);

            listaDeBots.push({
                id: docSnap.id,
                nome: bot.nome,
                funcao: bot.funcao,
                mensagens,
                status: bot.status
            });
        });

        atualizarCards(snapshot);
        atualizarBotsCards(listaDeBots);
    });
});

// ------------------- LISTENER PARA BUSCAR -------------------
buscarInput?.addEventListener("input", () => {
    const termo = buscarInput.value.toLowerCase();
    const linhas = tabelaBots.querySelectorAll("tr");
    linhas.forEach(linha => {
        const nomeBot = linha.querySelector("td").textContent.toLowerCase();
        linha.style.display = nomeBot.includes(termo) ? "" : "none";
    });
});

// ------------------- CRIAR NOVO BOT -------------------
formCriarBot?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nomeBot").value.trim();
    const funcaoSelect = document.getElementById("funcaoBot");
    let funcao = funcaoSelect.selectedOptions[0].text;
    const descricao = document.getElementById("descricaoBot").value.trim();

    if(funcaoSelect.value === "outra") {
        funcao = document.getElementById("funcaoBotCustom").value.trim();
    }
    if (!nome || !funcao || !descricao) return alert("Preencha todos os campos!");

    const uid = auth.currentUser.uid;
    try {
        await addDoc(collection(db, "bots"), {
            uid, nome, funcao, descricao,
            status: "Ativo", mensagens: 0, usuariosMensagens: 0
        });
        alert("✅ Bot criado com sucesso!");
        formCriarBot.reset();
        const modalCriar = document.getElementById("modal-criar-bot");
        if(modalCriar) modalCriar.style.display = "none";
    } catch(e) {
        console.error(e);
        alert("❌ Erro ao criar bot.");
    }
});

// ------------------- EDITAR BOT -------------------
formEditarBot?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editBotId").value;
    const nome = document.getElementById("editNomeBot").value.trim();
    const funcaoSelect = document.getElementById("editFuncaoBot");
    let funcao = funcaoSelect.selectedOptions[0].text;
    const descricao = document.getElementById("editDescricaoBot").value.trim();
    const status = document.getElementById("editStatusBot").value;

    if(funcaoSelect.value === "outra") funcao = document.getElementById("editFuncaoBotCustom").value.trim();
    if(!nome || !funcao || !descricao) return alert("Preencha todos os campos!");

    try {
        await updateDoc(doc(db, "bots", id), { nome, funcao, descricao, status });
        alert("✅ Bot atualizado com sucesso!");
        if(modalEditar) modalEditar.style.display = "none";
    } catch(e) {
        console.error(e);
        alert("❌ Erro ao editar bot.");
    }
});

// ------------------- MODAIS -------------------
document.querySelector(".close-edit")?.addEventListener("click", () => { if(modalEditar) modalEditar.style.display = "none"; });
btnAdd?.addEventListener("click", () => {
    const modalCriar = document.getElementById("modal-criar-bot");
    if(modalCriar) modalCriar.style.display = "flex";
});
document.querySelector(".close")?.addEventListener("click", () => {
    const modalCriar = document.getElementById("modal-criar-bot");
    if(modalCriar) modalCriar.style.display = "none";
});

// ------------------- LINKS PÚBLICOS -------------------
function gerarLinkPublico() {
    const uid = auth.currentUser.uid;
    const link = `${window.location.origin}/my-app/app/html/chat.html?uid=${uid}`;
    navigator.clipboard.writeText(link)
        .then(() => alert("✅ Link público copiado!"))
        .catch(err => console.error(err));
}

// ------------------- LOGOUT -------------------
document.getElementById("btn-logout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
        await auth.signOut();
        window.location.href = "/index.html";
    } catch(e) {
        console.error(e);
        alert("❌ Não foi possível sair.");
    }
});


// ------------------- REDIMENSIONAMENTO -------------------
window.addEventListener("resize", () => atualizarBotsCards(listaDeBots));

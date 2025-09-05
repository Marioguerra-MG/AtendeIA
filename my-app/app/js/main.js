// ---------- IMPORTS ----------
import { db, auth } from '/my-bd/firebase-config.js';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, query, where, onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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

  void toast.offsetWidth; // força reflow
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

// ---------- SELETORES ----------
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
if (!botCardsContainer) {
  botCardsContainer = document.createElement("section");
  botCardsContainer.classList.add("bots-cards");
  const mainEl = document.querySelector(".main");
  if (mainEl) mainEl.appendChild(botCardsContainer);
}

// ---------- ARRAY GLOBAL ----------
let listaDeBots = [];

// ---------- TEMPLATES ----------
// ---------- TEMPLATES HUMANIZADOS ----------
const templates = [
  {
    id: "restaurante",
    nome: "Restaurante",
    funcao: "Atendimento Restaurante",
    descricao: [
      "Olá! Funcionamos de 10h às 22h todos os dias. 🍽️",
      "Hoje no cardápio temos: lasanha, estrogonofe e salada Caesar. 😋",
      "Quer saber das promoções? Nosso Happy Hour é das 18h às 20h: 50% em drinks selecionados! 🍹"
    ]
  },
  {
    id: "ecommerce",
    nome: "E-commerce",
    funcao: "Atendimento E-commerce",
    descricao: [
      "Oi! Para rastrear seu pedido, use o código que enviamos por e-mail. 📦",
      "Aceitamos pagamento por cartão, Pix ou boleto. 💳",
      "Confira nossas promoções: frete grátis em compras acima de R$150! 🎉"
    ]
  }
];


// ---------- FORMATADOR ----------
function formatarNumero(num) {
  num = Number(num) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}

// ---------- LIMITAR TEXTO ----------
function limitarTexto(texto, limite = 25) {
  if (!texto) return "";
  if (texto.length > limite) return texto.slice(0, limite) + "...";
  return texto;
}

// ---------- TABELA ----------
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

// ---------- LINK PÚBLICO ----------
const linkPublicoSidebar = document.getElementById("link-publico");
linkPublicoSidebar?.addEventListener("click", async (e) => {
  e.preventDefault();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    showToast("Usuário não logado.", "error");
    return;
  }
  const link = `${window.location.origin}/my-app/app/html/chat.html?uid=${uid}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast("Link público copiado! Compartilhe com seus visitantes.");
  } catch (err) {
    console.error(err);
    showToast("Não foi possível copiar o link.", "error");
  }
});

// ---------- CARDS ----------
function atualizarCards(snapshot) {
  let totalBots = 0;
  let totalMensagens = 0;

  snapshot.forEach(docSnap => {
    const bot = docSnap.data();
    totalBots++;
    totalMensagens += (bot.mensagens || 0) + (bot.usuariosMensagens || 0);
  });

  if (totalBotsCard) totalBotsCard.textContent = formatarNumero(totalBots);
  if (mensagensCard) mensagensCard.textContent = formatarNumero(totalMensagens);
}

function atualizarBotsCards(botList) {
  if (!botCardsContainer) return;
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

function formatarDescricaoComLink(descricao) {
  if (!descricao) return "";

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return descricao.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">Saiba mais</a>`);
}

// ---------- EDIÇÃO / EXCLUSÃO ----------
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

// ---------- MODAL DE CONFIRMAÇÃO ----------
function confirmModal(message) {
  return new Promise((resolve) => {
    let oldModal = document.getElementById("confirm-modal");
    if (oldModal) oldModal.remove();

    const overlay = document.createElement("div");
    overlay.id = "confirm-modal";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "10000";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "20px";
    box.style.borderRadius = "10px";
    box.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    box.style.maxWidth = "300px";
    box.style.textAlign = "center";
    box.innerHTML = `
      <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
      <button id="confirm-yes" style="margin-right:10px; padding:8px 15px; border:none; border-radius:5px; background:#28a745; color:#fff; cursor:pointer;">Sim</button>
      <button id="confirm-no" style="padding:8px 15px; border:none; border-radius:5px; background:#dc3545; color:#fff; cursor:pointer;">Não</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    box.querySelector("#confirm-yes").addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    box.querySelector("#confirm-no").addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
  });
}

// ---------- EXCLUIR BOT ----------
async function excluirBot(id) {
  const confirmar = await confirmModal("Tem certeza que deseja excluir este bot?");
  if (confirmar) {
    try {
      await deleteDoc(doc(db, "bots", id));
      showToast("Bot excluído com sucesso!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao excluir bot.", "error");
    }
  } else {
    showToast("Exclusão cancelada.", "error");
  }
}

// ---------- FIRESTORE LISTENER ----------
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

// ---------- BUSCAR ----------
buscarInput?.addEventListener("input", () => {
  const termo = buscarInput.value.toLowerCase();
  const linhas = tabelaBots.querySelectorAll("tr");
  linhas.forEach(linha => {
    const nomeBot = linha.querySelector("td").textContent.toLowerCase();
    linha.style.display = nomeBot.includes(termo) ? "" : "none";
  });
});

// ---------- CRIAR COM TEMPLATES ----------
formCriarBot?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nomeBot").value.trim();
  const funcaoSelect = document.getElementById("funcaoBot");
  let funcao = funcaoSelect.selectedOptions[0].text;
  const descricao = document.getElementById("descricaoBot").value.trim();

  if (funcaoSelect.value === "outra") {
    funcao = document.getElementById("funcaoBotCustom").value.trim();
  }
  if (!nome || !funcao || !descricao) {
    showToast("Preencha todos os campos!", "error");
    return;
  }

  const uid = auth.currentUser.uid;
  try {
    await addDoc(collection(db, "bots"), {
      uid, nome, funcao, descricao,
      status: "Ativo", mensagens: 0, usuariosMensagens: 0
    });
    showToast("Bot criado com sucesso!");
    formCriarBot.reset();
    const modalCriar = document.getElementById("modal-criar-bot");
    if (modalCriar) modalCriar.style.display = "none";
  } catch (e) {
    console.error(e);
    showToast("Erro ao criar bot.", "error");
  }
});

// ---------- TEMPLATE SELECTION ----------
document.getElementById("templateBot")?.addEventListener("change", (e) => {
  const selectedTemplate = templates.find(t => t.id === e.target.value);
  if (selectedTemplate) {
    document.getElementById("nomeBot").value = `Bot ${selectedTemplate.nome}`;
    document.getElementById("funcaoBot").value = selectedTemplate.funcao;
    document.getElementById("descricaoBot").value = selectedTemplate.descricao;
  } else {
    document.getElementById("nomeBot").value = "";
    document.getElementById("funcaoBot").value = "";
    document.getElementById("descricaoBot").value = "";
  }
});

// ---------- EDITAR ----------
formEditarBot?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editBotId").value;
  const nome = document.getElementById("editNomeBot").value.trim();
  const funcaoSelect = document.getElementById("editFuncaoBot");
  let funcao = funcaoSelect.selectedOptions[0].text;
  const descricao = document.getElementById("editDescricaoBot").value.trim();
  const status = document.getElementById("editStatusBot").value;

  if (funcaoSelect.value === "outra") funcao = document.getElementById("editFuncaoBotCustom").value.trim();
  if (!nome || !funcao || !descricao) {
    showToast("⚠️ Preencha todos os campos!", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "bots", id), { nome, funcao, descricao, status });
    showToast("Bot atualizado com sucesso!");
    if (modalEditar) modalEditar.style.display = "none";
  } catch (e) {
    console.error(e);
    showToast("Erro ao editar bot.", "error");
  }
});

// ---------- MODAIS ----------
document.querySelector(".close-edit")?.addEventListener("click", () => { if (modalEditar) modalEditar.style.display = "none"; });
btnAdd?.addEventListener("click", () => {
  const modalCriar = document.getElementById("modal-criar-bot");
  if (modalCriar) modalCriar.style.display = "flex";
});
document.querySelector(".close")?.addEventListener("click", () => {
  const modalCriar = document.getElementById("modal-criar-bot");
  if (modalCriar) modalCriar.style.display = "none";
});

// ---------- LINKS PÚBLICOS ----------
function gerarLinkPublico() {
  const uid = auth.currentUser.uid;
  const link = `${window.location.origin}/my-app/app/html/chat.html?uid=${uid}`;
  navigator.clipboard.writeText(link)
    .then(() => showToast("Link público copiado!"))
    .catch(err => {
      console.error(err);
      showToast("Erro ao copiar link.", "error");
    });
}

// ---------- LOGOUT ----------
document.getElementById("btn-logout")?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    await auth.signOut();
    window.location.href = "/index.html";
  } catch (e) {
    console.error(e);
    showToast("Não foi possível sair.", "error");
  }
});

// ---------- REDIMENSIONAMENTO ----------
window.addEventListener("resize", () => atualizarBotsCards(listaDeBots));

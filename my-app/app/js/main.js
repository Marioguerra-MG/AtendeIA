// ---------- IMPORTS ----------
import { db, auth } from '/my-bd/firebase-config.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ---------- TOAST ----------
function showToast(message, type = "success", duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    });
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  Object.assign(toast.style, {
    minWidth: "250px",
    backgroundColor: type === "success" ? "#28a745" : "#dc3545",
    color: "#fff",
    padding: "15px 20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    opacity: "0",
    transform: "translateY(-20px)",
    transition: "all 0.5s ease",
    fontSize: "14px",
    textAlign: "center"
  });

  container.appendChild(toast);
  void toast.offsetWidth;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 500);
  }, duration);
}

// ---------- HIGHLIGHT INPUT ----------
function marcarInputInvalido(input) {
  input.classList.add("input-error");
  setTimeout(() => input.classList.remove("input-error"), 2000);
}

// ---------- SELECTORES ----------
const tabelaBots = document.querySelector(".tabela-bots tbody");
const formCriarBot = document.getElementById("form-criar-bot");
const formEditarBot = document.getElementById("form-editar-bot");
const modalEditar = document.getElementById("modal-editar-bot");

const descricaoBot = document.getElementById("descricaoBot");
const funcaoSelect = document.getElementById("funcaoBot");
const funcaoCustom = document.getElementById("funcaoBotCustom");
const buscarInput = document.getElementById("buscar");
const totalBotsCard = document.querySelector(".cards .card:nth-child(1) p");

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

// ---------- FORMATADORES ----------
function formatarNumero(num) {
  num = Number(num) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}
function limitarTexto(texto, limite = 25) {
  if (!texto) return "";
  if (texto.length > limite) return texto.slice(0, limite) + "...";
  return texto;
}

// ---------- TABELA ----------
function adicionarLinhaTabela(nome, status, funcao, id) {
  const novaLinha = document.createElement("tr");
  novaLinha.dataset.id = id;
  novaLinha.innerHTML = `
    <td title="${nome}">${limitarTexto(nome, 25)}</td>
    <td><span class="${status === "Ativo" ? "ativo" : "inativo"}">${status}</span></td>
    <td title="${funcao}">${limitarTexto(funcao, 20)}</td>
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
async function gerarLinkPublico() {
  const uid = auth.currentUser?.uid;
  if (!uid) { showToast("Usuário não logado.", "error"); return; }
  const link = `${window.location.origin}/my-app/app/html/chat.html?uid=${uid}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast("Link público copiado!");
  } catch { showToast("Não foi possível copiar o link.", "error"); }
}
document.getElementById("link-publico")?.addEventListener("click", e => { e.preventDefault(); gerarLinkPublico(); });

// ---------- CARDS ----------
function atualizarCards(snapshot) {
  let totalBots = snapshot.size || 0;
  if (totalBotsCard) totalBotsCard.textContent = formatarNumero(totalBots);
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

// ---------- EDITAR / EXCLUIR ----------
async function abrirModalEditar(id) {
  const docSnap = await getDoc(doc(db, "bots", id));
  if (!docSnap.exists() || !modalEditar) return;

  const bot = docSnap.data();

  document.getElementById("editBotId").value = id;
  document.getElementById("editNomeBot").value = bot.nome;

  const editFuncaoSelect = document.getElementById("editFuncaoBot");
  const editFuncaoCustom = document.getElementById("editFuncaoBotCustom");

  const opcoes = Array.from(editFuncaoSelect.options).map(o => o.value);
  if (!opcoes.includes(bot.funcao)) {
    editFuncaoSelect.value = "outra";
    editFuncaoCustom.style.display = "block";
    editFuncaoCustom.value = bot.funcao;
  } else {
    editFuncaoSelect.value = bot.funcao;
    editFuncaoCustom.style.display = "none";
  }

  document.getElementById("editDescricaoBot").value = bot.descricao || "";
  document.getElementById("editStatusBot").value = bot.status ?? "Ativo";

  modalEditar.style.display = "flex";
}

document.getElementById("editFuncaoBot")?.addEventListener("change", () => {
  const editFuncaoCustom = document.getElementById("editFuncaoBotCustom");
  editFuncaoCustom.style.display = document.getElementById("editFuncaoBot").value === "outra" ? "block" : "none";
});

function confirmModal(message) {
  return new Promise(resolve => {
    let oldModal = document.getElementById("confirm-modal");
    if (oldModal) oldModal.remove();
    const overlay = document.createElement("div");
    overlay.id = "confirm-modal";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: "10000"
    });
    const box = document.createElement("div");
    Object.assign(box.style, {
      background: "#fff", padding: "20px", borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)", maxWidth: "300px", textAlign: "center"
    });
    box.innerHTML = `
      <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
      <button id="confirm-yes" style="margin-right:10px; padding:8px 15px; border:none; border-radius:5px; background:#28a745; color:#fff; cursor:pointer;">Sim</button>
      <button id="confirm-no" style="padding:8px 15px; border:none; border-radius:5px; background:#dc3545; color:#fff; cursor:pointer;">Não</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    box.querySelector("#confirm-yes").addEventListener("click", () => { overlay.remove(); resolve(true); });
    box.querySelector("#confirm-no").addEventListener("click", () => { overlay.remove(); resolve(false); });
  });
}

async function excluirBot(id) {
  const confirmar = await confirmModal("Tem certeza que deseja excluir este bot?");
  if (confirmar) {
    try {
      await deleteDoc(doc(db, "bots", id));
      showToast("Bot excluído com sucesso!");
      await carregarBots();
    } catch { showToast("Erro ao excluir bot.", "error"); }
  } else { showToast("Exclusão cancelada.", "error"); }
}

// ---------- FUNÇÃO PARA CARREGAR BOTS ----------
async function carregarBots() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const qBots = query(collection(db, "bots"), where("uid", "==", uid));
  const snapshot = await getDocs(qBots);

  tabelaBots.innerHTML = "";
  listaDeBots = [];

  snapshot.forEach(docSnap => {
    const bot = docSnap.data();
    adicionarLinhaTabela(bot.nome, bot.status ?? "Ativo", bot.funcao, docSnap.id);
    listaDeBots.push({ id: docSnap.id, nome: bot.nome, funcao: bot.funcao, status: bot.status ?? "Ativo" });
  });

  atualizarCards(snapshot);
  atualizarBotsCards(listaDeBots);
}

// ---------- FIRESTORE (OTIMIZADO) ----------
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = "/index.html"; return; }
  carregarBots();
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

// ---------- WIZARD ----------
let currentStep = 0;
const steps = document.querySelectorAll("#modal-criar-bot .step");
function showStep(index) {
  steps.forEach((s, i) => s.classList.toggle("active", i === index));
  currentStep = index;
}
document.querySelectorAll(".btn-proximo").forEach(btn => {
  btn.addEventListener("click", () => { if (currentStep < steps.length - 1) showStep(currentStep + 1); });
});
document.querySelectorAll(".btn-voltar").forEach(btn => {
  btn.addEventListener("click", () => { if (currentStep > 0) showStep(currentStep - 1); });
});

// ---------- FUNÇÃO CUSTOM ----------
funcaoSelect?.addEventListener("change", () => {
  funcaoCustom.style.display = funcaoSelect.value === "outra" ? "block" : "none";
});

// ---------- ADICIONAR LINK NA DESCRIÇÃO ----------
document.getElementById("btnAddLink")?.addEventListener("click", () => {
  const link = prompt("Digite a URL do link:");
  if (!link) return;
  descricaoBot.value += link;
});

// ---------- CRIAR BOT ----------
formCriarBot?.addEventListener("submit", async e => {
  e.preventDefault();

  const nomeInput = document.getElementById("nomeBot");
  const descricaoInput = descricaoBot;
  let funcao = funcaoSelect.value;

  const modal = document.getElementById("modal-criar-bot");
  if(modal) modal.style.display = "flex";

  if (!nomeInput.value.trim()) {
    nomeInput.classList.add("input-error");
    showToast("Preencha o nome do bot.", "error", 5000);
    return;
  }

  if (!descricaoInput.value.trim()) {
    descricaoInput.classList.add("input-error");
    showToast("Preencha a descrição do bot.", "error", 5000);
    return;
  }

  if (funcao === "outra") {
    funcao = funcaoCustom.value.trim();
    if (!funcao) {
      funcaoCustom.classList.add("input-error");
      showToast("Preencha a função do bot.", "error", 5000);
      return;
    }
  } else {
    funcao = funcaoSelect.options[funcaoSelect.selectedIndex].text;
  }

  try {
    const uid = auth.currentUser?.uid;
    if (!uid) { showToast("Usuário não logado.", "error"); return; }

    await addDoc(collection(db, "bots"), {
      uid,
      nome: nomeInput.value.trim(),
      funcao,
      descricao: descricaoInput.value.trim(),
      status: "Ativo",
      criadoEm: new Date()
    });

    showToast("Bot criado com sucesso!");
    formCriarBot.reset();
    funcaoCustom.style.display = "none";
    showStep(0);

    if(modal) modal.style.display = "none";

    await carregarBots();

  } catch (e) {
    console.error(e);
    showToast("Erro ao criar bot.", "error");
  }
});

// ---------- FORMULÁRIO EDITAR BOT ----------
formEditarBot?.addEventListener("submit", async e => {
  e.preventDefault();

  const id = document.getElementById("editBotId").value;
  const nomeInput = document.getElementById("editNomeBot");
  const descricaoInput = document.getElementById("editDescricaoBot");
  const editFuncaoSelect = document.getElementById("editFuncaoBot");
  const editFuncaoCustom = document.getElementById("editFuncaoBotCustom");

  let funcao = editFuncaoSelect.value === "outra"
    ? editFuncaoCustom.value.trim()
    : editFuncaoSelect.options[editFuncaoSelect.selectedIndex].text;

  if (!nomeInput.value.trim()) {
    marcarInputInvalido(nomeInput);
    showToast("O nome do bot não pode ficar vazio.", "error");
    return;
  }

  if (!descricaoInput.value.trim()) {
    marcarInputInvalido(descricaoInput);
    showToast("A descrição do bot não pode ficar vazia.", "error");
    return;
  }

  if (editFuncaoSelect.value === "outra" && !funcao) {
    marcarInputInvalido(editFuncaoCustom);
    showToast("A função do bot não pode ficar vazia.", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "bots", id), {
      nome: nomeInput.value.trim(),
      funcao,
      descricao: descricaoInput.value.trim(),
      status: document.getElementById("editStatusBot").value
    });
    showToast("Bot atualizado com sucesso!");

    if (modalEditar) modalEditar.style.display = "none";

    await carregarBots();

  } catch (e) {
    console.error(e);
    showToast("Erro ao atualizar bot.", "error");
  }
});

// Fechar modal editar ao clicar no "X"
const closeEditar = document.querySelector("#modal-editar-bot .close");
closeEditar?.addEventListener("click", () => {
  if (modalEditar) modalEditar.style.display = "none";
});

// Fechar modal editar ao clicar fora
modalEditar?.addEventListener("click", (e) => {
  if (e.target === modalEditar) {
    modalEditar.style.display = "none";
  }
});

// ---------- LOGOUT ----------
const btnLogout = document.getElementById("btn-logout");
btnLogout?.addEventListener("click", async (e) => {
  e.preventDefault();

  document.querySelectorAll(".modal, .modal-planos, .bots-cards").forEach(modal => {
    modal.style.display = "none";
  });

  try {
    await signOut(auth);
    showToast("Logout realizado com sucesso!");
    window.location.href = "/index.html";
  } catch (error) {
    console.error(error);
    showToast("Erro ao sair.", "error");
  }
});

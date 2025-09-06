// ---------- FUNÇÃO PARA CRIAR TOOLTIP FIXA NO TOPO DO MODAL ----------
function criarTooltipModal(mensagens, modal) {
    // Cria a barra do tooltip
    let barra = document.createElement("div");
    barra.className = "barra-modal-topo";
    barra.style.position = "absolute";
    barra.style.top = "10px"; // sempre no topo do modal
    barra.style.left = "50%";
    barra.style.transform = "translateX(-50%)";
    barra.style.padding = "12px 20px";
    barra.style.background = "#f9f9f9"; // fundo claro
    barra.style.color = "#333333"; // texto escuro
    barra.style.borderRadius = "12px";
    barra.style.fontSize = "15px";
    barra.style.fontWeight = "500";
    barra.style.opacity = "0";
    barra.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    barra.style.zIndex = "9999";
    barra.style.maxWidth = "90%";
    barra.style.wordWrap = "break-word";
    barra.style.textAlign = "center";
    barra.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
    barra.style.pointerEvents = "none";

    // Span interno para o texto
    let textoSpan = document.createElement("span");
    barra.appendChild(textoSpan);

    // Cria a setinha
    let seta = document.createElement("div");
    seta.style.position = "absolute";
    seta.style.width = "0";
    seta.style.height = "0";
    seta.style.borderLeft = "8px solid transparent";
    seta.style.borderRight = "8px solid transparent";
    seta.style.borderTop = "8px solid #f9f9f9"; // cor combinando com o fundo
    seta.style.bottom = "-8px";
    seta.style.left = "50%";
    seta.style.transform = "translateX(-50%)";

    barra.appendChild(seta);
    modal.appendChild(barra);

    // Ajuste responsivo para celular
    function ajustarParaCelular() {
        if (window.matchMedia("(max-width: 720px)").matches) { // tela pequena
            barra.style.maxWidth = "95%";
            barra.style.fontSize = "16px";
            barra.style.padding = "16px 24px";
        } else { // tela grande
            barra.style.maxWidth = "90%";
            barra.style.fontSize = "15px";
            barra.style.padding = "12px 20px";
        }
    }

    ajustarParaCelular();
    window.addEventListener("resize", ajustarParaCelular);

    const campos = Object.keys(mensagens);

    function mostrarMensagem(id) {
        textoSpan.textContent = mensagens[id];
        barra.style.opacity = "1";
        barra.style.transform = "translateX(-50%) translateY(0)";
    }

    function esconderMensagem() {
        barra.style.opacity = "0";
        barra.style.transform = "translateX(-50%) translateY(-10px)";
    }

    // Adiciona eventos aos inputs
    campos.forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener("focus", () => mostrarMensagem(id));
        input.addEventListener("blur", () => esconderMensagem());
    });
}

// ---------- CAMPOS E MENSAGENS REFORMULADAS ----------
const mensagensModal = {
    nomeBot: "📝 Dê um nome ao seu bot que faça sentido para seus clientes. Ex.: 'Café Express' ou 'Atendimento Café Express'.",
    funcaoBot: "🎯 Explique de forma simples, fale como se fosse o cliente fazendo uma pergunata: informar sobre cardápio, localização ou Informacoes, horarios de atendimento.",
    funcaoBotCustom: "✏️ Caso o que deseja não esteja nas opções, descreva aqui claramente. Ex.: 'Promoções semanais', 'Horário de Funcionamento' ou 'Endereço'.",
    descricaoBot: "💬 Escreva como se falasse com o cliente: 'Olá! 👋 Somos o Café Express, nosso horário é das 08:00 às 16:00.'"
};

// ---------- SELECIONA O MODAL ----------
const modal = document.querySelector(".modal");
if (modal) {
    criarTooltipModal(mensagensModal, modal);
}

// ---------- CAMPO CUSTOM "OUTRA" ----------
const funcaoBot = document.getElementById("funcaoBot");
const funcaoBotCustom = document.getElementById("funcaoBotCustom");

funcaoBot?.addEventListener("change", () => {
    if (funcaoBot.value === "outra") {
        funcaoBotCustom.style.display = "block";
        funcaoBotCustom.required = true;
        setTimeout(() => funcaoBotCustom.focus(), 50);
    } else {
        funcaoBotCustom.style.display = "none";
        funcaoBotCustom.required = false;
    }
});

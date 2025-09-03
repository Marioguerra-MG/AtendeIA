document.addEventListener("DOMContentLoaded", () => {

    // ------------------- SELETORES -------------------
    // Botões
    const btnNovoBot = document.querySelector(".btn-add"); 

    // Seções
    const tabelaBotsSection = document.querySelector(".tabela-bots");
    const cardsSection = document.querySelector(".cards");

    // Menus da sidebar
    const linkBots = document.querySelector(".sidebar li:nth-child(1) a");
    const linkConfiguracoes = document.querySelector(".sidebar li:nth-child(5) a");

    // ------------------- FUNÇÃO BOTÕES -------------------
    function mostrarBotoes(tela) {
        // Esconde todos
        if (btnNovoBot) btnNovoBot.style.display = "none";

        // Mostra dependendo da tela
        if (tela === "bots" && btnNovoBot) {
            btnNovoBot.style.display = "inline-flex";
        }
    }

    // ------------------- NAVEGAÇÃO -------------------
    // Clique Bots
    linkBots?.addEventListener("click", (e) => {
        e.preventDefault();
        if(tabelaBotsSection) tabelaBotsSection.style.display = "block";
        if(cardsSection) cardsSection.style.display = "flex";
        mostrarBotoes("bots");
    });


    // Clique Configurações
    linkConfiguracoes?.addEventListener("click", (e) => {
        e.preventDefault();
        if(tabelaBotsSection) tabelaBotsSection.style.display = "none";
        if(cardsSection) cardsSection.style.display = "none";
        mostrarBotoes("configuracoes");
    });

});

// Abrir modal CRIAR
document.querySelector(".btn-add").addEventListener("click", () => {
    document.getElementById("modal-criar-bot").style.display = "flex";
});

// Fechar modal CRIAR
document.querySelector(".close").addEventListener("click", () => {
    document.getElementById("modal-criar-bot").style.display = "none";
});

// ------------------- MOSTRAR INPUT EXTRA "OUTRA" -------------------
// Criar
document.getElementById("funcaoBot").addEventListener("change", (e) => {
    const customInput = document.getElementById("funcaoBotCustom");
    if (e.target.value === "outra") {
        customInput.style.display = "block";
        customInput.required = true;
    } else {
        customInput.style.display = "none";
        customInput.required = false;
    }
});

// Editar
document.getElementById("editFuncaoBot").addEventListener("change", (e) => {
    const customInput = document.getElementById("editFuncaoBotCustom");
    if (e.target.value === "outra") {
        customInput.style.display = "block";
        customInput.required = true;
    } else {
        customInput.style.display = "none";
        customInput.required = false;
    }
});

// ------------------- SALVAR BOT (CRIAR) -------------------
document.getElementById("form-criar-bot").addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nomeBot").value.trim();
    const funcaoSelect = document.getElementById("funcaoBot");
    let funcao = funcaoSelect.selectedOptions[0].text;

    if (funcaoSelect.value === "outra") {
        funcao = document.getElementById("funcaoBotCustom").value.trim();
    }

    // Fechar modal
    document.getElementById("modal-criar-bot").style.display = "none";
});

// ------------------- SALVAR BOT (EDITAR) -------------------
document.getElementById("form-editar-bot").addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("editNomeBot").value.trim();
    const funcaoSelect = document.getElementById("editFuncaoBot");
    let funcao = funcaoSelect.selectedOptions[0].text;

    if (funcaoSelect.value === "outra") {
        funcao = document.getElementById("editFuncaoBotCustom").value.trim();
    }


    // Fechar modal
    document.getElementById("modal-editar-bot").style.display = "none";
});

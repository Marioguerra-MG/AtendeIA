// Seletores
const modalPlanos = document.getElementById("modalPlanos");
const closeModalPlanos = document.getElementById("closeModalPlanos");
const btnComprarPro = document.getElementById("btnComprarPro");


// Abrir modal (exemplo: ao clicar em botão upgrade)
document.getElementById("abrirModalPlanos")?.addEventListener("click", () => {
    modalPlanos.style.display = "flex";
});

// Fechar modal
closeModalPlanos.addEventListener("click", () => {
    modalPlanos.style.display = "none";
});

// Fechar clicando fora do conteúdo
window.addEventListener("click", (e) => {
    if (e.target === modalPlanos) modalPlanos.style.display = "none";
});

// Ações dos botões
btnComprarPro.addEventListener("click", () => {
    modalPlanos.style.display = "none";
    showToast("Plano Pro selecionado! Redirecionando para pagamento...", "success");
    // Aqui você pode integrar o Stripe, PagSeguro ou outro gateway
});

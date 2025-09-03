// ================= MENU HAMBURGUER =================
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.querySelector(".sidebar");
const icon = menuToggle.querySelector("i");

// Função para abrir/fechar menu
function toggleMenu() {
    sidebar.classList.toggle("active");

    // Mudar ícone
    if (sidebar.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
    } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }
}

// Clicar no hamburguer
menuToggle.addEventListener("click", toggleMenu);

// Fechar ao clicar fora
document.addEventListener("click", (e) => {
    if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)
    ) {
        toggleMenu();
    }
});

document.addEventListener("DOMContentLoaded", () => {

    // Formulário de criação de conta
    const registerForm = document.getElementById("createAccountForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (!name || !email || !password || !confirmPassword) {
                alert("Todos os campos são obrigatórios!");
                return;
            }

            if (password !== confirmPassword) {
                alert("As senhas não coincidem!");
                return;
            }

            try {
                const response = await fetch("http://localhost:5700/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao criar conta");
                }

                alert("Conta criada com sucesso! Agora faça login.");
                window.location.href = "login.html";
            } catch (error) {
                console.error("Erro:", error.message);
                alert(`Erro: ${error.message}`);
            }
        });
    }

    // Formulário de login
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            if (!email || !password) {
                alert("Preencha todos os campos!");
                return;
            }

            try {
                const response = await fetch("http://localhost:5700/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Importante para enviar cookies com a requisição
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Erro ao fazer login");
                }

                window.location.href = "home.html"; // Redireciona para a página principal
            } catch (error) {
                console.error("Erro:", error.message);
                alert(`Erro: ${error.message}`);
            }
        });
    }
});

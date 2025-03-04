document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("#changePassword form");

  form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const currentPassword = document.getElementById("currentPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      if (!currentPassword || !newPassword || !confirmPassword) {
          alert("Preencha todos os campos.");
          return;
      }

      if (newPassword !== confirmPassword) {
          alert("As novas senhas não coincidem.");
          return;
      }

      try {
          // Obtém os dados do usuário logado para pegar o email
          const sessionResponse = await fetch("http://localhost:5700/auth/check-session", {
              method: "GET",
              credentials: "include"
          });

          if (!sessionResponse.ok) {
              throw new Error("Erro ao obter dados do usuário.");
          }

          const userData = await sessionResponse.json();
          const email = userData.user.email;

          if (!email) {
              throw new Error("Email do usuário não encontrado.");
          }

          // Envia a requisição para alterar a senha
          const response = await fetch("http://localhost:5700/auth/reset-password", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify({
                  email,
                  oldPassword: currentPassword,
                  newPassword
              })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Erro ao alterar senha.");
          }

          alert("Senha alterada com sucesso!");
          form.reset();
      } catch (error) {
          console.error("Erro ao alterar senha:", error.message);
          alert(error.message);
      }
  });
});

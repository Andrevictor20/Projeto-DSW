document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector("#deleteAccount form");

  form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const password = document.getElementById("deletePassword").value.trim();

      if (!password) {
          alert("Por favor, digite sua senha para confirmar.");
          return;
      }

      try {
          // Obtém os dados do usuário logado para pegar o ID
          const sessionResponse = await fetch("http://localhost:5700/auth/check-session", {
              method: "GET",
              credentials: "include"
          });

          if (!sessionResponse.ok) {
              throw new Error("Erro ao obter dados do usuário.");
          }

          const sessionData = await sessionResponse.json();
          const userId = sessionData.user?.id;

          if (!userId) {
              throw new Error("ID do usuário não encontrado.");
          }

          // Confirmação do usuário antes de apagar a conta
          if (!confirm("Tem certeza que deseja apagar sua conta? Esta ação é irreversível!")) {
              return;
          }

          // Envia a requisição para deletar a conta
          const response = await fetch(`http://localhost:5700/users/${userId}`, {
              method: "DELETE",
              headers: {
                  "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify({ password })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || "Erro ao apagar a conta.");
          }

          alert("Conta apagada com sucesso! Redirecionando para a página de login...");
          window.location.href = "login.html";
      } catch (error) {
          console.error("Erro ao apagar conta:", error.message);
          alert(error.message);
      }
  });
});

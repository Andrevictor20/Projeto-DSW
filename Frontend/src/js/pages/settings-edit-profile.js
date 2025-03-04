document.addEventListener("DOMContentLoaded", async () => {
  const profilePic = document.querySelector(".main-profile-pic");
  const usernameInput = document.getElementById("username");
  const bioInput = document.getElementById("bio");
  const form = document.querySelector("form");

  let userId = null;

  try {
      // Obtém os dados do usuário logado
      const response = await fetch("http://localhost:5700/auth/check-session", {
          method: "GET",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao buscar perfil.");

      const userData = await response.json();
      console.log("Dados do usuário:", userData); // Depuração

      const user = userData.user || userData; 
      userId = user.id; // Guarda o ID do usuário para edição

      // Preenche os campos com os dados do usuário
      profilePic.style.backgroundImage = `url('${user.profilePicture || 'default-avatar.png'}')`;
      usernameInput.value = user.name || "";
      bioInput.value = user.bio || "";

  } catch (error) {
      console.error("Erro ao carregar perfil:", error.message);
  }

  // Evento para salvar as alterações do perfil
  form.addEventListener("submit", async (event) => {
      event.preventDefault(); // Evita o recarregamento da página

      if (!userId) {
          alert("Usuário não identificado.");
          return;
      }

      const updatedUser = {
          name: usernameInput.value.trim(),
          bio: bioInput.value.trim()
      };

      try {
          const response = await fetch(`http://localhost:5700/users/${userId}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify(updatedUser)
          });

          if (!response.ok) throw new Error("Erro ao atualizar perfil.");

          alert("Perfil atualizado com sucesso!");
          window.location.reload();
      } catch (error) {
          console.error("Erro ao atualizar perfil:", error.message);
          alert("Erro ao atualizar perfil.");
      }
  });
});

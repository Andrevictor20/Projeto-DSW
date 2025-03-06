const API_BASE_URL = "http://localhost:5700";

document.addEventListener("DOMContentLoaded", async () => {
  const profilePic = document.querySelector(".main-profile-pic");
  const usernameInput = document.getElementById("username");
  const bioInput = document.getElementById("bio");
  const form = document.querySelector("form");

  let userId = null;

  try {
      const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
          method: "GET",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao buscar perfil.");

      const userData = await response.json();

      const user = userData.user || userData; 
      userId = user.id;

      profilePic.style.backgroundImage = `url('${user.profilePicture || 'default-avatar.png'}')`;
      usernameInput.value = user.name || "";
      bioInput.value = user.bio || "";

  } catch (error) {
      console.error("Erro ao carregar perfil:", error.message);
  }

  form.addEventListener("submit", async (event) => {
      event.preventDefault(); 

      if (!userId) {
          alert("Usuário não identificado.");
          return;
      }

      const updatedUser = {
          name: usernameInput.value.trim(),
          bio: bioInput.value.trim()
      };

      try {
          const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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

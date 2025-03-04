document.addEventListener("DOMContentLoaded", async () => {
  const profilePic = document.querySelector(".big-profile-pic");
  const profileName = document.querySelector(".profile-card h2");
  const profileBio = document.querySelector(".profile-card p");

  try {
      // Obtém os dados do usuário logado
      const response = await fetch("http://localhost:5700/auth/check-session", {
          method: "GET",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao buscar perfil.");

      const userData = await response.json();
      console.log("Dados do usuário:", userData); // Verifique o formato no console

      // Certifique-se de acessar os dados corretamente
      const user = userData.user || userData; 

      // Preenche os dados do usuário no perfil
      profilePic.style.backgroundImage = `url('${user.profilePicture || 'default-avatar.png'}')`;
      profileName.textContent = user.name || "Usuário Desconhecido";
      profileBio.textContent = user.bio || "Sem biografia disponível.";

  } catch (error) {
      console.error("Erro ao carregar perfil:", error.message);
      profileName.textContent = "Erro ao carregar perfil.";
      profileBio.textContent = "Tente novamente mais tarde.";
  }
});

// Função para logout
async function logout() {
  try {
      const response = await fetch("http://localhost:5700/auth/logout", {
          method: "POST",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao sair.");

      window.location.href = "login.html";
  } catch (error) {
      alert(error.message);
  }
}

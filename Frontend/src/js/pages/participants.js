const API_BASE_URL = "http://localhost:5700";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");

  if (!roomId) {
      alert("ID da sala não encontrado.");
      return;
  }

  console.log("ID da sala recebido:", roomId);

  document.querySelector(".btn-secondary").href = `room.html?id=${roomId}`;

  try {
      const sessionResponse = await fetch(`${API_BASE_URL}/auth/check-session`, {
          credentials: "include" 
      });

      if (!sessionResponse.ok) {
          throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const sessionData = await sessionResponse.json();
      if (!sessionData.user || !sessionData.user.id) {
          throw new Error("Erro ao obter sessão do usuário.");
      }

      const loggedUserId = sessionData.user.id;
      console.log("ID do usuário logado:", loggedUserId);

      const roomResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
          credentials: "include"
      });

      if (!roomResponse.ok) {
          throw new Error("Erro ao carregar informações da sala.");
      }

      const roomData = await roomResponse.json();
      console.log("Informações da sala:", roomData);

      document.querySelector("h1").textContent = `Participantes de ${roomData.name}`;

      const membersResponse = await fetch(`${API_BASE_URL}/rooms/${roomId}/members`, {
          credentials: "include" 
      });

      if (!membersResponse.ok) {
          throw new Error("Erro ao carregar participantes.");
      }

      const members = await membersResponse.json();
      console.log("Participantes:", members);

      const participantList = document.querySelector(".participant-list");
      participantList.innerHTML = ""; 
      members.forEach(member => {
          console.log(`Comparando: ${member.user.id} com ${loggedUserId}`);
          
         
          const profileLink = (member.user.id === loggedUserId) 
              ? "profile.html" 
              : `participantprofile.html?id=${member.user.id}`;

          const div = document.createElement("div");
          div.classList.add("d-flex", "align-items-center", "justify-content-between");

          div.innerHTML = `
              <div class="user-info">
                  <div class="small-profile-pic"></div>
                  <span>${member.user.name}</span>
                  ${member.role === "ADMIN" ? '<span class="admin-highlight">ADMIN</span>' : ""}
              </div>
              <a href="${profileLink}" class="btn btn-light">Acessar Perfil</a>
          `;

          participantList.appendChild(div);
      });

  } catch (error) {
      console.error("Erro:", error.message);
      alert(error.message); 
  }
});

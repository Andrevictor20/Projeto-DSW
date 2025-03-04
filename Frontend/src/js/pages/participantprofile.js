document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  const profileCard = document.querySelector(".profile-card");
  const roomsContainer = document.getElementById("roomparticipation");

  if (!userId) {
      profileCard.innerHTML = "<p>Usuário não encontrado</p>";
      return;
  }

  try {
      // Busca dados do usuário
      const userResponse = await fetch(`http://localhost:5700/users/${userId}`);
      const user = await userResponse.json();

      // Atualiza o perfil
      const profilePic = document.querySelector(".big-profile-pic");
      profilePic.style.backgroundImage = `url('${user.profilePicture || 'default-avatar.png'}')`;
      document.querySelector("h2").textContent = user.name;
      document.querySelector("p").textContent = user.bio || "Sem biografia disponível";

      // Busca salas do usuário
      const roomsResponse = await fetch(`http://localhost:5700/users/${userId}/rooms`);
      const rooms = await roomsResponse.json();

      // Limpa container
      roomsContainer.innerHTML = "";

      // Cria cards das salas
      rooms.forEach(room => {
          const roomCard = document.createElement("div");
          roomCard.className = "room-card bg-primary rounded p-3 text-center mb-3";
          roomCard.innerHTML = `
              <h5>${room.name}</h5>
              <p>Participantes ${room.currentParticipants}/${room.maxParticipants}</p>
              <p>${room.privacy === 'PRIVATE' ? 'Privada' : 'Aberta'}</p>
              <a href="room.html?id=${room.id}" class="btn btn-success mt-2">Entrar</a>
          `;
          roomsContainer.appendChild(roomCard);
      });

  } catch (error) {
      console.error("Erro ao carregar dados:", error);
      profileCard.innerHTML = "<p>Erro ao carregar perfil do usuário</p>";
      roomsContainer.innerHTML = "<p>Erro ao carregar salas de participação</p>";
  }
});
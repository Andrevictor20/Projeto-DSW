const API_BASE_URL = "http://localhost:5700";

document.addEventListener("DOMContentLoaded", async () => {
  try {
      const sessionResponse = await fetch(`${API_BASE_URL}/auth/check-session`, {
          method: "GET",
          credentials: "include"
      });

      if (!sessionResponse.ok) {
          throw new Error("ID do usuário não encontrado. Faça login novamente.");
      }

      const sessionData = await sessionResponse.json();
      const welcomeMessage = document.getElementById("welcome-message");

      if (sessionData.user && sessionData.user.name) {
          welcomeMessage.textContent = `Bem vindo(a), ${sessionData.user.name}!`;
      } else {
          welcomeMessage.textContent = "Bem vindo(a)!";
      }

      const roomsResponse = await fetch(`${API_BASE_URL}/rooms/user`, {
          method: "GET",
          credentials: "include"
      });

      if (!roomsResponse.ok) {
          throw new Error("Erro ao buscar salas do usuário.");
      }

      const rooms = await roomsResponse.json();
      const roomsContainer = document.getElementById("rooms-container");

      if (!rooms || rooms.length === 0) {
          roomsContainer.innerHTML = `<p>Você não participa de nenhuma sala ainda. Crie ou entre em uma sala existente!</p>`;
          return;
      }

      rooms.forEach(room => {
          const roomCard = document.createElement("div");
          roomCard.className = "col d-flex justify-content-center";

          roomCard.innerHTML = `
              <a href="room.html?id=${room.id}" class="text-decoration-none w-100">
                  <div class="card bg-primary text-white mb-3">
                      <div class="card-body">
                          <h5 class="card-title">${room.name}</h5>
                          <p class="card-text">Participantes: ${room.currentParticipants}/${room.maxParticipants}</p>
                      </div>
                  </div>
              </a>
          `;

          roomsContainer.appendChild(roomCard);
      });

  } catch (error) {
      console.error("Erro ao buscar usuário ou salas:", error.message);
  }
});

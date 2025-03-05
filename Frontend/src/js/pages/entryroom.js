document.addEventListener("DOMContentLoaded", async () => {
  const roomsContainer = document.getElementById("rooms");

  try {
      // Obtém as salas disponíveis
      const response = await fetch("http://localhost:5700/rooms", {
          method: "GET",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao buscar as salas.");

      const rooms = await response.json();

      // Limpa o container antes de adicionar novos elementos
      roomsContainer.innerHTML = "";

      rooms.forEach(room => {
          const roomItem = document.createElement("div");
          roomItem.className = "list-group-item d-flex justify-content-between align-items-center bg-primary text-white p-3 rounded mb-2";

          // Conta o número de participantes na sala
          const currentParticipants = room.participants ? room.participants.length : 0;

          // Verifica se a sala é privada ou aberta
          if (room.privacy === "OPEN") {
              // Sala aberta -> Botão direto para entrar
              roomItem.innerHTML = `
                  <span>${room.name}</span>
                  <div class="room-info d-flex gap-2">
                      <span class="bg-light text-dark p-2 rounded">Participantes ${currentParticipants}/${room.maxParticipants}</span>
                      <span class="bg-light text-dark p-2 rounded">Status: Aberta</span>
                      <a class="btn btn-info btn-sm" onclick="enterOpenRoom('${room.id}')">Entrar</a>
                  </div>
              `;
          } else {
              // Sala privada -> Campo para senha
              roomItem.innerHTML = `
                  <span>${room.name}</span>
                  <div class="room-info d-flex gap-2">
                      <span class="bg-light text-dark p-2 rounded">Participantes ${currentParticipants}/${room.maxParticipants}</span>
                      <span class="bg-light text-dark p-2 rounded">Status: Privada</span>
                      <input type="password" class="form-control form-control-sm" placeholder="Digite a senha" id="password-${room.id}">
                      <button class="btn btn-info btn-sm" onclick="enterPrivateRoom('${room.id}')">Entrar</button>
                  </div>
              `;
          }

          roomsContainer.appendChild(roomItem);
      });

  } catch (error) {
      console.error("Erro ao carregar as salas:", error.message);
      roomsContainer.innerHTML = `<p class="text-center">Erro ao carregar as salas.</p>`;
  }
});

// Função para validar senha e entrar na sala privada
async function enterPrivateRoom(roomId) {
  const passwordInput = document.getElementById(`password-${roomId}`);
  const password = passwordInput.value.trim();

  if (!password) {
      alert("Por favor, insira a senha para entrar na sala.");
      return;
  }

  try {
      const response = await fetch(`http://localhost:5700/rooms/${roomId}/join`, {
          method: "POST",
          credentials: "include",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ password })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao entrar na sala");
      }

      // Redireciona para a sala caso a senha esteja correta
      window.location.href = `room.html?id=${roomId}`;
  } catch (error) {
      alert(error.message);
      passwordInput.value = "";
  }
}

// Função para entrar em sala aberta
async function enterOpenRoom(roomId) {
  try {
    const response = await fetch(`http://localhost:5700/rooms/${roomId}/join`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro ao entrar na sala");
    }

    // Redireciona para a sala
    window.location.href = `room.html?id=${roomId}`;
  } catch (error) {
    alert(error.message);
  }
}

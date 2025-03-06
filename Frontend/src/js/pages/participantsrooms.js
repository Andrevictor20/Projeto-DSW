const API_BASE_URL = "http://localhost:5700";

document.addEventListener("DOMContentLoaded", async () => {
    const roomsContainer = document.getElementById("roomparticipation");
    if (!roomsContainer) {
        console.error("Container roomparticipation não encontrado");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/rooms`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

        const rooms = await response.json();
        roomsContainer.innerHTML = "";

        rooms.forEach(room => {
            const roomElement = document.createElement("div");
            roomElement.className = "col-md-6 col-lg-6";
            
            roomElement.innerHTML = `
                <div class="room-card bg-primary rounded p-3 text-center">
                    <h5>${room.name}</h5>
                    <p>Participantes ${room.currentParticipants}/${room.maxParticipants}</p>
                    <p>${room.privacy === 'PRIVATE' ? 'Privada' : 'Aberta'}</p>
                </div>
            `;

            roomsContainer.appendChild(roomElement);
        });

    } catch (error) {
        console.error("Erro ao carregar as salas:", error);
        roomsContainer.innerHTML = `<p class="text-center">Erro ao carregar as salas: ${error.message}</p>`;
    }
});
const API_BASE_URL = "http://localhost:5700";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const roomName = document.getElementById("roomName").value.trim();
      const participantNumber = parseInt(document.getElementById("participantNumber").value, 10);
      const roomType = document.querySelector('input[name="roomType"]:checked').value;
      const roomPassword = document.getElementById("roomPassword").value.trim();

      if (!roomName || isNaN(participantNumber) || participantNumber < 1) {
          alert("Por favor, preencha todos os campos corretamente.");
          return;
      }

      const roomData = {
          name: roomName,
          maxParticipants: participantNumber,
          privacy: roomType.toUpperCase(),
      };

      if (roomType === "private" && roomPassword) {
          roomData.password = roomPassword;
      }

      try {
          const response = await fetch(`${API_BASE_URL}/rooms`, {
              method: "POST",
              credentials: "include",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify(roomData)
          });

          const responseData = await response.json();

          if (!response.ok) {
              throw new Error(responseData.error || "Erro ao criar a sala.");
          }

          alert("Sala criada com sucesso!");
          window.location.href = "home.html";

      } catch (error) {
          console.error("Erro ao criar a sala:", error.message);
          alert(error.message);
      }
  });

  function togglePasswordField() {
      const passwordField = document.getElementById("roomPassword").parentElement;
      const privateRoomChecked = document.getElementById("privateRoom").checked;

      if (privateRoomChecked) {
          passwordField.style.display = "block";
      } else {
          document.getElementById("roomPassword").value = ""; 
          passwordField.style.display = "none";
      }
  }

  togglePasswordField();
  document.getElementById("privateRoom").addEventListener("change", togglePasswordField);
  document.getElementById("openRoom").addEventListener("change", togglePasswordField);
});

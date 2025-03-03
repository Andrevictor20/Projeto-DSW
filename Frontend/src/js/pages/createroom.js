document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const roomName = document.getElementById("roomName").value.trim();
      const participantNumber = parseInt(document.getElementById("participantNumber").value, 10);
      const roomType = document.querySelector('input[name="roomType"]:checked').value;
      const roomPassword = document.getElementById("roomPassword").value.trim();

      // Validação básica
      if (!roomName || isNaN(participantNumber) || participantNumber < 1) {
          alert("Por favor, preencha todos os campos corretamente.");
          return;
      }

      // Monta o corpo da requisição
      const roomData = {
          name: roomName,
          maxParticipants: participantNumber,
          privacy: roomType.toUpperCase(),
      };

      // Adiciona a senha apenas se a sala for privada e a senha for informada
      if (roomType === "private" && roomPassword) {
          roomData.password = roomPassword;
      }

      try {
          const response = await fetch("http://localhost:5700/rooms", {
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
          window.location.href = "home.html"; // Redireciona para a página inicial

      } catch (error) {
          console.error("Erro ao criar a sala:", error.message);
          alert(error.message);
      }
  });

  // Função para mostrar/esconder o campo de senha
  function togglePasswordField() {
      const passwordField = document.getElementById("roomPassword").parentElement;
      const privateRoomChecked = document.getElementById("privateRoom").checked;

      if (privateRoomChecked) {
          passwordField.style.display = "block";
      } else {
          document.getElementById("roomPassword").value = ""; // Limpa o campo de senha ao esconder
          passwordField.style.display = "none";
      }
  }

  // Garante que a exibição do campo de senha esteja correta ao carregar a página
  togglePasswordField();
  document.getElementById("privateRoom").addEventListener("change", togglePasswordField);
  document.getElementById("openRoom").addEventListener("change", togglePasswordField);
});

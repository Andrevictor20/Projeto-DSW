document.addEventListener('DOMContentLoaded', function () {
  const dropdownToggle = document.getElementById('optionsDropdown');
  const dropdownMenu = dropdownToggle.nextElementSibling;

  dropdownToggle.addEventListener('click', function () {
      dropdownMenu.classList.toggle('show');
  });

  window.addEventListener('click', function (event) {
      if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
          dropdownMenu.classList.remove('show');
      }
  });

  function sairDaSala(roomId) {
    fetch(`http://localhost:5700/rooms/${roomId}/leave`, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then(response => {
      if (response.ok) {
        alert('Você saiu da sala com sucesso.');
        // Atualiza a lista de salas antes de redirecionar
        fetch('http://localhost:5700/rooms/user', {
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          // Atualiza a lista de salas em home.html
          window.localStorage.setItem('myRooms', JSON.stringify(data));
          window.location.href = 'home.html'; // Redireciona para a página inicial
        })
        .catch(error => {
          window.location.href = 'home.html'; // Redireciona mesmo em caso de erro
        });
      } else {
        response.json().then(data => {
          alert(data.error || 'Erro ao sair da sala.');
        });
      }
    })
    .catch(error => {
      alert('Erro ao sair da sala.');
    });
  }

  document.getElementById('leaveRoomButton').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id'); // Extrai o ID da sala do parâmetro de consulta
    sairDaSala(roomId);
  });
});
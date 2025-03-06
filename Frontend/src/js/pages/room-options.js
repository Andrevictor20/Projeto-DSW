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

  function getUserIdFromCookies() {
    const cookieString = document.cookie;
    const cookies = cookieString.split('; ');
    const sessionCookie = cookies.find(cookie => cookie.startsWith('session='));
    return sessionCookie ? sessionCookie.split('=')[1] : null;
  }

  function leaveRoom(roomId) {
    fetch(`http://localhost:5700/rooms/${roomId}/members`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(response => response.json())
    .then(members => {
      const currentUserId = window.localStorage.getItem('userId');
      const currentUser = members.find(member => member.user.id === currentUserId);

      if (!currentUser) {
        alert('Você não é um membro desta sala.');
        return;
      }

      if (currentUser.role === 'ADMIN') {
        alert('Administradores não podem sair da sala.');
        return;
      }

      if (currentUser.role === 'MEMBER') {
        fetch(`http://localhost:5700/rooms/${roomId}/leave`, {
          method: 'DELETE',
          credentials: 'include'
        })
        .then(response => {
          if (response.ok) {
            alert('Você saiu da sala com sucesso.');
            fetch('http://localhost:5700/rooms/user', {
              credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
              window.localStorage.setItem('myRooms', JSON.stringify(data));
              window.location.href = 'home.html';
            })
            .catch(error => {
              window.location.href = 'home.html';
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
    })
    .catch(error => {
      alert('Erro ao verificar permissões.');
    });
  }

  async function deleteRoom(roomId) {
    try {
        console.log(`Tentando excluir a sala com ID: ${roomId}`);
        const membersResponse = await fetch(`http://localhost:5700/rooms/${roomId}/members`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const members = await membersResponse.json();
        const currentUserId = window.localStorage.getItem('userId');
        const currentUser = members.find(member => member.user.id === currentUserId);

        if (!currentUser || currentUser.role !== 'ADMIN') {
            alert('Somente Administradores podem excluir uma sala.');
            return;
        }

        const response = await fetch(`http://localhost:5700/rooms/${roomId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const text = await response.text(); // Lê a resposta para debug
        console.log(`Resposta do servidor: ${text}`);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${text}`);
        }

        alert('Sala excluída com sucesso!');
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Erro ao excluir sala:', error);
        alert(error.message);
    }
  }

  document.getElementById('leaveRoomButton').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id'); 
    leaveRoom(roomId);
  });

  function handleDeleteRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id'); 

    if (!roomId) {
        alert('Erro: ID da sala não encontrado.');
        return;
    }

    if (confirm('Tem certeza que deseja excluir esta sala? Essa ação é irreversível!')) {
        deleteRoom(roomId);
    }
  }

  const deleteRoomButton = document.getElementById('deleteRoomButton');
  if (deleteRoomButton) {
      deleteRoomButton.removeEventListener('click', handleDeleteRoom);
      deleteRoomButton.addEventListener('click', handleDeleteRoom);
  }
});

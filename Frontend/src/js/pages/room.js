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
});

async function checkSession() {
    try {
        const response = await fetch('http://localhost:5700/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Sessão inválida');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        throw error;
    }
}

async function createCompetitorBoxes(roomId) {
    const container = document.querySelector('.container');
    try {
        await checkSession();

        const response = await fetch(`http://localhost:5700/rooms/${roomId}/photos`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Falha ao buscar fotos');
        }
        const data = await response.json();
        const photos = data.photos;
        photos.forEach((photo, i) => {
            const competitorBox = document.createElement('div');
            competitorBox.className = 'competitor-box text-white';
            const imagePath = '/Backend/' + photo.filePath;
            competitorBox.innerHTML = `
                <a href="explorephoto.html">
                    <img src="${imagePath}" alt="Descrição da foto" class="competitor-image">
                </a>
                <div class="vote-count">Votos: 0</div>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-light btn-vote">VOTAR</button>
                </div>
            `;
            container.appendChild(competitorBox);
        });
    } catch (error) {
        console.error('Erro ao buscar fotos:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'text-white';
        errorMessage.textContent = 'Erro ao carregar as fotos da sala.';
        container.appendChild(errorMessage);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("id"); // Pegando o ID da sala

    if (roomId) {
        try {
            // Busca os detalhes da sala na API
            const response = await fetch(`http://localhost:5700/rooms/${roomId}`);
            if (!response.ok) {
                throw new Error('Sala não encontrada');
            }
            const roomData = await response.json();

            // Atualiza o título da sala com o nome real
            const welcomeTitle = document.querySelector('h1.text-white');
            if (welcomeTitle) {
                welcomeTitle.textContent = `Bem vindo à sala ${roomData.name}!`;
            }

            const participantsLink = document.querySelector('a[href="participants.html"]');
            if (participantsLink) {
                participantsLink.href = `participants.html?roomId=${roomId}`;
            }

            const uploadPhotoLink = document.querySelector('a[href="uploadphoto.html"]');
            if (uploadPhotoLink) {
                uploadPhotoLink.href = `uploadphoto.html?roomId=${roomId}`;
            }
        } catch (error) {
            console.error('Erro ao buscar detalhes da sala:', error);
            // Em caso de erro, mostra o ID da sala como fallback
            const welcomeTitle = document.querySelector('h1.text-white');
            if (welcomeTitle) {
                welcomeTitle.textContent = `Bem vindo à sala ${roomId}!`;
            }
        }

        createCompetitorBoxes(roomId);
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  if (roomId) {
    const uploadPhotoLink = document.getElementById('uploadPhotoLink');
    if (uploadPhotoLink) {
      uploadPhotoLink.href = `uploadphoto.html?roomId=${roomId}`;
    }
  }
});

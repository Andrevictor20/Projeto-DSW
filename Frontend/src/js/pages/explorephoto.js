document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const photoId = urlParams.get('id');
  const sessionId = urlParams.get('sessionId'); 
  const roomId = urlParams.get('roomId');

  if (!photoId) {
    alert('ID da foto não encontrado na URL.');
    return;
  }

  try {
    const [photoResponse, votesResponse] = await Promise.all([
      fetch(`http://localhost:5700/photos/${photoId}`),
      fetch(`http://localhost:5700/rooms/${roomId}/photos/votes`)
    ]);

    const photoData = await photoResponse.json();
    const votesData = await votesResponse.json();

    if (!photoResponse.ok || !votesResponse.ok) {
      throw new Error('Erro ao buscar os detalhes da foto ou a contagem de votos.');
    }

    const photo = photoData;
    const photosWithVotes = votesData.photos;
    const photoWithVotes = photosWithVotes.find(p => p.id === photoId);

    if (!photo || !photo.filePath) {
      alert('Foto não encontrada ou inválida.');
      return;
    }

    if (!photo.user) {
      photo.user = { 
        id: 'default', 
        name: 'Unknown User',
        profilePic: '/images/default-profile.jpg'
      };
    }

    document.querySelector('.photo').src = `http://localhost:5700/${photo.filePath}`;
    document.querySelector('.small-profile-pic').style.backgroundImage = `url('${photo.user.profilePic || '/images/default-profile.jpg'}')`;
    document.querySelector('h1').textContent = photo.user.name;
    document.querySelector('.vote-section span').textContent = `Votos: ${photoWithVotes?._count?.votes || 0}`;
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar os detalhes da foto.');
  }

  function redirectToRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    if (roomId) {
      window.location.href = `http://localhost:5600/src/pages/room.html?id=${roomId}`;
    } else {
      alert('Sala não encontrada. Certifique-se de que você está acessando a página corretamente.');
    }
  }

  const voltarBtn = document.getElementById('voltarBtn');
  if (voltarBtn) {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    if (roomId) {
      voltarBtn.href = `http://localhost:5600/src/pages/room.html?id=${roomId}`;
    }
    voltarBtn.addEventListener('click', redirectToRoom);
  }
});
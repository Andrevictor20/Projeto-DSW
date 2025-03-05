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
        const response = await fetch(`http://localhost:5700/photos/${photoId}`);
        const data = await response.json();
        const photo = data;

        if (!response.ok) {
            throw new Error('Erro ao buscar os detalhes da foto.');
        }

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

        // Preencher os elementos HTML com os dados da foto
        document.querySelector('.photo').src = `http://localhost:5700/${photo.filePath}`;
        document.querySelector('.small-profile-pic').style.backgroundImage = `url('${photo.user.profilePic || '/images/default-profile.jpg'}')`;
        document.querySelector('h1').textContent = photo.user.name || 'Unknown User';
        document.querySelector('.vote-section span').textContent = `${photo.votes || 0} Votos`;
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar os detalhes da foto.');
    }

    function redirectToRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        if (roomId) {
            window.location.href = `http://localhost:5500/Frontend/src/pages/room.html?id=${roomId}`;
        } else {
            alert('Sala não encontrada. Certifique-se de que você está acessando a página corretamente.');
        }
    }

    const voltarBtn = document.getElementById('voltarBtn');
    if (voltarBtn) {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('roomId');
        if (roomId) {
            voltarBtn.href = `http://localhost:5500/Frontend/src/pages/room.html?id=${roomId}`;
        }
        voltarBtn.addEventListener('click', redirectToRoom);
    }

    // Adicionar funcionalidade de votação
    const voteButton = document.querySelector('.vote-section button');
    voteButton.addEventListener('click', async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('sessionId'); // Extract the sessionId parameter from the URL
            const response = await fetch(`/photos/${photoId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: sessionId }), // Use the extracted sessionId
            });

            if (!response.ok) {
                throw new Error('Erro ao votar na foto.');
            }

            const result = await response.json();
            document.querySelector('.vote-section span').textContent = `${result.votes} Votos`;
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao votar na foto.');
        }
    });
});
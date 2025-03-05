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
    const container = document.querySelector('.photos-container');
    try {
        await checkSession();

        // Busca as fotos e a contagem de votos
        const [photosResponse, userVotesResponse] = await Promise.all([
            fetch(`http://localhost:5700/rooms/${roomId}/photos/votes`, {
                credentials: 'include'
            }),
            fetch(`http://localhost:5700/rooms/${roomId}/user-votes`, {
                credentials: 'include'
            })
        ]);

        if (!photosResponse.ok || !userVotesResponse.ok) {
            throw new Error('Falha ao buscar fotos e votos');
        }

        const [photosData, userVotesData] = await Promise.all([
            photosResponse.json(),
            userVotesResponse.json()
        ]);

        const photos = photosData.photos;
        const userVotes = userVotesData.votes;

        // Clear existing content before adding new photos
        container.innerHTML = '';

        photos.forEach((photo) => {
            const competitorBox = document.createElement('div');
            competitorBox.className = 'competitor-box text-white';
            const imagePath = '/Backend/' + photo.filePath;
            const hasVoted = userVotes.includes(photo.id);
            competitorBox.innerHTML = `
                <a href="explorephoto.html?id=${photo.id}&roomId=${roomId}">
                    <img src="${imagePath}" alt="Descrição da foto" class="competitor-image">
                </a>
                <div class="vote-count" data-photo-id="${photo.id}">Votos: ${photo._count.votes}</div>
                <div class="d-flex justify-content-between">
                    <button class="btn btn-light btn-vote" data-photo-id="${photo.id}" ${hasVoted ? 'disabled' : ''}>${hasVoted ? 'Votado' : 'VOTAR'}</button>
                </div>
            `;
            if (hasVoted) {
                const voteButton = competitorBox.querySelector('.btn-vote');
                voteButton.classList.add('btn-secondary');
                voteButton.classList.remove('btn-light');
            }
            container.appendChild(competitorBox);
        });

        // Add event listeners to vote buttons after creating the boxes
        setupVoteEventListeners(roomId);
    } catch (error) {
        console.error('Erro ao buscar fotos:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'text-white';
        errorMessage.textContent = 'Erro ao carregar as fotos da sala.';
        container.appendChild(errorMessage);
    }
}

function updateVoteCount(photoId, increment = true) {
    const voteCountElement = document.querySelector(`.vote-count[data-photo-id="${photoId}"]`);
    if (voteCountElement) {
        const currentCount = parseInt(voteCountElement.textContent.match(/\d+/)[0]);
        const newCount = increment ? currentCount + 1 : Math.max(currentCount - 1, 0);
        voteCountElement.textContent = `Votos: ${newCount}`;
    }
}

// Função para votar em uma foto
async function vote(roomId, photoId) {
    try {
        const response = await fetch(`http://localhost:5700/rooms/${roomId}/vote/${photoId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Erro ao votar');
            } catch {
                throw new Error(errorText || 'Erro desconhecido ao votar');
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao votar:', error);
        throw error;
    }
}

async function removeVote(userId, photoId) {
    try {
        const response = await fetch('/rooms/:roomId/remove-vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, photoId }),
        });
        if (!response.ok) {
            throw new Error('Erro ao remover o voto');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

function setupVoteEventListeners(roomId) {
    const voteButtons = document.querySelectorAll('.btn-vote');
    voteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const photoId = event.target.dataset.photoId;
            const originalText = event.target.textContent;
            event.target.disabled = true;
            event.target.textContent = 'Processando...';
            
            try {
                // Remover o voto anterior antes de criar um novo
                const previousVoteButton = document.querySelector('.btn-vote:not([data-photo-id="' + photoId + '"])');
                if (previousVoteButton && previousVoteButton.classList.contains('btn-secondary')) {
                    previousVoteButton.disabled = false;
                    previousVoteButton.classList.remove('btn-secondary');
                    previousVoteButton.classList.add('btn-light');
                    previousVoteButton.textContent = 'VOTAR';
                    updateVoteCount(previousVoteButton.dataset.photoId, false);
                }

                const data = await vote(roomId, photoId);
                updateVoteCount(photoId);

                // Disable the button after voting
                event.target.disabled = true;
                event.target.classList.add('btn-secondary');
                event.target.classList.remove('btn-light');
                event.target.textContent = 'Votado';
                reloadPageOnVote();
            } catch (error) {
                event.target.disabled = false;
                event.target.textContent = originalText;
                alert(error.message);
            }
        });
    });
}

function reloadPageOnVote() {
    window.location.reload();
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("id");

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

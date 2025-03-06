document.addEventListener("DOMContentLoaded", async () => {
  const profilePic = document.querySelector(".big-profile-pic");
  const profileName = document.querySelector(".profile-card h2");
  const profileBio = document.querySelector(".profile-card p");

  try {
      const response = await fetch("http://localhost:5700/auth/check-session", {
          method: "GET",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao buscar perfil.");

      const userData = await response.json();
      console.log("Dados do usuário:", userData); 

      const user = userData.user || userData; 

      profilePic.style.backgroundImage = `url('${user.profilePicture || 'default-avatar.png'}')`;
      profileName.textContent = user.name || "Usuário Desconhecido";
      profileBio.textContent = user.bio || "Sem biografia disponível.";

  } catch (error) {
      console.error("Erro ao carregar perfil:", error.message);
      profileName.textContent = "Erro ao carregar perfil.";
      profileBio.textContent = "Tente novamente mais tarde.";
  }
});

async function logout() {
  try {
      const response = await fetch("http://localhost:5700/auth/logout", {
          method: "POST",
          credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao sair.");

      window.location.href = "login.html";
  } catch (error) {
      alert(error.message);
  }
}

async function fetchAndDisplayUserPhotos() {
    try {
        const sessionResponse = await fetch('http://localhost:5700/auth/check-session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!sessionResponse.ok) throw new Error('Erro ao buscar sessão.');

        const sessionData = await sessionResponse.json();
        const userId = sessionData.user.id;

        const response = await fetch(`http://localhost:5700/users/${userId}/photos`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Erro ao buscar fotos.');

        const photos = await response.json();
        const photoContainer = document.getElementById('photo-container');

        photoContainer.innerHTML = `
            <h3 class="mt-5">Minhas fotos</h3>
            <div class="row justify-content-center">
            </div>
        `;

        if (!Array.isArray(photos.photos)) {
            console.error('Photos não é um array:', photos);
            return;
        }

        photos.photos.forEach(photo => {
            const photoCol = document.createElement('div');
            photoCol.className = 'col-md-4 mb-4';
            photoCol.innerHTML = `
                <img src="http://localhost:5700/${photo.filePath}" alt="${photo.name}" class="img-fluid rounded mx-auto d-block" style="margin: 10px;">
            `;
            photoContainer.querySelector('.row').appendChild(photoCol);
        });
    } catch (error) {
        console.error('Erro ao carregar fotos:', error.message);
        const photoContainer = document.getElementById('photo-container');
        photoContainer.innerHTML = '<p class="text-danger">Erro ao carregar fotos. Tente novamente mais tarde.</p>';
    }
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayUserPhotos);

document.addEventListener('DOMContentLoaded', function() {
  const uploadButton = document.querySelector('.btn-success');
  const nameInput = document.querySelector('.name-input');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const previewContainer = document.querySelector('.upload-container');
  const previewImage = document.createElement('img');
  previewImage.style.maxWidth = '100%';
  previewImage.style.maxHeight = '200px';
  previewImage.style.display = 'none';
  previewImage.style.marginBottom = '10px';
  previewContainer.insertBefore(previewImage, previewContainer.firstChild);

  fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        previewContainer.querySelector('.alert').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  uploadButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const name = nameInput.value.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');

    if (!file || !name) {
      alert('Por favor, selecione uma foto e insira um nome.');
      return;
    }

    if (!roomId) {
      alert('Sala não encontrada. Certifique-se de que você está acessando a página corretamente.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    // Adicionar indicador de carregamento
    uploadButton.disabled = true;
    uploadButton.textContent = 'Enviando...';

    try {
      const response = await fetch(`http://localhost:5700/rooms/${roomId}/photos`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        timeout: 30000 // Aumentar o timeout para 30 segundos
      });

      if (response.ok) {
        alert('Foto enviada com sucesso!');
        redirectToRoom();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao enviar a foto.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao enviar a foto.');
    } finally {
      // Restaurar o botão após o envio
      uploadButton.disabled = false;
      uploadButton.textContent = 'Upload';
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');

  document.querySelector('.upload-container').addEventListener('click', (event) => {
    if (event.target === previewContainer || event.target === previewImage || event.target === previewContainer.querySelector('.alert')) {
      fileInput.click();
    }
  });

  function redirectToRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    window.location.href = `http://localhost:5500/Frontend/src/pages/room.html?id=${roomId}`;
  }

  const voltarBtn = document.getElementById('voltarBtn');
  if (voltarBtn && roomId) {
    voltarBtn.href = `http://localhost:5500/Frontend/src/pages/room.html?id=${roomId}`;
  }
  voltarBtn.addEventListener('click', redirectToRoom);
});
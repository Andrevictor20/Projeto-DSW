function togglePasswordField() {
  const isPrivate = document.getElementById('privateRoom').checked;
  document.getElementById('roomPassword').disabled = !isPrivate;
}
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

function createCompetitorBoxes(count) {
    const container = document.querySelector('.container'); // Seleciona o container onde os boxes serão adicionados
    for (let i = 1; i <= count; i++) {
        const competitorBox = document.createElement('div');
        competitorBox.className = 'competitor-box text-white';
        competitorBox.innerHTML = `
            <img src="../assets/images/image${i}.jpeg" alt="Descrição da foto" class="competitor-image">
            <div class="vote-count">Votos: 0</div>
            <button class="btn btn-light btn-vote">VOTAR</button>
            <a href="explorephoto.html" class="btn btn-light btn-explore">EXPLORAR</a>
        `;
        container.appendChild(competitorBox); 
    }
}

createCompetitorBoxes(6); 
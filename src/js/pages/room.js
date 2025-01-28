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
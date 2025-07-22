document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
      hamburger.onclick = function() {
        this.classList.toggle('open');
        navMenu.classList.toggle('open');
      };
    }
  });
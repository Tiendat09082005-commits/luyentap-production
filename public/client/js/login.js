document.addEventListener("DOMContentLoaded", function() {
  // Toggle password visibility
  var toggleBtn = document.querySelector('.toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      var input = document.getElementById('password');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  }
});

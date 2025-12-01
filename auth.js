// Simple authentication using localStorage

document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  // Register a new user
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("regName").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;

      localStorage.setItem("user", JSON.stringify({ name, email, password }));
      alert("Registration successful! Please log in.");
      window.location.href = "login.html";
    });
  }

  // Login existing user
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const user = JSON.parse(localStorage.getItem("user"));

      if (user && user.email === email && user.password === password) {
        alert(`Welcome back, ${user.name}!`);
        window.location.href = "dashboard.html";
      } else {
        alert("Invalid email or password. Try again.");
      }
    });
  }
});

function togglePassword(btn) {
  const input = btn.closest(".input-wrap").querySelector("input");
  input.type = input.type === "password" ? "text" : "password";
}
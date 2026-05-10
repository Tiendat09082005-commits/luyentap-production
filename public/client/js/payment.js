var currentMethod = null;

function setHiddenInput(name, value) {
  var paymentForm = document.getElementById("paymentForm");
  if (!paymentForm) return;

  var input = paymentForm.querySelector('input[name="' + name + '"]');
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    paymentForm.appendChild(input);
  }

  input.value = value;
}

function togglePayment(method) {
  var options = ["card", "bank", "ewallet", "cod"];
  var totalPrice = window.__TOTAL_PRICE__ || 0;

  if (currentMethod === method) {
    var currentOption = document.getElementById("opt-" + method);
    var currentRadio = document.getElementById("radio-" + method);
    if (currentOption) currentOption.classList.remove("active");
    if (currentRadio) currentRadio.classList.remove("checked");
    currentMethod = null;

    var resetButton = document.getElementById("btn-pay");
    if (resetButton) {
      resetButton.textContent = "Thanh toán " + totalPrice.toLocaleString("vi-VN") + "đ";
    }

    setHiddenInput("paymentMethod", "");
    setHiddenInput("paymentChannel", "");
    return;
  }

  options.forEach(function(option) {
    var optionEl = document.getElementById("opt-" + option);
    var radioEl = document.getElementById("radio-" + option);
    if (optionEl) optionEl.classList.remove("active");
    if (radioEl) radioEl.classList.remove("checked");
  });

  var targetOption = document.getElementById("opt-" + method);
  var targetRadio = document.getElementById("radio-" + method);
  if (targetOption) targetOption.classList.add("active");
  if (targetRadio) targetRadio.classList.add("checked");
  currentMethod = method;

  var payButton = document.getElementById("btn-pay");
  if (payButton) {
    payButton.textContent = method === "cod"
      ? "Mua ngay"
      : "Thanh toán " + totalPrice.toLocaleString("vi-VN") + "đ";
  }

  if (method === "cod") {
    setHiddenInput("paymentMethod", "cod");
    setHiddenInput("paymentChannel", "COD");
    return;
  }

  setHiddenInput("paymentMethod", "vnpay");
  setHiddenInput("paymentChannel", method === "bank" ? "Bank Transfer" : "E-Wallet");
}

function selectBank(el) {
  document.querySelectorAll(".bank-item").forEach(function(button) {
    button.classList.remove("selected");
  });
  el.classList.add("selected");
  setHiddenInput("paymentMethod", "vnpay");
  setHiddenInput("paymentChannel", el.textContent.trim() || "Bank Transfer");
}

function selectWallet(el) {
  document.querySelectorAll(".ewallet-item").forEach(function(button) {
    button.classList.remove("selected");
  });
  el.classList.add("selected");
  setHiddenInput("paymentMethod", "vnpay");
  setHiddenInput("paymentChannel", el.textContent.trim() || "E-Wallet");
}

document.addEventListener("DOMContentLoaded", function() {
  togglePayment("cod");
});

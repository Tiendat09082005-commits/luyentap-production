// ===== STEP 1 → STEP 2: GỬI OTP =====

document.getElementById("forgotForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var email = document.getElementById("email").value.trim();
  if (!email) {
    Swal.fire({ icon: 'warning', text: 'Vui lòng nhập email' });
    return;
  }

  // Cập nhật UI trước khi gọi API
  document.getElementById("otp-email-display").textContent = email;
  document.getElementById("hiddenEmail").value = email;
  document.getElementById("step-email").style.display = "none";
  document.getElementById("step-otp").style.display = "flex";

  // Reset & khóa tất cả ô OTP
  otpBoxes.forEach(function (box) {
    box.value = "";
    box.disabled = true;
  });
  syncOtp();

  var otpStatus = document.getElementById("otp-status");
  if (otpStatus) otpStatus.textContent = "Đang gửi OTP...";

  document.getElementById("btnResend").disabled = true;

  fetch("/user/forgot-password/send-otp", {
    method: "POST",
    headers: window.withCsrfHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email: email }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        Swal.fire({ icon: 'error', text: data.message });
        goToEmailStep();
        if (otpStatus) otpStatus.textContent = "";
        return;
      }

      // Mở khóa ô OTP khi gửi thành công
      otpBoxes.forEach(function (box) {
        box.disabled = false;
      });

      if (otpStatus) otpStatus.textContent = "OTP đã được gửi đến email của bạn";
      otpBoxes[0].focus();

      resetResendButton();
      startCountdown();
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({ icon: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại' });
      goToEmailStep();
      if (otpStatus) otpStatus.textContent = "";
    });
});


// ===== OTP INPUT: dùng keydown để kiểm soát hoàn toàn =====

var otpBoxes = document.querySelectorAll(".otp-box");

function syncOtp() {
  var val = "";
  otpBoxes.forEach(function (box) {
    val += box.value;
  });
  document.getElementById("otpValue").value = val;
}

otpBoxes.forEach(function (box, i) {

  // Select text khi focus để gõ đè dễ hơn
  box.addEventListener("focus", function () {
    setTimeout(function () { box.select(); }, 0);
  });

  // input event: dùng duy nhất để nhận giá trị — hoạt động đúng cả desktop lẫn mobile
  box.addEventListener("input", function () {
    // Chỉ lấy ký tự số, nếu gõ nhiều thì lấy ký tự CUỐI (ký tự vừa gõ)
    var digit = box.value.replace(/\D/g, "").slice(-1);
    box.value = digit;
    syncOtp();

    if (digit && i < otpBoxes.length - 1) {
      otpBoxes[i + 1].focus();
    }
  });

  // keydown: CHỈ xử lý Backspace / Delete / Arrow, KHÔNG đụng đến số
  box.addEventListener("keydown", function (e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (box.value !== "") {
        box.value = "";
        syncOtp();
      } else if (i > 0) {
        otpBoxes[i - 1].value = "";
        otpBoxes[i - 1].focus();
        syncOtp();
      }
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      box.value = "";
      syncOtp();
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (i > 0) otpBoxes[i - 1].focus();
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (i < otpBoxes.length - 1) otpBoxes[i + 1].focus();
      return;
    }
  });

  // Xử lý paste
  box.addEventListener("paste", function (e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpBoxes.length);

    for (var j = 0; j < otpBoxes.length; j++) {
      otpBoxes[j].value = pasted[j] || "";
    }
    syncOtp();

    var focusIndex = Math.min(pasted.length, otpBoxes.length - 1);
    otpBoxes[focusIndex].focus();
  });
});


// ===== COUNTDOWN GỬI LẠI OTP =====

var timer;

function startCountdown() {
  var seconds = 60;
  var btn = document.getElementById("btnResend");
  var cd = document.getElementById("countdown");
  btn.disabled = true;
  cd.textContent = seconds;
  clearInterval(timer);

  timer = setInterval(function () {
    seconds--;
    cd.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      document.getElementById("resendText").textContent = "Gửi lại OTP";
      cd.textContent = "";
      document.querySelector("#btnResend span:last-child").textContent = "";
    }
  }, 1000);
}

function resetResendButton() {
  document.getElementById("resendText").textContent = "Gửi lại sau ";
  document.querySelector("#btnResend span:last-child").textContent = "s";
}

document.getElementById("btnResend").addEventListener("click", function () {
  var email = document.getElementById("hiddenEmail").value;
  if (!email) return;

  var otpStatus = document.getElementById("otp-status");
  if (otpStatus) otpStatus.textContent = "Đang gửi lại OTP...";

  // Khóa ô OTP khi đang gửi lại
  otpBoxes.forEach(function (box) {
    box.value = "";
    box.disabled = true;
  });
  syncOtp();

  resetResendButton();
  startCountdown();

  fetch("/user/forgot-password/send-otp", {
    method: "POST",
    headers: window.withCsrfHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email: email }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        Swal.fire({ icon: 'error', text: data.message || "Gửi lại OTP thất bại" });
        if (otpStatus) otpStatus.textContent = "";
        return;
      }

      otpBoxes.forEach(function (box) {
        box.disabled = false;
      });

      if (otpStatus) otpStatus.textContent = "OTP mới đã được gửi đến email của bạn";
      otpBoxes[0].focus();
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({ icon: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại' });
      if (otpStatus) otpStatus.textContent = "";
    });
});


// ===== QUAY LẠI BƯỚC NHẬP EMAIL =====

function goToEmailStep() {
  document.getElementById("step-otp").style.display = "none";
  document.getElementById("step-email").style.display = "flex";
  clearInterval(timer);
}

function backToEmail() {
  goToEmailStep();
}


// ===== TOGGLE HIỆN/ẨN MẬT KHẨU =====

document.querySelectorAll(".toggle-password").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var input = document.getElementById(this.dataset.target);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
});


// ===== SUBMIT OTP + MẬT KHẨU MỚI =====

document.getElementById("otpForm").addEventListener("submit", function (e) {
  e.preventDefault();

  var email           = document.getElementById("hiddenEmail").value.trim();
  var otp             = document.getElementById("otpValue").value.trim();
  var newPassword     = document.getElementById("newPassword").value;
  var confirmPassword = document.getElementById("confirmPassword").value;

  // --- Validate phía client ---
  if (otp.length !== 6) {
    Swal.fire({ icon: 'warning', text: 'Vui lòng nhập đủ 6 số OTP' });
    otpBoxes[0].focus();
    return;
  }

  if (newPassword.length < 8) {
    Swal.fire({ icon: 'warning', text: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    document.getElementById("newPassword").focus();
    return;
  }

  if (newPassword !== confirmPassword) {
    Swal.fire({ icon: 'warning', text: 'Mật khẩu xác nhận không khớp' });
    document.getElementById("confirmPassword").focus();
    return;
  }

  // --- Khóa nút submit khi đang gửi ---
  var submitBtn = this.querySelector("button[type='submit']");
  var originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang xử lý...";

  fetch("/user/forgot-password/reset-password", {
    method: "POST",
    headers: window.withCsrfHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      email: email,
      otp: otp,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        Swal.fire({ icon: 'error', text: data.message || "Đặt lại mật khẩu thất bại" });
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        return;
      }

      // Thành công → redirect về trang login
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: data.message || 'Đặt lại mật khẩu thành công!'
      }).then(function () {
        window.location.href = "/user/login";
      });
    })
    .catch(function (error) {
      console.error(error);
      Swal.fire({ icon: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại' });
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    });
});

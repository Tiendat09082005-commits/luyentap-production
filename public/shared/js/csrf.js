(function () {
  function getMetaToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute("content") || "" : "";
  }

  function getInputToken() {
    var input = document.querySelector('input[name="_csrf"]');
    return input ? input.value || "" : "";
  }

  window.getCsrfToken = function getCsrfToken() {
    return window.__CSRF_TOKEN__ || getMetaToken() || getInputToken() || "";
  };

  window.withCsrfHeaders = function withCsrfHeaders(headers) {
    var token = window.getCsrfToken();
    var nextHeaders = Object.assign({}, headers || {});

    if (token) {
      nextHeaders["CSRF-Token"] = token;
    }

    return nextHeaders;
  };
})();

(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatCommentTime(value) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  }

  function getAuthor(comment) {
    return comment && comment.user ? comment.user : { fullName: "Khach", avatar: "" };
  }

  function renderCommentItem(comment) {
    var author = getAuthor(comment);
    var avatarHtml = author.avatar
      ? '<img src="' + escapeHtml(author.avatar) + '" alt="' + escapeHtml(author.fullName) + '">'
      : '<span class="comment-avatar-fallback">' + escapeHtml((author.fullName || "K").charAt(0).toUpperCase()) + "</span>";

    var repliesHtml = Array.isArray(comment.replies) && comment.replies.length
      ? '<div class="comment-children">' + comment.replies.map(renderCommentItem).join("") + "</div>"
      : "";

    return ''
      + '<article class="comment-item" data-comment-id="' + escapeHtml(comment._id) + '" data-depth="' + Number(comment.depth || 0) + '">'
      + '  <div class="comment-card">'
      + '    <div class="comment-avatar">' + avatarHtml + "</div>"
      + '    <div class="comment-body">'
      + '      <div class="comment-head">'
      + '        <strong class="comment-author">' + escapeHtml(author.fullName || "Khach") + "</strong>"
      + '        <time class="comment-time" datetime="' + escapeHtml(comment.createdAt) + '">' + escapeHtml(formatCommentTime(comment.createdAt)) + "</time>"
      + "      </div>"
      + '      <p class="comment-content">' + escapeHtml(comment.content) + "</p>"
      + '      <div class="comment-actions">'
      + '        <button class="comment-reply-btn" type="button" data-parent-id="' + escapeHtml(comment._id) + '" data-parent-author="' + escapeHtml(author.fullName || "Khach") + '" data-depth="' + Number(comment.depth || 0) + '">Tra loi</button>'
      + "      </div>"
      + "    </div>"
      + "  </div>"
      + repliesHtml
      + "</article>";
  }

  function appendReplyToTree(comments, parentId, replyComment) {
    for (var i = 0; i < comments.length; i += 1) {
      var comment = comments[i];

      if (String(comment._id) === String(parentId)) {
        comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
        comment.replies.push(replyComment);
        return true;
      }

      if (Array.isArray(comment.replies) && comment.replies.length) {
        var inserted = appendReplyToTree(comment.replies, parentId, replyComment);
        if (inserted) {
          return true;
        }
      }
    }

    return false;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var section = document.querySelector(".product-comments-section");
    if (!section) return;

    var form = document.getElementById("commentForm");
    var parentInput = document.getElementById("commentParentId");
    var contentInput = document.getElementById("commentContent");
    var formTitle = document.getElementById("commentFormTitle");
    var replyHint = document.getElementById("commentReplyHint");
    var cancelReplyButton = document.getElementById("commentCancelReply");
    var feedbackElement = document.getElementById("commentFeedback");
    var listElement = document.getElementById("commentList");
    var loadMoreButton = document.getElementById("commentLoadMore");
    var countBadge = document.getElementById("commentCountBadge");
    var submitButton = form ? form.querySelector(".comment-submit-btn") : null;

    var initialState = window.__COMMENTS_INITIAL__ || { comments: [], pagination: {} };
    var state = {
      productId: section.dataset.productId,
      comments: Array.isArray(initialState.comments) ? initialState.comments : [],
      pagination: initialState.pagination || {
        page: 1,
        limit: 10,
        totalRootComments: 0,
        totalPages: 1,
        hasNextPage: false,
      },
    };

    function setFeedback(message, type) {
      if (!feedbackElement) return;

      if (!message) {
        feedbackElement.hidden = true;
        feedbackElement.textContent = "";
        feedbackElement.className = "comment-feedback";
        return;
      }

      feedbackElement.hidden = false;
      feedbackElement.textContent = message;
      feedbackElement.className = "comment-feedback is-" + type;
    }

    function resetReplyState() {
      if (parentInput) parentInput.value = "";
      if (formTitle) formTitle.textContent = "Viet binh luan moi";
      if (replyHint) replyHint.textContent = "Khong ho tro HTML. Toi da 1000 ky tu.";
      if (cancelReplyButton) cancelReplyButton.hidden = true;
    }

    function activateReply(parentId, parentAuthor, depth) {
      if (Number(depth || 0) >= 2) {
        setFeedback("Da dat toi da 3 cap binh luan.", "error");
        return;
      }

      if (parentInput) parentInput.value = parentId;
      if (formTitle) formTitle.textContent = "Dang tra loi " + (parentAuthor || "Khach");
      if (replyHint) replyHint.textContent = "Binh luan tra loi se duoc gan vao chuoi hien tai.";
      if (cancelReplyButton) cancelReplyButton.hidden = false;
      if (contentInput) contentInput.focus();
    }

    function updateLoadMoreVisibility() {
      if (!loadMoreButton) return;

      var hasNextPage = Boolean(state.pagination && state.pagination.hasNextPage);
      loadMoreButton.hidden = !hasNextPage;

      if (hasNextPage) {
        loadMoreButton.dataset.nextPage = Number(state.pagination.page || 1) + 1;
      } else {
        loadMoreButton.dataset.nextPage = "";
      }
    }

    function renderComments() {
      if (!listElement) return;

      if (!state.comments.length) {
        listElement.innerHTML = '<div class="comment-empty">Chua co binh luan nao. Hay mo dau cuoc tro chuyen.</div>';
      } else {
        listElement.innerHTML = state.comments.map(renderCommentItem).join("");
      }

      if (countBadge) {
        countBadge.textContent = String(state.pagination.totalRootComments || state.comments.length) + " chu de";
      }

      updateLoadMoreVisibility();
    }

    async function fetchComments(page, appendMode) {
      var response = await fetch("/comments?productId=" + encodeURIComponent(state.productId) + "&page=" + page + "&limit=" + (state.pagination.limit || 10), {
        headers: {
          Accept: "application/json",
        },
      });

      var result = await response.json();
      if (!response.ok || result.code !== 200) {
        throw new Error(result.message || "Khong the tai binh luan.");
      }

      state.pagination = result.pagination || state.pagination;
      if (appendMode) {
        state.comments = state.comments.concat(result.comments || []);
      } else {
        state.comments = result.comments || [];
      }

      renderComments();
    }

    if (listElement) {
      listElement.addEventListener("click", function (event) {
        var replyButton = event.target.closest(".comment-reply-btn");
        if (!replyButton) return;

        activateReply(
          replyButton.dataset.parentId,
          replyButton.dataset.parentAuthor,
          replyButton.dataset.depth
        );
      });
    }

    if (cancelReplyButton) {
      cancelReplyButton.addEventListener("click", function () {
        resetReplyState();
        setFeedback("", "");
      });
    }

    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", async function () {
        var nextPage = Number(loadMoreButton.dataset.nextPage || 0);
        if (!nextPage) return;

        loadMoreButton.disabled = true;
        var originalText = loadMoreButton.textContent;
        loadMoreButton.textContent = "Dang tai...";

        try {
          await fetchComments(nextPage, true);
        } catch (error) {
          setFeedback(error.message, "error");
        } finally {
          loadMoreButton.disabled = false;
          loadMoreButton.textContent = originalText;
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        setFeedback("", "");

        var content = contentInput ? contentInput.value.trim() : "";
        if (!content) {
          setFeedback("Noi dung binh luan khong duoc de trong.", "error");
          if (contentInput) contentInput.focus();
          return;
        }

        var payload = {
          productId: state.productId,
          parentId: parentInput ? parentInput.value : "",
          content: content,
        };

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Dang gui...";
        }

        try {
          var response = await fetch("/comments", {
            method: "POST",
            headers: window.withCsrfHeaders({
              "Content-Type": "application/json",
              Accept: "application/json",
            }),
            body: JSON.stringify(payload),
          });

          var result = await response.json();
          if (!response.ok || result.code !== 201) {
            throw new Error(result.message || "Khong the gui binh luan.");
          }

          var createdComment = result.comment;

          if (payload.parentId) {
            appendReplyToTree(state.comments, payload.parentId, createdComment);
          } else {
            state.comments.push(createdComment);
            state.pagination.totalRootComments = Number(state.pagination.totalRootComments || 0) + 1;
          }

          renderComments();
          form.reset();
          resetReplyState();
          setFeedback("Gui binh luan thanh cong.", "success");
        } catch (error) {
          setFeedback(error.message, "error");
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Gui binh luan";
          }
        }
      });
    }

    resetReplyState();
    renderComments();
  });
})();

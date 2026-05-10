// button X in search input
const buttonX = document.querySelector("#clearBtn");
if (buttonX) {
    const searchInput = document.querySelector(".form-control");
    // Ẩn hiện nút x
    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim() !== "") {
            buttonX.style.display = "block";
        } else {
            buttonX.style.display = "none";
        }
    })
    // end ẩn hiện nút x 

    // click nút X
    buttonX.addEventListener("click", () => {
        searchInput.value = '';
    })
    // end click nút X
}

// end button X in search input

// Khôi phục
const buttonRestore = document.querySelectorAll("[button-restore]");
if (buttonRestore.length > 0) {
    let url = new URL(window.location.href);
    buttonRestore.forEach(button => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            const isConfirm = confirm("Bạn có chắc chắn muốn khôi phục sản phẩm");
            if (isConfirm) {
                url.searchParams.set("restore", id);
            } else {
                url.searchParams.delete("restore");
            }
            window.location.href = url.href;
        })
    })
}
// end khôi phục

// delete forever
const buttonDeleteForever = document.querySelectorAll("[button-delete-forever]");
if (buttonDeleteForever) {
    let url = new URL(window.location.href);
    buttonDeleteForever.forEach(button => {
        button.addEventListener("click" , () => {
            const id = button.getAttribute("data-id");
            const isConfirm = confirm("Bạn có chắc chắn muốn xóa sản phẩm vĩnh viễn không !!!");
            if(isConfirm) {
                url.searchParams.set("deletedHard", id);
            }else{
                url.searchParams.delete("deletedHard", id);
            }
            window.location.href = url.href;
        })
    })
}
// end delete forever
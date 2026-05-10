// permission 
const tablePermission = document.querySelector("[table-permission]");
// console.log(tablePermission);
if(tablePermission){
    const buttonSubmit = document.querySelector("[button-submit]");
    // console.log(buttonSubmit);
    buttonSubmit.addEventListener("click" , () =>{
        let permission = [];
        const rows = tablePermission.querySelectorAll("[data-name]");
        rows.forEach(row => {
            const name = row.getAttribute("data-name");
            // console.log(name);
            const inputs = row.querySelectorAll("input");
            // console.log(inputs);
            if(name == "id"){
                inputs.forEach(input =>{
                    const id = input.value;
                    // console.log(id);
                    permission.push({
                        id : id,
                        permission : []
                    })
                })
            }else{
                inputs.forEach((input,index) =>{
                    const checked = input.checked;
                    if(checked){
                        permission[index].permission.push(name);
                    }
                })
            }
        });
        if(permission.length >0){
            const formChangePermissions = document.querySelector("#form-change-permissions");
            // console.log(formChangePermissions);
            const inputChangePermissions = formChangePermissions.querySelector(`input[name="permissions"]`);
            // console.log(inputChangePermissions);
            inputChangePermissions.value = JSON.stringify(permission);
            formChangePermissions.submit();
        }
    })
}

// end permission 

// Permissions data default
const dataRecords = document.querySelector("[data-records]");
// console.log(dataRecords);
if(dataRecords){
    const records = JSON.parse(dataRecords.getAttribute("data-records"));
    // console.log(records);
    const tablePermissions = document.querySelector("[table-permission]");
    records.forEach((record,index) =>{
        const permissions = record.permissions;
        permissions.forEach(permission =>{
            const row = tablePermissions.querySelector(`[data-name="${permission}"]`);
            const input = row.querySelectorAll("input")[index];
            input.checked = true;
        })
    })
}
// End Permissions data default 
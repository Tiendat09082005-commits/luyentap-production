const Account = require("../../models/accounts.model");
const conFig = require("../../config/system");
const Role = require("../../models/roles.model");
// md5 removed

// [GET] admin/my-account
module.exports.index = async (req, res) => {
    const roles_user = res.locals.roles.permissions;
    // console.log(roles_user);
    res.render("admin/pages/my-account/index" ,{
        role : roles_user
    })
    // res.send("Ok")
}
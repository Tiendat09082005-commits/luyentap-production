const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
{
  user_id : {
    default : null,
    type : String
  },
  products : [
    {
        product_id : String,
        variant_id : String,
        quantity : Number
    }
    ]
},  
{
    timestamps : true
}
);

// Indexing for performance
cartSchema.index({ user_id: 1 });

const Cart = mongoose.model("Cart", cartSchema, "carts");

module.exports = Cart;
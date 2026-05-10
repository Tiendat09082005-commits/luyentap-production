const mongoose = require("mongoose");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function scalarString(v) {
  if (v == null) return "";
  let x = v;
  if (Array.isArray(x)) x = x.length ? x[x.length - 1] : "";
  if (typeof x !== "string") x = String(x);
  return x.trim();
}

module.exports.createProductValidator = (body) => {
  const errors = [];

  const title = scalarString(body.title);
  if (!title) {
    errors.push("Tên sản phẩm là bắt buộc");
  }

  const brandId = scalarString(body.brand_id);
  if (!brandId || !isValidObjectId(brandId)) {
    errors.push("brand_id không hợp lệ");
  }

  const categoryId = scalarString(body.category_id);
  if (categoryId && !isValidObjectId(categoryId)) {
    errors.push("category_id không hợp lệ");
  }

  if (body.status && !["active", "inactive"].includes(body.status)) {
    errors.push("status không hợp lệ");
  }

  // =========================
  // 2. Validate attributes
  // =========================
  if (!Array.isArray(body.attributes)) {
    errors.push("attributes phải là mảng");
  } else {
    body.attributes.forEach((attr, index) => {
      if (!attr.attribute_id || !isValidObjectId(attr.attribute_id)) {
        errors.push(`attributes[${index}].attribute_id không hợp lệ`);
      }

      if (!attr.name || !attr.name.trim()) {
        errors.push(`attributes[${index}].name là bắt buộc`);
      }

      if (!attr.code || !attr.code.trim()) {
        errors.push(`attributes[${index}].code là bắt buộc`);
      }

      if (!Array.isArray(attr.selectedValues)) {
        errors.push(`attributes[${index}].selectedValues phải là mảng`);
      }
    });
  }

  // =========================
  // 3. Validate specifications
  // =========================
  if (!Array.isArray(body.specifications)) {
    errors.push("specifications phải là mảng");
  } else {
    body.specifications.forEach((group, groupIndex) => {
      if (!group.groupName || !group.groupName.trim()) {
        errors.push(`specifications[${groupIndex}].groupName là bắt buộc`);
      }

      if (!Array.isArray(group.items)) {
        errors.push(`specifications[${groupIndex}].items phải là mảng`);
      } else {
        group.items.forEach((item, itemIndex) => {
          if (!item.key || !item.key.trim()) {
            errors.push(
              `specifications[${groupIndex}].items[${itemIndex}].key là bắt buộc`
            );
          }

          if (!item.value || !item.value.trim()) {
            errors.push(
              `specifications[${groupIndex}].items[${itemIndex}].value là bắt buộc`
            );
          }
        });
      }
    });
  }

  // =========================
  // 4. Validate variants
  // =========================
  if (!Array.isArray(body.variants)) {
    errors.push("variants phải là mảng");
  } else {
    body.variants.forEach((variant, index) => {
      if (variant.price === undefined || isNaN(Number(variant.price))) {
        errors.push(`variants[${index}].price không hợp lệ`);
      }

      if (variant.discount !== undefined && isNaN(Number(variant.discount))) {
        errors.push(`variants[${index}].discount không hợp lệ`);
      }

      if (variant.stock === undefined || isNaN(Number(variant.stock))) {
        errors.push(`variants[${index}].stock không hợp lệ`);
      }

      const sku = scalarString(variant.sku);
      if (!sku) {
        errors.push(`variants[${index}].sku là bắt buộc`);
      }

      const vStatus = scalarString(variant.status);
      if (
        vStatus &&
        !["active", "inactive"].includes(vStatus)
      ) {
        errors.push(`variants[${index}].status không hợp lệ`);
      }

      if (!variant.attributes || typeof variant.attributes !== "object") {
        errors.push(`variants[${index}].attributes không hợp lệ`);
      }
    });
  }

  return errors;
};
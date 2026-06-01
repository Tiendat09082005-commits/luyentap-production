const {
  escapeRegex,
  normalizeAttributeData,
} = require("../../helpers/attribute.helper");
const Attributerepository = require("../../repositories/admin/attribute.repository");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

const getAttributes = async (query) => {
  const find = {
    deleted: false,
  };

  const status = query.status || "";
  const keyword = (query.keyword || "").trim();

  // filter status
  if (status === "active" || status === "inactive") {
    find.status = status;
  }

  // search an toàn
  if (keyword) {
    const safeKeyword = escapeRegex(keyword);

    find.$or = [
      { title: { $regex: safeKeyword, $options: "i" } },
      { slug: { $regex: safeKeyword, $options: "i" } },
      { code: { $regex: safeKeyword, $options: "i" } },
    ];
  }

  const attributes = await Attributerepository.find(find);

  return attributes;
};

const createAttribute = async (data) => {
  try {
    const attributeData = normalizeAttributeData(data);

    if (!attributeData.status) {
      attributeData.status = "active";
    }

    const record = await Attributerepository.create(attributeData);

    return record;
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      if (field === "slug") {
        throw new AppError(409, ERROR_CODE.ATTRIBUTE_DUPLICATE_SLUG);
      } else if (field === "code") {
        throw new AppError(409, ERROR_CODE.ATTRIBUTE_DUPLICATE_CODE);
      }
    }

    throw error;
  }
};

const deleteAttribute = async (slug) => {
  const result = await Attributerepository.softDelete({ slug });

  if (result.matchedCount === 0) {
    throw new AppError(404, ERROR_CODE.ATTRIBUTE_NOT_FOUND_OR_DELETED);
  }

  return true;
};

const updateAttribute = async (slug, data) => {
  try {
    const updateData = normalizeAttributeData(data);

    const updated = await Attributerepository.update({ slug }, updateData);

    if (!updated) {
      throw new AppError(404, ERROR_CODE.ATTRIBUTE_NOT_FOUND);
    }

    return updated;
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      if (field === "slug") {
        throw new AppError(409, ERROR_CODE.ATTRIBUTE_DUPLICATE_SLUG);
      } else if (field === "code") {
        throw new AppError(409, ERROR_CODE.ATTRIBUTE_DUPLICATE_CODE);
      }
    }

    throw error;
  }
};

module.exports = {
  getAttributes,
  createAttribute,
  deleteAttribute,
  updateAttribute,
};
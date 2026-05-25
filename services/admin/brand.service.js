const {
  escapeRegex,
  normalizeBrandData,
} = require("../../helpers/brand.helper");
const BrandReponsitory = require("../../repositories/admin/brand.reponsitory");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

const getBrands = async (query) => {
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
      { description: { $regex: safeKeyword, $options: "i" } },
    ];
  }

  const brands = await BrandReponsitory.find(find);

  return {
    brands,
    keyword,
    status,
  };
};

const createBrand = async (data) => {
  try {
    const brandData = normalizeBrandData(data);

    if (!brandData.status) {
      brandData.status = "active";
    }

    const record = await BrandReponsitory.create(brandData);

    return record;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, ERROR_CODE.BRAND_DUPLICATE_SLUG);
    }

    throw error;
  }
};

const getBrandDetail = async (id) => {
  const brand = await BrandReponsitory.findOne({ _id: id, deleted: false });
  

  if (!brand) {
    throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND);
  }

  return brand;
};

const changeStatusBrand = async (id, status) => {
  const result = await BrandReponsitory.updateStatus(id, status);

  if (result.matchedCount === 0) {
    throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND);
  }

  return true;
};

const updateBrand = async (id, data) => {
  try {
    const updateData = normalizeBrandData(data);

    const brand = await BrandReponsitory.update(id, updateData);

    if (!brand) {
      throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND);
    }

    return brand;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, ERROR_CODE.BRAND_DUPLICATE_SLUG);
    }

    throw error;
  }
};

const deleteBrand = async (id) => {
  const result = await BrandReponsitory.softDelete(id);

  if (result.matchedCount === 0) {
    throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND_OR_DELETED);
  }

  return true;
};

module.exports = {
  getBrands,
  createBrand,
  getBrandDetail,
  changeStatusBrand,
  updateBrand,
  deleteBrand,
};

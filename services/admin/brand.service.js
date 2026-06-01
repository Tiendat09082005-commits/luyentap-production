const {
  escapeRegex,
  normalizeBrandData,
} = require("../../helpers/brand.helper");
const Brandrepository = require("../../repositories/admin/brand.repository");
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

  const brands = await Brandrepository.find(find);

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

    const record = await Brandrepository.create(brandData);

    return record;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, ERROR_CODE.BRAND_DUPLICATE_SLUG);
    }

    throw error;
  }
};

const getBrandDetail = async (id) => {
  const brand = await Brandrepository.findOne({ _id: id, deleted: false });
  

  if (!brand) {
    throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND);
  }

  return brand;
};

const changeStatusBrand = async (id, status) => {
  const result = await Brandrepository.updateStatus(id, status);

  if (result.matchedCount === 0) {
    throw new AppError(404, ERROR_CODE.BRAND_NOT_FOUND);
  }

  return true;
};

const updateBrand = async (id, data) => {
  try {
    const updateData = normalizeBrandData(data);

    const brand = await Brandrepository.update(id, updateData);

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
  const result = await Brandrepository.softDelete(id);

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

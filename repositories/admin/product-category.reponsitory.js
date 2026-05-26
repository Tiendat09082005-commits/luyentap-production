const ProductCategory = require("../../models/products-category.model");

class ProductCategoryRepository {
  /**
   * Lấy tất cả danh mục chưa bị xóa mềm, sắp xếp theo thứ tự position
   */
  async findAllActive() {
    return ProductCategory.find({ deleted: false })
      .sort({ position: "asc" })
      .lean();
  }

  /**
   * Kiểm tra trùng lặp slug
   */
  async existsBySlug(slug, excludeId = null) {
    const query = { slug, deleted: false };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    return ProductCategory.exists(query);
  }

  /**
   * Tìm vị trí (position) của các danh mục cùng cấp (cùng parent_id)
   */
  async findSiblingPositions(parentId) {
    return ProductCategory.find({
      parent_id: parentId || null,
      deleted: false,
    })
      .select("position")
      .lean();
  }

  /**
   * Tạo danh mục mới
   */
  async create(data) {
    return ProductCategory.create(data);
  }

  /**
   * Tìm danh mục theo ID
   */
  async findById(id) {
    return ProductCategory.findById(id).lean();
  }

  /**
   * Tìm danh mục chưa xóa theo ID
   */
  async findOneActive(id) {
    return ProductCategory.findOne({
      _id: id,
      deleted: false,
    }).lean();
  }

  /**
   * Kiểm tra xem danh mục có danh mục con trực thuộc hay không
   */
  async hasChildren(id) {
    return ProductCategory.exists({
      parent_id: id,
      deleted: false,
    });
  }

  /**
   * Cập nhật thông tin danh mục theo ID
   */
  async update(id, data) {
    return ProductCategory.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
  }

  /**
   * Xóa mềm danh mục
   */
  async softDelete(id) {
    return ProductCategory.updateOne(
      { _id: id },
      { deleted: true }
    );
  }
}

module.exports = new ProductCategoryRepository();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const productService = require("./product.service");

/**
 * Hàm gọi API Google Gemini (Model: gemini-2.5-flash) để sinh nội dung phản hồi từ Prompt
 * @param {string} prompt - Prompt chi tiết gửi cho AI Model
 * @returns {Promise<string>} - Câu trả lời văn bản dạng Markdown của AI
 */
async function generateAiResponse(prompt) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[Gemini API Error] GEMINI_API_KEY chưa được cấu hình trong tệp .env");
            return "Trợ lý AI chưa được kích hoạt khóa kết nối (API Key). Vui lòng cấu hình khóa bảo mật ở Backend.";
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const generationConfig = {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        };

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
        });

        return result.response.text();
    } catch (error) {
        console.error("Lỗi khi kết nối Google Gemini API:", error);
        throw new Error("Không thể kết nối đến máy chủ AI.");
    }
}

/**
 * Luồng Nghiệp Vụ 1: Tư vấn tìm kiếm sản phẩm (PRODUCT_SEARCH)
 */
async function handleProductSearch(metadata, user) {
    const { category, criteria } = metadata;

    // 1. Phân tích tầm giá từ lựa chọn của người dùng trong Wizard
    let minPrice = 0;
    let maxPrice = 0;
    const budgetOption = category === 'laptop' 
        ? criteria.budgetOrSpecOrSize 
        : (category === 'pc' ? criteria.extraOrBudget : criteria.extraOrBudget);

    if (category === 'laptop') {
        if (budgetOption === 'under-15') maxPrice = 15000000;
        else if (budgetOption === '15-25') {
            minPrice = 15000000;
            maxPrice = 25000000;
        } else if (budgetOption === 'above-25') {
            minPrice = 25000000;
        }
    } else if (category === 'pc') {
        if (budgetOption === 'under-15') maxPrice = 15000000;
        else if (budgetOption === '15-30') {
            minPrice = 15000000;
            maxPrice = 30000000;
        } else if (budgetOption === 'above-30') {
            minPrice = 30000000;
        }
    } else if (category === 'phone') {
        if (budgetOption === 'under-7') maxPrice = 7000000;
        else if (budgetOption === '7-15') {
            minPrice = 7000000;
            maxPrice = 15000000;
        } else if (budgetOption === 'above-15') {
            minPrice = 15000000;
        }
    }

    // 2. Truy vấn danh sách sản phẩm thực tế phù hợp từ Database
    const queryParams = {
        category: category,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        limit: 5
    };

    const result = await productService.getProducts(queryParams, user);
    const products = result.products || [];

    // 3. Chuyển đổi danh sách sản phẩm thành dạng text làm ngữ cảnh (Context) cho AI
    let productDatabaseContext = "";
    if (products.length > 0) {
        productDatabaseContext = "Dưới đây là danh sách sản phẩm thực tế đang có trong kho hàng phù hợp với khoảng giá của khách hàng:\n";
        products.forEach((prod, index) => {
            const priceNew = prod.priceNew || prod.price;
            productDatabaseContext += `${index + 1}. Tên: ${prod.title} | Giá bán: ${priceNew.toLocaleString('vi-VN')} đ | Giá gốc: ${prod.price.toLocaleString('vi-VN')} đ | Khuyến mại: ${prod.discount}% | Tồn kho: ${prod.stock} chiếc | Link chi tiết sản phẩm: /products/detail/${prod.slug || prod._id}\n`;
        });
    } else {
        productDatabaseContext = "Không tìm thấy bất kỳ sản phẩm nào phù hợp trong kho hàng của cửa hàng tại khoảng giá này.";
    }

    // 4. Thiết lập Prompt chi tiết gửi cho AI Model
    const aiPrompt = `
Bạn là Trợ lý mua sắm AI chuyên nghiệp, thân thiện của cửa hàng thiết bị công nghệ Tida.
Khách hàng đang muốn tư vấn về: ${category.toUpperCase()}.
Các tiêu chí mong muốn của khách hàng từ khảo sát nhanh: ${JSON.stringify(criteria)}.

${productDatabaseContext}

Yêu cầu tư vấn:
1. Dựa trên các sản phẩm thực tế đang có trong kho ở trên, hãy đưa ra lời tư vấn chi tiết, phân tích xem sản phẩm nào là phù hợp nhất với các tiêu chí của khách hàng (như hãng sản xuất, nhu cầu, tính năng ưu tiên).
2. Hãy so sánh nhẹ ưu nhược điểm giữa các sản phẩm để khách hàng dễ lựa chọn.
3. Nếu không có sản phẩm nào trong kho khớp khoảng giá, hãy xin lỗi lịch sự và gợi ý họ bấm nút tạo cuộc hội thoại mới (+) để chọn tầm giá hoặc tiêu chí khác.
4. KHÔNG tự bịa ra sản phẩm không có trong danh sách trên.
5. Câu trả lời viết bằng Markdown đẹp mắt. Hãy chèn đường link chi tiết sản phẩm bằng cú pháp [Tên sản phẩm](Đường dẫn Link chi tiết sản phẩm ở danh sách trên) để người dùng có thể nhấp chuột trực tiếp để xem/mua hàng.
`;

    // 5. Gửi Prompt sang cho AI xử lý và trả về
    return await generateAiResponse(aiPrompt);
}

/**
 * Luồng Nghiệp Vụ 2: So sánh sản phẩm (PRODUCT_COMPARE)
 */
async function handleProductCompare(content) {
    if (!content || content.trim() === "") {
        return "Vui lòng nhập tên các sản phẩm bạn muốn so sánh (ví dụ: 'iPhone 15 Pro và Galaxy S24 Ultra').";
    }

    const aiPrompt = `
Bạn là một Chuyên gia công nghệ kiêm Trợ lý tư vấn mua sắm xuất sắc của cửa hàng Tida.
Khách hàng đang yêu cầu bạn so sánh chi tiết các sản phẩm công nghệ sau: "${content}".

Yêu cầu thực hiện:
1. Hãy phân tích cấu hình, ưu nhược điểm của các sản phẩm được đề cập dựa trên kiến thức công nghệ của bạn.
2. Dựng một bảng so sánh (bằng Markdown) bao gồm các thông số cốt lõi để khách hàng dễ đối chiếu trực quan (ví dụ: Màn hình, Hiệu năng CPU/GPU, Camera, Pin/Sạc, và Giá bán tham khảo thị trường).
3. Đưa ra lời khuyên thực tế: Sản phẩm nào phù hợp với nhu cầu hay nhóm đối tượng khách hàng nào.
4. Trình bày Markdown sạch sẽ, rõ ràng.
`;

    return await generateAiResponse(aiPrompt);
}

/**
 * Luồng Nghiệp Vụ 3: Trả về chính sách bán hàng cửa hàng (STORE_POLICY)
 */
async function handleStorePolicy() {
    return `
### 🛡️ Chính Sách Bán Hàng & Bảo Hành tại Tida Technology

Hiện tại cửa hàng Tida đang áp dụng các chính sách dịch vụ khách hàng tiêu chuẩn sau:

1. **Chính sách bảo hành chính hãng:**
   - Bảo hành phần cứng **12 - 24 tháng** đối với tất cả sản phẩm chính hãng (Laptop, PC, Điện thoại).
   - Hỗ trợ cài đặt phần mềm và vệ sinh thiết bị miễn phí trong suốt thời gian bảo hành.

2. **Chính sách 1-đổi-1 (Lỗi nhà sản xuất):**
   - Áp dụng đổi mới thiết bị tương đương trong vòng **30 ngày đầu tiên** nếu máy phát sinh lỗi phần cứng từ nhà sản xuất.

3. **Chính sách vận chuyển:**
   - Miễn phí vận chuyển hỏa tốc khu vực nội thành cho đơn hàng từ **5.000.000 đ**.
   - Hỗ trợ đồng kiểm trước khi nhận và thanh toán trên toàn quốc.

4. **Chính sách hoàn tiền / trả hàng:**
   - Chấp nhận trả lại sản phẩm chưa qua sử dụng, nguyên seal hộp trong vòng **7 ngày** kể từ khi nhận hàng (áp dụng mức phí thu hồi 10%).

---
*Nếu bạn có thắc mắc cụ thể hoặc muốn kiểm tra bảo hành cho thiết bị cụ thể, vui lòng nhập nội dung chi tiết ở khung chat phía dưới nhé!*
`;
}

/**
 * Luồng Nghiệp Vụ 4: Trò chuyện và Giải đáp kiến thức chung (GENERAL_KNOWLEDGE)
 */
async function handleGeneralKnowledge(content) {
    if (!content || content.trim() === "") {
        return "Hãy nhập câu hỏi của bạn về các sản phẩm công nghệ hoặc kỹ thuật, tôi sẵn sàng giải đáp!";
    }

    const aiPrompt = `
Bạn là một Trợ lý tri thức công nghệ chuyên nghiệp của cửa hàng Tida.
Câu hỏi của khách hàng: "${content}".

Quy tắc bắt buộc (System Instructions):
1. Bạn CHỈ được phép trả lời các câu hỏi liên quan đến chủ đề: Sản phẩm điện tử, máy tính, điện thoại, thiết bị công nghệ, phần mềm, mẹo sử dụng phần cứng, hoặc dịch vụ của Tida.
2. Nếu câu hỏi của người dùng KHÔNG thuộc các lĩnh vực công nghệ/sản phẩm nêu trên (ví dụ: công thức nấu ăn, địa lý, chính trị, thể thao, văn học, hoặc tán gẫu ngoài lề không liên quan công nghệ), bạn PHẢI từ chối trả lời một cách lịch sự.
3. Câu từ chối mẫu: "Rất tiếc, tôi là Trợ lý AI chuyên trách lĩnh vực công nghệ và sản phẩm tại Tida nên không thể giải đáp câu hỏi này. Bạn vui lòng đặt câu hỏi liên quan đến thiết bị công nghệ hoặc chính sách cửa hàng nhé!"
4. Trình bày câu trả lời ngắn gọn, súc tích bằng Markdown.
`;

    return await generateAiResponse(aiPrompt);
}

module.exports = {
    generateAiResponse,
    handleProductSearch,
    handleProductCompare,
    handleStorePolicy,
    handleGeneralKnowledge
};

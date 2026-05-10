const he = require('he');
const { stripHtml } = require('string-strip-html');

// Định nghĩa hàm và export nó dưới dạng module.exports
function cleanDescription(description) { 
    const result = stripHtml(description);
    // Lưu ý: he phải được require nếu chưa có
    const decodedText = he.decode(result.result); 

    return decodedText.trim();
}

module.exports = cleanDescription;
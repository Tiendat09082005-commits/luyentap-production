---
name: tidaadmin-ui-style
description: >
  Dùng skill này khi cần đồng bộ hoặc xây dựng giao diện admin theo phong cách TidaAdmin.
  Trigger khi: user muốn sửa giao diện trang quản trị, thêm trang mới vào admin panel,
  đồng bộ style giữa các màn hình, hoặc yêu cầu "theo style TidaAdmin / theo 2 ảnh layout".
  KHÔNG dùng cho: thay đổi logic backend, API, hay business logic.
---

# TidaAdmin UI Style Guide

Đây là design system chuẩn cho toàn bộ giao diện admin TidaAdmin.
Khi chỉnh sửa giao diện, CHỈ thay đổi phần visual/layout/style — KHÔNG động vào logic, state management, API calls, hay data processing.

---

## 1. Color Palette (CSS Variables)

```css
:root {
  /* Primary */
  --color-primary:        #6C3FF4;   /* Tím chủ đạo – sidebar active, button chính */
  --color-primary-light:  #EEE9FD;   /* Tím nhạt – hover bg, badge bg */
  --color-primary-dark:   #5530C8;   /* Tím đậm – hover trên button */

  /* Neutral / Background */
  --color-bg-page:        #F4F6FB;   /* Nền toàn trang */
  --color-bg-card:        #FFFFFF;   /* Nền card / panel */
  --color-bg-sidebar:     #FFFFFF;   /* Nền sidebar */
  --color-border:         #EAECF0;   /* Đường viền nhẹ */

  /* Text */
  --color-text-primary:   #1A1D23;   /* Tiêu đề, số liệu chính */
  --color-text-secondary: #6B7280;   /* Label, caption, mô tả */
  --color-text-muted:     #9CA3AF;   /* Placeholder, disabled */

  /* Status */
  --color-success:        #10B981;   /* Sẵn hàng, tăng trưởng xanh */
  --color-warning:        #F59E0B;   /* Sắp hết hàng */
  --color-danger:         #EF4444;   /* Hết hàng, giảm, xóa */
  --color-info:           #3B82F6;   /* Thông tin, link */

  /* Chart / Accent */
  --color-chart-line:     #6C3FF4;   /* Line chart chính */
  --color-chart-fill:     rgba(108, 63, 244, 0.08); /* Fill dưới đường line */
}
```

---

## 2. Typography

```css
/* Font chính: Be Vietnam Pro – hiện đại, đọc tốt ở mọi cỡ */
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

body {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 14px;
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

/* Scale */
/* Page title    : 22px, 700 */
/* Section title : 16px, 600 */
/* Card label    : 12px, 500, color: --color-text-secondary, UPPERCASE, letter-spacing 0.5px */
/* Stat number   : 24px, 700 */
/* Body text     : 14px, 400 */
/* Caption/meta  : 12px, 400, color: --color-text-muted */
```

---

## 3. Layout & Spacing

```
Sidebar width   : 220px (collapsed: 64px)
Content padding : 28px 32px
Card gap        : 20px
Border radius   :
  - Card        : 14px
  - Button      : 8px
  - Badge/Tag   : 6px
  - Input       : 8px
  - Avatar      : 50% (tròn)
Box shadow card : 0 1px 4px rgba(0,0,0,0.06)
```

---

## 4. Component Specs

### 4.1 Sidebar
```
- Nền: #FFFFFF, border-right: 1px solid var(--color-border)
- Logo: text "TidaAdmin" + icon vuông tím, font-weight 700, size 16px
- Nav item mặc định: text #6B7280, icon 18px
- Nav item ACTIVE: background var(--color-primary), text #FFFFFF, border-radius 8px
  (active item có padding 10px 14px, margin 0 12px)
- Badge thông báo: background #EF4444, text #FFF, font 10px, border-radius 10px
- Footer: avatar tròn + tên + email nhỏ, sát bottom
- Section label (SYSTEM): font 10px, uppercase, letter-spacing 1px, color #9CA3AF
```

### 4.2 Top Bar / Header
```
- Nền: #FFFFFF, border-bottom: 1px solid var(--color-border), height 60px
- Search bar: nền #F4F6FB, placeholder "Tìm kiếm...", icon kính lúp
- Icon bell: 20px, color #6B7280
- Avatar user: tròn 36px + tên + role nhỏ bên cạnh
```

### 4.3 Stat Cards (KPI Cards)
```
- Nền: #FFFFFF, border-radius 14px, padding 20px, shadow nhẹ
- Icon nhỏ 36px: nền tím nhạt/cam nhạt/xanh nhạt (tùy loại)
- Label: 12px, uppercase, color secondary
- Số liệu chính: 24px, bold, color primary text
- Badge % thay đổi: text + icon mũi tên
  - Tăng: text #10B981, bg #ECFDF5
  - Giảm: text #EF4444, bg #FEF2F2
- Mini bar chart nhỏ ở dưới (decorative)
```

### 4.4 Line Chart (Revenue Overview)
```
- Nền card: #FFFFFF, padding 24px
- Title 16px bold, subtitle 12px muted
- Tab chọn kỳ (30D / 6M / 1Y): pill-style, active: bg tím, text trắng
- Chart: line màu --color-chart-line, fill gradient nhạt bên dưới
- Trục X: ngày tháng, font 11px muted
- Không có grid line nặng – chỉ dùng đường ngang mờ
```

### 4.5 Recent Activity Panel
```
- Title 16px bold + link "ALL" màu tím
- Mỗi item: icon 36px (bg nhạt, icon màu) + nội dung + thời gian
- Icon types: đơn hàng (tím), user mới (xanh), cảnh báo (đỏ), log (xám)
- Thời gian: 11px, color muted, "2m ago" / "45m ago"
- Đường phân cách: 1px #EAECF0 giữa các item
```

### 4.6 Data Table (Products / Orders)
```
- Header row: background #F9FAFB, text 11px uppercase, letter-spacing 0.5px, color muted
- Dòng data: padding 16px, border-bottom 1px #EAECF0
- Hover row: background #F4F6FB
- Product image: 44px × 44px, border-radius 8px, object-fit cover
- Tên sản phẩm: 14px 600; SKU dưới: 11px muted
- Category tag: badge nhỏ với màu nền riêng (Điện thoại: tím, Máy tính: xanh)
- Giá: 14px 600
- Tồn kho: số + chấm trạng thái màu (xanh/vàng/đỏ) + text nhỏ
- Doanh thu: số + progress bar màu tím phía dưới, height 3px
- Hành động: icon eye (xám), edit (xanh), delete (đỏ), cách nhau 8px
- Pagination: nền tím cho trang active, border-radius 6px
```

### 4.7 Buttons
```
- Primary: bg var(--color-primary), text #FFF, border-radius 8px, padding 10px 18px, 14px 600
  Hover: bg var(--color-primary-dark), slight shadow
- Secondary / Outline: border 1px --color-border, bg trắng, text primary
- Icon button: nền transparent, icon 18px, hover bg --color-primary-light
- Button có icon trái: gap 6px giữa icon và text
```

### 4.8 Badges / Tags
```
- Danh mục: bg [màu]--10% opacity, text [màu], border-radius 6px, 11px 500
  Ví dụ: Điện thoại → bg #EEE9FD, text #6C3FF4
- Trạng thái:
  Sẵn hàng  → bg #ECFDF5, text #10B981, chấm xanh
  Sắp hết   → bg #FFF7ED, text #F59E0B, chấm vàng
  Hết hàng  → bg #FEF2F2, text #EF4444, chấm đỏ
```

### 4.9 Filter Bar
```
- Nằm trên table, padding-bottom 16px, border-bottom 1px --color-border
- Filter button: icon + text, border 1px --color-border, border-radius 8px
- Dropdown select: border 1px --color-border, border-radius 8px
- Sắp xếp: label "Sắp xếp:" + select inline
```

### 4.10 Status Bar (Bottom của Dashboard)
```
- 3 card ngang: System Status / Load Speed / Next Sync
- Icon + label nhỏ uppercase + giá trị lớn hơn
- System Operational: chấm xanh nhấp nháy nhẹ (animation pulse)
```

---

## 5. Micro-interactions & Motion

```css
/* Tất cả transition dùng chung */
transition: all 0.18s ease;

/* Hover card: shadow nhẹ hơn */
.card:hover { box-shadow: 0 4px 16px rgba(108,63,244,0.10); }

/* Button ripple / scale */
.btn-primary:active { transform: scale(0.97); }

/* Sidebar item hover */
.nav-item:hover { background: var(--color-primary-light); color: var(--color-primary); }

/* Badge pulse (operational status) */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.status-dot { animation: pulse-dot 2s infinite; }
```

---

## 6. Responsive Breakpoints

```
Desktop  ≥ 1280px : sidebar mở đầy đủ (220px)
Tablet   768–1279 : sidebar thu gọn (64px, chỉ icon)
Mobile   < 768px  : sidebar ẩn, hamburger menu
```

---

## 7. Icon System

Dùng **Lucide Icons** (hoặc Heroicons nếu project đang dùng).
- Size mặc định: 18px trong nav, 20px trong action button, 16px trong badge
- Stroke-width: 1.75px
- Color: kế thừa từ text color của container

---

## 8. Nguyên tắc KHÔNG được vi phạm khi sửa UI

1. ❌ KHÔNG thay đổi tên biến, hàm, props, state, hook
2. ❌ KHÔNG xóa hay sửa logic xử lý data, API call, event handler
3. ❌ KHÔNG thêm/xóa import thư viện ngoài (trừ font/icon)
4. ✅ CHỈ được sửa: className, style, JSX structure (visual only), CSS/Tailwind classes
5. ✅ Giữ nguyên toàn bộ comment có dấu `// LOGIC` hoặc `/* BUSINESS */`
6. ✅ Sau khi sửa, component phải render được không lỗi

---

## 9. Checklist trước khi submit UI change

- [ ] Màu đúng theo color palette ở trên
- [ ] Font Be Vietnam Pro
- [ ] Spacing và border-radius đúng chuẩn
- [ ] Responsive hoạt động ở 3 breakpoint
- [ ] Không có inline style phức tạp (dùng CSS variable hoặc className)
- [ ] Dark mode (nếu có) vẫn hoạt động
- [ ] Không có logic/state bị thay đổi

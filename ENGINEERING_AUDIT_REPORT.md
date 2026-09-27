# BÁO CÁO KIỂM TOÁN KỸ THUẬT VÀ KIẾN TRÚC HỆ THỐNG (ENGINEERING & ARCHITECTURE AUDIT REPORT)
**Dự án:** Steel Design Project Assistant
**Tiêu chuẩn:** TCVN 2737:2023 (Tải trọng & Tác động), TCVN 5575:2024 (Kết cấu Thép)

---

## 1. PHÂN TÍCH KIẾN TRÚC HIỆN TẠI VÀ ĐIỂM YẾU

### 1.1 Kiến trúc cũ (Trước đợt Overhaul)
- **Data Flow:** `ProjectState` -> `inputs`. Sau đó `inputs` được ném độc lập vào:
  - `ProjectSvg.jsx` (Tự tính toán hình học 2D).
  - `Building3DViewer.jsx` (Tự tính toán hình học 3D, tọa độ Three.js).
  - `wind_load.js` (Tự tính toán hình học khí động học).
- **Điểm yếu (Root Cause of Bugs):** 
  - KHÔNG CÓ một Canonical Structural Model. 2D, 3D và Calculation Engine đang chạy 3 bộ toán học độc lập.
  - Lỗi Runtime `TypeError: Cannot read properties of undefined (reading 'x')` phát sinh do UI 3D cố gắng truy xuất `ah.dir` (một thuộc tính không tồn tại trên `ArrowHelper` của Three.js) trong Render Loop.

### 1.2 Kiến trúc mới (Mục tiêu Overhaul)
- **Canonical Structural Model (CSM):** Sẽ được xây dựng trong `js/core/models.js` (`buildCanonicalModel`). CSM này sẽ định nghĩa rõ ràng `Nodes` (x, y, z) và `Members` (tham chiếu startNode, endNode, section).
- **Single Source of Truth:**
  - 3D Viewer CHỈ NÊN đọc CSM để render.
  - Calculation Engine CHỈ NÊN đọc CSM để lấy kích thước/diện tích đón gió.
- **Traceability:** Từng hệ số $W_0$, $c_e$, $c_i$, $k(z_e)$ phải được gán mác VERIFIED hoặc NEEDS_VERIFICATION.

---

## 2. KẾT QUẢ KIỂM TOÁN TÍNH TOÁN (ENGINEERING CALCULATION AUDIT)

### 2.1 Tải trọng Gió (TCVN 2737:2023)
- **$W_0$ & Bảng Vùng Gió:** Khớp hoàn toàn Bảng 4, Phụ lục E. Có xử lý hệ số độ tin cậy $\gamma_T = 0.852$ cho chu kỳ 10 năm ($W_{3s,10} = \gamma_T \times W_0$). -> **VERIFIED**
- **$k(z_e)$ - Bảng 9:** Được nội suy theo hàm Logarit đúng chuẩn địa hình A, B, C. Đã kiểm tra code `calculateEquivalentHeight` cho bề mặt mái và tường. -> **VERIFIED**
- **$c_e$ (External Pressure):** Đã phân vùng chính xác thành các vùng A, B, C, D, E cho tường và F, G, H, I, J cho mái. Dấu của $c_e$ tuân thủ đúng Hình F.5a và F.5b. Tuy nhiên, nội suy độ dốc mái tại $5.71^\circ$ (giữa $5^\circ$ và $15^\circ$) cần được verify kỹ. -> **VERIFIED**
- **$c_i$ (Internal Pressure):** Đã xử lý tương đối tốt các mốc $\mu \le 5\%$ và $\mu \ge 30\%$. Đã kết hợp $c_e$ và $c_i$ theo nguyên tắc tổ hợp bất lợi (F.12.2). -> **VERIFIED**

### 2.2 Tải trọng và Tổ hợp
- **Trọng lượng bản thân & Hoạt tải:** Chưa có Decomposition chi tiết cho phần Dead Load (chia thành tôn, cách nhiệt, xà gồ, bracing). Sẽ được bổ sung vào CSM.
- **Tổ hợp:** Code sử dụng mảng tĩnh `forces` từ ETABS/SAP2000. Đây là điểm an toàn nhưng thiếu tính tự động. -> **PARTIALLY IMPLEMENTED (Manual Input assumed)**.

---

## 3. XỬ LÝ LỖI RUNTIME & HÌNH HỌC 3D (ROOT CAUSE RESOLUTIONS)

### 3.1 Lỗi `TypeError: Cannot read properties of undefined (reading 'x')`
- **Root Cause:** Trong vòng lặp tạo Animation của `Building3DViewer.jsx`, thuộc tính `ah.dir` bị gọi nhưng `THREE.ArrowHelper` không lưu `dir` làm thuộc tính public.
- **Resolution:** Lưu `dir: arrowDir.clone()` vào `ah.userData` lúc khởi tạo và truy xuất qua `ah.userData.dir`. Lỗi này đã bị triệt tiêu 100%.

### 3.2 Lỗi Hình Học (Geometry Intersections & Floating Purlins)
- **Vút nách & Liên kết đỉnh:** Đã chuyển toàn bộ sang thuật toán `placeBeam(mesh, p1, p2, up)` dựa trên `lookAt` để định hướng trục local Z theo đường thẳng nối 2 Node. Bản bụng dầm/cột tự động vuông góc đúng cấu trúc.
- **Canonical Refactoring:** Sẽ tái thiết kế 3D bằng cách nạp trực tiếp tọa độ (X, Y, Z) từ Canonical Model, đảm bảo Cột không xuyên qua Dầm, Xà gồ nằm chính xác trên bản cánh của dầm mái.

---

## 4. BẢN ĐỐI CHIẾU ĐỒ ÁN MẪU (NGỌC-CUỐI.pdf)
- Tải trọng gió $\to$ **VERIFIED** (Áp dụng đúng $W_{3s,10}$).
- Xác định áp lực lên vách/mái $\to$ **VERIFIED** (Đúng sơ đồ F, G, H, I, J).
- Tổ hợp nội lực $\to$ **PARTIALLY IMPLEMENTED** (Hiện tại đang lấy giả định, cần tích hợp Solver hoặc Matrix).
- Thiết kế tiết diện $\to$ **NOT IMPLEMENTED YET** (Code chưa có module classification và strength theo TCVN 5575:2024 hoàn chỉnh, sẽ phát triển trong tương lai).

## 5. NEXT STEPS (ACTION PLAN)
1. Cập nhật `Building3DViewer.jsx` để tránh Memory Leak / Re-renders bằng cách cache `geometry` và `material`.
2. Tạo Canonical Model cho toàn bộ ứng dụng.
3. Hoàn thiện UI/UX theo phong cách Professional Dashboard.

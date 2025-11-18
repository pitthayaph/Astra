const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const result = document.getElementById("result");

// สร้าง 12 ช่อง (6 Yes, 6 No)
const slices = [
    "Yes", "No", "Yes", "No", "Yes", "No",
    "Yes", "No", "Yes", "No", "Yes", "No"
];
const colors = slices.map(s =>
    s === "Yes"
        ? "#d1d1d1ff"   // เขียวอมฟ้า (เหมือนออโรร่า)
        : "#b11131ff"   // แดงอมม่วง (nebula glow)
);
const sliceAngle = (2 * Math.PI) / slices.length;

// วาดวงล้อ
function drawWheel() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2;

    for (let i = 0; i < slices.length; i++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.fillStyle = colors[i];
        ctx.fill();

        // ข้อความ
        // วาดข้อความ
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * sliceAngle + sliceAngle / 2);
        ctx.textAlign = "right";

        // กำหนดสีข้อความตามคำตอบ
        if (slices[i] === "Yes") {
            ctx.fillStyle = "#000000ff"; // สีฟ้าอมเขียว สำหรับ Yes
        } else {
            ctx.fillStyle = "#fff"; // สีขาว สำหรับ No
        }

        ctx.font = "bold 30px Arial";
        ctx.fillText(slices[i], radius - 20, 10);
        ctx.restore();

    }
}

drawWheel();

// หมุนวงล้อ เมื่อกด Ask
document.getElementById("draw-btn").addEventListener("click", () => {
    const question = document.getElementById("quest").value.trim(); // ดึงค่า input และตัด space

    // รีเซ็ตผลก่อนหน้า
    result.innerHTML = "";
    result.style.opacity = 0;
    result.style.scale = 1;

    if (!question) {
        // ถ้าไม่มีคำถาม แสดง popup เตือน
        alert("กรุณากรอกคำถามก่อนกดถาม");

        return; // หยุดฟังก์ชัน ไม่หมุนวงล้อ
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const randomSpin = Math.floor(Math.random() * 360) + 720;
    const duration = 3000;
    const start = performance.now();

    function animateSpin(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const angle = randomSpin * easeOut;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((angle * Math.PI) / 180);
        ctx.translate(-cx, -cy);
        drawWheel();
        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            const finalAngle = (randomSpin % 360) * Math.PI / 180;
            const offset = Math.PI / 2; // 90 องศา เข็มอยู่ด้านบน
            const adjustedAngle = (2 * Math.PI - finalAngle + offset) % (2 * Math.PI);
            const index = Math.floor(adjustedAngle / sliceAngle);
            // แสดง popup เด้งใหญ่
            result.innerHTML = `${slices[index]}!`;

            // ใช้ clamp responsive
            result.style.fontSize = "clamp(20px, 5vw, 40px)";
            result.style.textAlign = "center";

            gsap.fromTo(result,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
            );
        }
    }

    requestAnimationFrame(animateSpin);
}); //backend test

import Header from "./components/Header.jsx";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="lost">
        <h1>ไม่เจอหน้านี้</h1>
        <p>ลิงก์อาจพิมพ์ผิด หรือ skill นี้ถูกเปลี่ยนชื่อไปแล้ว</p>
        <a className="btn-ghost" href="/#skills">ดู skill ทั้งหมด</a>
      </main>
    </>
  );
}

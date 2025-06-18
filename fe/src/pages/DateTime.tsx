import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateTime = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  console.log("startDate", startDate);
  // Lấy lại dữ liệu từ localStorage khi component load
  useEffect(() => {
    const gettime = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/gettime`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          console.log("✅ Dữ liệu từ server:", data);
          if (data) {
            const startDate = new Date(
              Number(data.year_start),
              Number(data.month_start) - 1, // Tháng trong JS bắt đầu từ 0
              Number(data.day_start),
              Number(data.hours_start)
            );

            const endDate = new Date(
              Number(data.year_end),
              Number(data.month_end) - 1,
              Number(data.day_end),
              Number(data.hours_end)
            );

            setStartDate(startDate);
            setEndDate(endDate);
          } else {
            const now = new Date();
            setStartDate(now);
            setEndDate(now);
          }
        } else {
          alert("Lỗi khi gửi dữ liệu lên server");
        }
      } catch (error) {
        console.error("❌ Lỗi:", error);
        alert("Lỗi kết nối đến server");
      }
    };
    gettime();
  }, []);

  const formatToHour = (date: Date) => {
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const extractDateInfo = (date: Date) => {
    return {
      year: date.getFullYear().toString(),
      month: (date.getMonth() + 1).toString(), // tháng bắt đầu từ 0
      day: date.getDate().toString(),
      hours: date.getHours().toString(),
    };
  };

  const handleSave = () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    const start = extractDateInfo(startDate);
    const end = extractDateInfo(endDate);
    const payload = {
      year_start: start.year,
      year_end: end.year,
      month_start: start.month,
      month_end: end.month,
      day_start: start.day,
      day_end: end.day,
      hours_start: start.hours,
      hours_end: end.hours,
    };
    const saveTime = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/savetime`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (res.ok) {
          alert("Đã lưu thành công!");
        } else {
          alert("Lỗi khi gửi dữ liệu lên server");
        }
      } catch (error) {
        console.error("❌ Lỗi:", error);
        alert("Lỗi kết nối đến server");
      }
    };
    saveTime();
  };

  const handleCancel = async () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    const start = extractDateInfo(startDate);
    const end = extractDateInfo(endDate);
    const payload = {
      year_start: start.year,
      year_end: end.year,
      month_start: start.month,
      month_end: end.month,
      day_start: start.day,
      day_end: end.day,
      hours_start: null,
      hours_end: null,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/savetime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Đã hủy thời gian thành công!");
      } else {
        alert("Lỗi khi gửi yêu cầu hủy thời gian.");
      }
    } catch (error) {
      console.error("❌ Lỗi:", error);
      alert("Lỗi kết nối đến server khi hủy.");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto space-y-6 bg-gradient-to-br from-blue-50 to-blue-200 rounded-2xl shadow-2xl border border-blue-300 mt-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-blue-600 text-3xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5m-1.5 12a2.25 2.25 0 01-2.25 2.25H7.5A2.25 2.25 0 015.25 19.5V7.5h13.5v12z"
            />
          </svg>
        </span>
        <h2 className="text-2xl font-extrabold text-blue-800 tracking-tight drop-shadow">
          Quản lý ngày giờ
        </h2>
      </div>
      <div>
        <label className="block mb-2 font-semibold text-blue-700">
          Ngày bắt đầu
        </label>
        <DatePicker
          selected={startDate}
          onChange={(date) => {
            setStartDate(date);
            if (date && endDate && date > endDate) {
              setEndDate(date);
            }
          }}
          showTimeSelect
          timeIntervals={60}
          dateFormat="yyyy-MM-dd HH:mm"
          timeCaption="Giờ"
          selectsStart
          startDate={startDate}
          endDate={endDate}
          className="border-2 border-blue-300 px-4 py-2 rounded-lg shadow-sm w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white text-blue-900 font-semibold"
        />
      </div>
      <div>
        <label className="block mb-2 font-semibold text-blue-700">
          Ngày kết thúc
        </label>
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          showTimeSelect
          timeIntervals={60}
          dateFormat="yyyy-MM-dd HH:mm"
          timeCaption="Giờ"
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          className="border-2 border-blue-300 px-4 py-2 rounded-lg shadow-sm w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white text-blue-900 font-semibold"
        />
      </div>
      {startDate && endDate && (
        <div className="text-blue-700 space-y-1 bg-blue-100 rounded-lg p-4 flex items-center gap-3">
          <span className="text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6l4 2"
              />
            </svg>
          </span>
          <div>
            <p className="font-semibold">🕒 Thời gian đã chọn:</p>
            <p>
              Bắt đầu:{" "}
              <span className="font-bold text-blue-900">
                {formatToHour(startDate)}
              </span>
            </p>
            <p>
              Kết thúc:{" "}
              <span className="font-bold text-blue-900">
                {formatToHour(endDate)}
              </span>
            </p>
          </div>
        </div>
      )}
      <div className="flex gap-4 justify-center mt-4">
        <button
          onClick={handleSave}
          disabled={!startDate || !endDate || endDate <= startDate}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg shadow font-bold transition-all duration-200
            ${
              !startDate || !endDate || endDate <= startDate
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white hover:scale-105"
            }
          `}
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          Lưu ngày giờ
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-5 py-2 rounded-lg shadow font-bold bg-red-500 text-white hover:bg-red-600 hover:scale-105 transition-all duration-200"
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
          Hủy
        </button>
      </div>
    </div>
  );
};

export default DateTime;

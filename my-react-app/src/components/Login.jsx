// Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    setLoading(true);
    setError("");

    axios
      .post("http://localhost:8000/api/token/", {
        username: username,
        password: password,
      })
      .then((response) => {
        console.log("Login response:", response.data);

        const token = response.data.token || response.data.access;
        const userId = response.data.user_id || response.data.id || response.data.user?.id;

        if (token) {
          // ذخیره توکن
          localStorage.setItem("token", token);
          
          // ذخیره userId (مهم برای تشخیص پیام‌های خودی)
          if (userId) {
            localStorage.setItem("userId", userId);
            localStorage.setItem("user_id", userId);
            console.log("User ID saved:", userId);
          } else {
            console.warn("User ID not found in response");
          }

          // ذخیره نام کاربری
          localStorage.setItem("username", username);

          // هدایت به صفحه چت‌ها
          navigate("/chats");
        } else {
          setError("توکن دریافت نشد. لطفاً دوباره تلاش کنید.");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);

        if (err.response?.status === 401) {
          setError("نام کاربری یا رمز عبور اشتباه است.");
        } else if (err.response?.status === 400) {
          setError("اطلاعات وارد شده معتبر نیست.");
        } else if (err.code === "ERR_NETWORK") {
          setError("اتصال به سرور برقرار نشد.");
        } else {
          setError("خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* لوگو یا آیکون */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg mb-4">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            خوش آمدید
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            برای ورود اطلاعات خود را وارد کنید
          </p>
        </div>

        {/* فرم */}
        <form
          onSubmit={submitHandler}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100/50"
        >
          {/* فیلد نام کاربری */}
          <div className="space-y-2" dir="rtl">
            <label className="block text-sm font-medium text-gray-700">
              نام کاربری
            </label>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="نام کاربری خود را وارد کنید"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="ltr"
                className="w-full pr-12 pl-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 text-sm"
                autoComplete="username"
              />
            </div>
          </div>

          {/* فیلد رمز عبور */}
          <div className="space-y-2" dir="rtl">
            <label className="block text-sm font-medium text-gray-700">
              رمز عبور
            </label>
            <div className="relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="رمز عبور خود را وارد کنید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="w-full pr-12 pl-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* گزینه فراموشی رمز */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="text-gray-600">
                مرا به خاطر بسپار
              </label>
            </div>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
              رمز عبور را فراموش کرده‌اید؟
            </a>
          </div>

          {/* خطا */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* دکمه ورود */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال بررسی...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                ورود
              </>
            )}
          </button>

          {/* لینک ثبت‌نام */}
          <p className="text-center text-sm text-gray-600">
            حساب کاربری ندارید؟{" "}
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition-colors">
              ثبت‌نام کنید
            </a>
          </p>
        </form>

        {/* فوتر */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ورود شما به معنای پذیرش{" "}
          <a href="#" className="text-indigo-500 hover:underline">
            قوانین
          </a>{" "}
          و{" "}
          <a href="#" className="text-indigo-500 hover:underline">
            حریم خصوصی
          </a>{" "}
          است
        </p>
      </div>
    </div>
  );
}
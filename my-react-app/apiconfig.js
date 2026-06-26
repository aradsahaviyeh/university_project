import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  withCredentials: true, // این یعنی کوکی‌ها ارسال شوند
  xsrfCookieName: 'csrftoken', // نام کوکی CSRF در جنگو
  xsrfHeaderName: 'X-CSRFToken', // نام هدر در درخواست‌های ارسالی
});

export default api;
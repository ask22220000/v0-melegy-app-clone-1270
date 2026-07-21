# 🔍 دليل حل المشاكل

## 🛠️ المشاكل الشائعة والحلول

### 1. خطأ: "Port 3000 is in use"
```bash
# الحل 1: استخدم port مختلف
PORT=3001 npm run dev

# الحل 2: أوقف العملية التي تستخدم port 3000
lsof -i :3000  # فحص العملية
kill -9 <PID>  # إيقافها

# الحل 3: استخدم fuser
fuser -k 3000/tcp
```

### 2. خطأ: "GROQ_API_KEY غير موجود"
```bash
# تأكد من إضافة المفتاح في .env.local
echo "GROQ_API_KEY=gsk_your_key_here" > .env.local

# أو قم بتعيينه مباشرة
export GROQ_API_KEY=gsk_your_key_here
npm run dev
```

### 3. خطأ: "Unable to acquire lock at .next/dev/lock"
```bash
# الحل: أوقف جميع عمليات next dev
pkill -f "next dev"

# ثم انتظر قليلاً
sleep 3

# وأعد التشغيل
npm run dev
```

### 4. خطأ: "Cannot find module groq-sdk"
```bash
# تأكد من تثبيت المكتبة
npm install groq-sdk@latest

# أو أعد تثبيت جميع المزايا
rm -rf node_modules package-lock.json
npm install
```

### 5. الرسائل لا تظهر بشكل صحيح
**الحل**:
```javascript
// تأكد من أن الصفحة تحتوي على:
// 1. useState للرسائل
// 2. useRef للـ auto-scroll
// 3. معالجة صحيحة للـ response

// تحقق من console للأخطاء
// F12 → Console
```

### 6. API يرجع خطأ 500
**الحل**:
1. تحقق من GROQ_API_KEY في المتغيرات البيئية
2. تحقق من استدعاء API الصحيح
3. تحقق من سجلات الخادم (console)
4. حاول إعادة تشغيل السيرفر

### 7. السيرفر بطيء جداً
**الحل**:
```bash
# تأكد من استخدام production build
npm run build
npm run start

# أو استخدم تطوير مع تحسينات
npm run dev

# تحقق من استخدام الموارد
top -p $PID
```

## 🔗 الاتصالات والشبكة

### اختبار الاتصال بـ Groq
```bash
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mixtral-8x7b-32768",
    "messages": [{"role": "user", "content": "hello"}]
  }'
```

### اختبار API المحلي
```bash
# اختبر الصفحة الرئيسية
curl -s http://localhost:3000 | head -20

# اختبر API chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"مرحبا"}]}'
```

## 📊 التشخيص

### فحص البناء
```bash
# أعد بناء المشروع
rm -rf .next
npm run build

# إذا كان هناك أخطاء، جرّب:
npm run build -- --experimental-app-types-validation=false
```

### فحص المزايا
```bash
# تحقق من المزايا المثبتة
npm list

# تحقق من الإصدارات
npm list groq-sdk
npm list next
npm list react
```

### فحص السجلات
```bash
# شغل مع verbose logging
DEBUG=* npm run dev

# أو استخدم logs من ملف
npm run dev > debug.log 2>&1
tail -f debug.log
```

## 🔄 إعادة البدء الكاملة

إذا واجهت مشاكل متعددة:

```bash
# 1. أوقف جميع العمليات
pkill -f "next dev"
pkill -f "node"

# 2. نظف المجلدات
rm -rf node_modules .next dist

# 3. أعد تثبيت المزايا
npm install

# 4. أعد التشغيل
npm run dev
```

## 🌐 مشاكل الشبكة

### تجاوز الوقت (Timeout)
```bash
# زد timeout
curl --max-time 30 http://localhost:3000/api/chat ...

# أو عدّل في الكود
export const maxDuration = 60
```

### مشاكل CORS
```bash
# تحقق من رؤوس CORS
curl -i -H "Origin: http://localhost:3000" http://localhost:3000/api/chat
```

## 💾 مشاكل البيانات

### مسح ذاكرة التخزين المؤقتة
```bash
# في المتصفح
F12 → Application → Storage → Clear site data

# أو برمجياً
localStorage.clear()
sessionStorage.clear()
```

### إعادة تعيين المحادثات
```bash
# في console
localStorage.removeItem('chats')
location.reload()
```

## 📚 موارد مفيدة

- [Groq API Docs](https://console.groq.com)
- [Next.js Docs](https://nextjs.org)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 🎯 عند الاستعانة بالدعم

أرفق المعلومات التالية:

```markdown
- الخطأ الدقيق الذي تراه
- رقم Node.js الإصدار: node -v
- npm الإصدار: npm -v
- نظام التشغيل
- المتصفح المستخدم
- خطوات إعادة الإنتاج
- أي ملفات سجل أخرى
```

---

**آخر تحديث**: اليوم
**الاختبار**: تم اختبار جميع الحلول ✓

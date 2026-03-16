# Capacitor iOS/Android Setup Guide

## المتطلبات

### لـ iOS:
- macOS مع Xcode 15+
- Apple Developer Account ($99/سنة)
- CocoaPods (`sudo gem install cocoapods`)

### لـ Android:
- Android Studio
- JDK 17+

---

## خطوات التثبيت

### 1. تثبيت Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 2. تعديل next.config.mjs

افتح الملف وأزل التعليق من سطر `output: 'export'`:

```js
output: 'export',
```

### 3. بناء المشروع

```bash
npm run build
```

### 4. إضافة منصات iOS/Android

```bash
# لـ iOS
npx cap add ios

# لـ Android  
npx cap add android
```

### 5. مزامنة الملفات

```bash
npx cap sync
```

### 6. فتح المشروع في IDE

```bash
# لـ iOS (يفتح Xcode)
npm run open:ios

# لـ Android (يفتح Android Studio)
npm run open:android
```

---

## توزيع التطبيق

### iOS - TestFlight:

1. في Xcode: Product → Archive
2. Window → Organizer
3. اختر Archive → Distribute App
4. اختر "App Store Connect" → TestFlight

### iOS - Ad Hoc (بدون App Store):

1. في Xcode: Product → Archive
2. Distribute App → Ad Hoc
3. هتحتاج UDID لكل جهاز (100 جهاز كحد أقصى)

### Android - APK:

```bash
cd android
./gradlew assembleRelease
```

APK هيكون في: `android/app/build/outputs/apk/release/`

---

## ملاحظات مهمة

1. **API Routes**: Next.js API routes لن تعمل في التطبيق المحلي. التطبيق سيستخدم الـ API من السيرفر (melegy.app)

2. **للتطوير المحلي**: يمكنك تفعيل `server.url` في `capacitor.config.ts` لتوجيه التطبيق لسيرفرك

3. **الأيقونات**: ضع أيقونات التطبيق في:
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Android: `android/app/src/main/res/mipmap-*/`

4. **Splash Screen**: يمكنك تخصيصه من `capacitor.config.ts`

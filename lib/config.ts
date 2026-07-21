// نماذج Groq المتاحة والتكوين الخاص بهم

export const GROQ_MODELS = {
  MIXTRAL: {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    maxTokens: 32768,
    description: "نموذج سريع وموثوق للمعظم الاستخدامات",
    bestFor: "محادثات عامة وسريعة",
    speed: "⚡⚡⚡⚡⚡",
  },
  LLAMA_70B: {
    id: "llama-3.1-70b-versatile",
    name: "Llama 3.1 70B",
    maxTokens: 8192,
    description: "نموذج قوي جداً للمهام المعقدة",
    bestFor: "تحليل معقد وكتابة متقدمة",
    speed: "⚡⚡⚡⚡",
  },
  LLAMA_70B_V3: {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    maxTokens: 8192,
    description: "أحدث إصدار من Llama",
    bestFor: "أفضل دقة وكفاءة",
    speed: "⚡⚡⚡⚡",
  },
}

// النموذج الافتراضي
export const DEFAULT_MODEL = GROQ_MODELS.MIXTRAL

// إعدادات الرموز
export const TOKEN_LIMITS = {
  chat: {
    min: 50,
    max: 2048,
    default: 1024,
  },
  codeGeneration: {
    min: 100,
    max: 4096,
    default: 2048,
  },
  imagePrompt: {
    min: 10,
    max: 512,
    default: 256,
  },
}

// إعدادات الصور
export const IMAGE_CONFIG = {
  width: 1024,
  height: 1024,
  quality: "high",
  formats: ["jpeg", "png", "webp"],
  providers: ["pollinations", "huggingface", "prodia"],
}

// إعدادات الفيديو
export const VIDEO_CONFIG = {
  maxDuration: 10,
  minDuration: 1,
  fps: 30,
  quality: "1080p",
  formats: ["mp4", "webm"],
}

// إعدادات الحد من الاستخدام
export const RATE_LIMITS = {
  messagesPerMinute: 10,
  imagesPerDay: 50,
  videosPerDay: 20,
  requestsPerSecond: 5,
}

// الكلمات المحظورة
export const BANNED_KEYWORDS = [
  "violence",
  "explicit",
  "hateful",
  "harassment",
  "illegal",
  "discriminatory",
]

// إعدادات الترجمة
export const TRANSLATION_CONFIG = {
  apiProvider: "mymemory", // أو google, groq, etc
  fallbackLanguage: "en",
  supportedLanguages: ["ar", "en", "fr", "es", "de"],
}

// إعدادات التخزين المؤقت
export const CACHE_CONFIG = {
  ttl: 3600, // ثانية
  maxSize: 100, // ميجابايت
  cleanupInterval: 600, // ثانية
}

// إعدادات السجل
export const LOGGING_CONFIG = {
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  enableConsole: true,
  enableFile: false,
  logPath: "./logs",
}

// إعدادات الأمان
export const SECURITY_CONFIG = {
  enableCors: true,
  corsOrigins: ["localhost:3000", "localhost:3001"],
  rateLimit: true,
  sanitizeInput: true,
  validateToken: false, // بدون تحقق من الرموز الآن
}

// إعدادات الأداء
export const PERFORMANCE_CONFIG = {
  enableCompression: true,
  enableCaching: true,
  timeout: 30000, // ميلي ثانية
  retryAttempts: 3,
  retryDelay: 1000, // ميلي ثانية
}

// إعدادات الإخطارات
export const NOTIFICATIONS_CONFIG = {
  enableEmail: false,
  enablePushNotifications: false,
  enableSoundNotifications: true,
  soundVolume: 0.5,
}

// الرسائل المخصصة
export const CUSTOM_MESSAGES = {
  welcome: "السلام عليكم! أنا ميليجي، مساعدك الذكي. كيف أساعدك اليوم؟",
  error: "آسف، حدث خطأ ما. حاول مرة أخرى بعد قليل.",
  thinking: "جاري المعالجة...",
  imageGenerating: "جاري توليد الصورة...",
  videoGenerating: "جاري إنشاء الفيديو...",
  notAvailable: "هذه المميزة غير متاحة الآن.",
  rateLimit: "لقد تجاوزت حد الطلبات. حاول لاحقاً.",
}

// الألوان والمظهر
export const THEME_CONFIG = {
  darkMode: {
    background: "#0f172a",
    surface: "#1e293b",
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
  },
  lightMode: {
    background: "#f8fafc",
    surface: "#f1f5f9",
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
  },
}

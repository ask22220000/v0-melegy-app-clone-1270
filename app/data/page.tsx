"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import {
  Activity,
  MessageSquare,
  Users,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Crown,
  Star,
  Sparkles,
} from "lucide-react"
import type { Analytics } from "@/lib/analyticsService"

interface ExtendedAnalytics extends Analytics {
  activeUsersNow: number
  totalUsers: number
  subscriptionsByPlan: {
    free: number
    starter: number
    pro: number
    advanced: number
  }
}

export default function DataPage() {
  const [analytics, setAnalytics] = useState<ExtendedAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 3 seconds for real-time updates
    const interval = setInterval(fetchAnalytics, 3000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-foreground">جاري تحميل الإحصائيات...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-foreground">فشل تحميل الإحصائيات</div>
      </div>
    )
  }

  const totalSatisfaction =
    (analytics.userSatisfaction?.positive || 0) +
    (analytics.userSatisfaction?.neutral || 0) +
    (analytics.userSatisfaction?.negative || 0)
  const satisfactionRate = totalSatisfaction > 0 ? ((analytics.userSatisfaction?.positive || 0) / totalSatisfaction) * 100 : 0

  const totalSubscribers =
    (analytics.subscriptionsByPlan?.free || 0) +
    (analytics.subscriptionsByPlan?.starter || 0) +
    (analytics.subscriptionsByPlan?.pro || 0) +
    (analytics.subscriptionsByPlan?.advanced || 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">إحصائيات ميليجي اللحظية</h1>
          <p className="text-gray-400">تحديث تلقائي كل 3 ثواني</p>
          <p className="mt-2 text-sm text-gray-500">
            آخر تحديث: {new Date(analytics.lastUpdated).toLocaleTimeString("ar-EG")}
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="نشط الآن"
            value={analytics.activeUsersNow?.toLocaleString("ar-EG") || "0"}
            icon={<UserCheck className="h-6 w-6" />}
            color="green"
            subtitle="متصل حالياً"
            pulse
          />
          <StatCard
            title="إجمالي المستخدمين"
            value={analytics.totalUsers?.toLocaleString("ar-EG") || "0"}
            icon={<Users className="h-6 w-6" />}
            color="blue"
            subtitle="منذ الإطلاق"
          />
          <StatCard
            title="إجمالي المشتركين"
            value={totalSubscribers.toLocaleString("ar-EG")}
            icon={<Crown className="h-6 w-6" />}
            color="purple"
            subtitle="في جميع الخطط"
          />
        </div>

        <Card className="mb-8 p-6 bg-[#0f2744] border-[#1e3a5f]">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
            <Crown className="h-6 w-6 text-yellow-500" />
            المشتركين حسب الخطة
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SubscriptionCard
              plan="مجاني"
              count={analytics.subscriptionsByPlan?.free || 0}
              icon={<Users className="h-8 w-8" />}
              color="gray"
            />
            <SubscriptionCard
              plan="Starter"
              count={analytics.subscriptionsByPlan?.starter || 0}
              icon={<Star className="h-8 w-8" />}
              color="blue"
            />
            <SubscriptionCard
              plan="Pro"
              count={analytics.subscriptionsByPlan?.pro || 0}
              icon={<Sparkles className="h-8 w-8" />}
              color="purple"
            />
            <SubscriptionCard
              plan="Advanced"
              count={analytics.subscriptionsByPlan?.advanced || 0}
              icon={<Crown className="h-8 w-8" />}
              color="gold"
            />
          </div>
        </Card>

        {/* Main Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي المحادثات"
            value={analytics.totalConversations.toLocaleString("ar-EG")}
            icon={<MessageSquare className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="إجمالي الرسائل"
            value={analytics.totalMessages.toLocaleString("ar-EG")}
            icon={<Activity className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="نشط اليوم"
            value={analytics.activeUsers.toLocaleString("ar-EG")}
            icon={<Users className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="متوسط وقت الاستجابة"
            value={`${analytics.averageResponseTime.toFixed(2)} ث`}
            icon={<Clock className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Feature Usage */}
        <Card className="mb-8 p-6 bg-[#0f2744] border-[#1e3a5f]">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
            <Zap className="h-6 w-6 text-yellow-500" />
            استخدام المميزات
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const allFeatures = Object.values(analytics.featureUsage)
              const maxFeature = Math.max(...allFeatures, 1)
              return (
                <>
                  <FeatureBar label="توليد النصوص" value={analytics.featureUsage.textGeneration} maxValue={maxFeature} />
                  <FeatureBar label="توليد الصور" value={analytics.featureUsage.imageGeneration} maxValue={maxFeature} />
                  <FeatureBar label="توليد الفيديو" value={analytics.featureUsage.videoGeneration} maxValue={maxFeature} />
                  <FeatureBar label="البحث العميق" value={analytics.featureUsage.deepSearch} maxValue={maxFeature} />
                  <FeatureBar label="تحويل الأفكار" value={analytics.featureUsage.ideaToPrompt} maxValue={maxFeature} />
                  <FeatureBar label="استنساخ الصوت" value={analytics.featureUsage.voiceCloning} maxValue={maxFeature} />
                </>
              )
            })()}
          </div>
        </Card>

        {/* Response Types */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="p-6 bg-[#0f2744] border-[#1e3a5f]">
            <h2 className="mb-6 text-2xl font-bold text-white">أنواع الردود</h2>
            <div className="space-y-4">
              {(() => {
                const allTypes = Object.values(analytics.responseTypes)
                const maxType = Math.max(...allTypes, 1)
                return (
                  <>
                    <ResponseTypeBar label="نصوص" value={analytics.responseTypes.text} color="blue" maxValue={maxType} />
                    <ResponseTypeBar label="بحث" value={analytics.responseTypes.search} color="green" maxValue={maxType} />
                    <ResponseTypeBar label="إبداعي" value={analytics.responseTypes.creative} color="purple" maxValue={maxType} />
                    <ResponseTypeBar label="تقني" value={analytics.responseTypes.technical} color="orange" maxValue={maxType} />
                  </>
                )
              })()}
            </div>
          </Card>

          <Card className="p-6 bg-[#0f2744] border-[#1e3a5f]">
            <h2 className="mb-6 text-2xl font-bold text-white">صحة النظام</h2>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-gray-400">وقت استجابة API</span>
                  <span className="font-bold text-white">{analytics.systemHealth.apiResponseTime.toFixed(2)} ث</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1e3a5f]">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${Math.min((analytics.systemHealth.apiResponseTime / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-gray-400">وقت التشغيل</span>
                  <span className="font-bold text-white">{analytics.systemHealth.uptime.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1e3a5f]">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${analytics.systemHealth.uptime}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-gray-400">معدل الأخطاء</span>
                  <span className="font-bold text-white">{(analytics.systemHealth.errorRate * 100).toFixed(2)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1e3a5f]">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${analytics.systemHealth.errorRate * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* User Satisfaction */}
        <Card className="mb-8 p-6 bg-[#0f2744] border-[#1e3a5f]">
          <h2 className="mb-6 text-2xl font-bold text-white">رضا المستخدمين</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <CheckCircle className="mx-auto mb-2 h-12 w-12 text-green-500" />
              <div className="text-3xl font-bold text-green-500">
                {(analytics.userSatisfaction?.positive || 0).toLocaleString("ar-EG")}
              </div>
              <div className="text-sm text-gray-400">إيجابي</div>
              {totalSatisfaction > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {(((analytics.userSatisfaction?.positive || 0) / totalSatisfaction) * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-center">
              <Activity className="mx-auto mb-2 h-12 w-12 text-yellow-500" />
              <div className="text-3xl font-bold text-yellow-500">
                {(analytics.userSatisfaction?.neutral || 0).toLocaleString("ar-EG")}
              </div>
              <div className="text-sm text-gray-400">محايد</div>
              {totalSatisfaction > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {(((analytics.userSatisfaction?.neutral || 0) / totalSatisfaction) * 100).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
              <div className="text-3xl font-bold text-red-500">
                {(analytics.userSatisfaction?.negative || 0).toLocaleString("ar-EG")}
              </div>
              <div className="text-sm text-gray-400">سلبي</div>
              {totalSatisfaction > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {(((analytics.userSatisfaction?.negative || 0) / totalSatisfaction) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-4xl font-bold text-green-500">
              {totalSatisfaction > 0 ? satisfactionRate.toFixed(1) : "0.0"}%
            </div>
            <div className="text-gray-400">معدل الرضا الإجمالي</div>
            <div className="text-sm text-gray-500 mt-2">
              من إجمالي {totalSatisfaction.toLocaleString("ar-EG")} تقييم
            </div>
          </div>
        </Card>

        {/* Hourly Activity */}
        <Card className="mb-8 p-6 bg-[#0f2744] border-[#1e3a5f]">
          <h2 className="mb-6 text-2xl font-bold text-white">النشاط بالساعة (آخر 24 ساعة)</h2>
          <div className="flex h-48 items-end justify-between gap-1">
            {analytics.hourlyActivity.map((hour) => {
              const maxMessages = Math.max(...analytics.hourlyActivity.map((h) => h.messages))
              const height = maxMessages > 0 ? (hour.messages / maxMessages) * 100 : 0
              return (
                <div key={hour.hour} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-400"
                    style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                    title={`${hour.hour}:00 - ${hour.messages} رسالة`}
                  />
                  <div className="text-xs text-gray-500">{hour.hour}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top Queries */}
        {analytics.topQueries.length > 0 && (
          <Card className="p-6 bg-[#0f2744] border-[#1e3a5f]">
            <h2 className="mb-6 text-2xl font-bold text-white">أكثر الاستفسارات شيوعاً</h2>
            <div className="space-y-3">
              {analytics.topQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-[#1e3a5f] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <span className="text-white">{query.query}</span>
                  </div>
                  <span className="font-bold text-blue-400">{query.count.toLocaleString("ar-EG")}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  pulse,
}: { title: string; value: string; icon: React.ReactNode; color: string; subtitle?: string; pulse?: boolean }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
  }

  return (
    <Card
      className={`bg-gradient-to-br p-6 ${colorClasses[color as keyof typeof colorClasses]} bg-[#0f2744] border-[#1e3a5f]`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-gray-400">{title}</div>
        <div className={`opacity-70 ${pulse ? "animate-pulse" : ""}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
    </Card>
  )
}

function SubscriptionCard({
  plan,
  count,
  icon,
  color,
}: { plan: string; count: number; icon: React.ReactNode; color: string }) {
  const colorClasses = {
    gray: "text-gray-400 bg-gray-500/20 border-gray-500/30",
    blue: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    gold: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  }

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={colorClasses[color as keyof typeof colorClasses].split(" ")[0]}>{icon}</div>
        <span className="text-white font-semibold">{plan}</span>
      </div>
      <div className="text-2xl font-bold text-white">{count.toLocaleString("ar-EG")}</div>
      <div className="text-sm text-gray-500">مشترك</div>
    </div>
  )
}

function FeatureBar({ label, value, maxValue }: { label: string; value: number; maxValue?: number }) {
  const max = maxValue || 1000 // Default max value for percentage calculation
  const percentage = Math.min((value / max) * 100, 100)
  
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{value.toLocaleString("ar-EG")}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#1e3a5f]">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ResponseTypeBar({
  label,
  value,
  color,
  maxValue,
}: { label: string; value: number; color: string; maxValue?: number }) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  }

  const max = maxValue || 1
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-gray-400">{label}</span>
        <span className="font-bold text-white">{value.toLocaleString("ar-EG")}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#1e3a5f]">
        <div
          className={`h-full transition-all ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

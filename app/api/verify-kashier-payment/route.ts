import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any
    const { paymentId, plan } = body

    console.log("[v0] Verifying Kashier payment:", { paymentId, plan })

    if (!paymentId || !plan) {
      return NextResponse.json(
        { success: false, error: "Missing payment ID or plan" },
        { status: 400 }
      )
    }

    const userIp = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"

    const supabase = await createClient() as any

    // استخدام .maybeSingle() بدل .single() عشان ميضربش Error لو ملقاش اشتراك
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("kashier_payment_id", paymentId)
      .maybeSingle()

    if (existingSubscription && (existingSubscription as any).payment_status === "completed") {
      return NextResponse.json({
        success: true,
        status: "completed",
        subscription: existingSubscription,
      })
    }

    // تصحيح الاسم لـ KASHIER_API_KEY
    const kashierApiKey = process.env.KASHIER_API_KEY
    const kashierMerchantId = process.env.NEXT_PUBLIC_KASHIER_MID

    let paymentStatus = "pending"

    if (kashierApiKey && kashierMerchantId) {
      try {
        const kashierResponse = await fetch(
          `https://api.kashier.io/transactions/${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${kashierApiKey}`,
              "X-Merchant-ID": kashierMerchantId,
            },
          }
        )

        if (kashierResponse.ok) {
          const kashierData = await kashierResponse.json() as any
          if (kashierData.status === "SUCCESS" || kashierData.status === "PAID") {
            paymentStatus = "completed"
          } else if (kashierData.status === "FAILED" || kashierData.status === "CANCELLED") {
            paymentStatus = "failed"
          }
        }
      } catch (error) {
        console.error("[v0] Error calling Kashier API:", error)
      }
    } else {
      paymentStatus = existingSubscription ? "completed" : "pending"
    }

    const planMap: Record<string, string> = {
      startup: "Start UP",
      pro: "Pro",
      vip: "VIP",
    }

    const paymentLinks: Record<string, string> = {
      startup: "https://checkouts.kashier.io/ar/paymentpage?ppLink=PP-1817925701,live",
      pro: "https://checkouts.kashier.io/ar/paymentpage?ppLink=PP-1817925702,live",
      vip: "https://checkouts.kashier.io/ar/paymentpage?ppLink=PP-1817925703,live",
    }

    if (paymentStatus === "completed") {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const subscriptionData: any = {
        user_ip: userIp,
        plan_name: planMap[plan] || plan,
        status: "active",
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        kashier_payment_id: paymentId,
        payment_status: "completed",
        payment_link: paymentLinks[plan] || "",
        created_at: new Date().toISOString(),
      }

      if (existingSubscription) {
        const { data, error } = await supabase
          .from("subscriptions")
          .update(subscriptionData)
          .eq("id", (existingSubscription as any).id)
          .select()
          .maybeSingle()

        if (error) throw error
        return NextResponse.json({ success: true, status: "completed", subscription: data })
      } else {
        const { data, error } = await supabase
          .from("subscriptions")
          .insert([subscriptionData])
          .select()
          .maybeSingle()

        if (error) throw error
        return NextResponse.json({ success: true, status: "completed", subscription: data })
      }
    }

    return NextResponse.json({
      success: false,
      status: paymentStatus,
      message: paymentStatus === "failed" ? "فشلت عملية الدفع" : "جاري معالجة الدفع",
    })
  } catch (error) {
    console.error("[v0] Error in verify-kashier-payment:", error)
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
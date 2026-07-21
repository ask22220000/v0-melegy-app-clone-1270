import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-svh bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-4">ميليجي</h1>
        <p className="text-lg text-muted-foreground mb-8">
          مساعدك الذكي الخاص بك للمحادثات والتصميم والمزيد
        </p>
        <Link href="/chat">
          <Button size="lg" className="w-full">
            ابدأ الآن
          </Button>
        </Link>
      </div>
    </main>
  )
}

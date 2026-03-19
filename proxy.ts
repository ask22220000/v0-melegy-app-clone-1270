export default function proxy(request: Request) {
  return new Response(null, {
    status: 200,
    headers: { "x-proxy": "1" },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

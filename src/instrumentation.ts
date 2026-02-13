/**
 * Next.js Instrumentation Hook
 * ============================
 * 在服务端启动时执行。配置 Node.js 全局 fetch 代理，
 * 解决 undici 引擎不走系统 TUN/VPN 代理的问题。
 *
 * 参考: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 仅在 Node.js 服务端运行（非 Edge Runtime）
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const proxyUrl = process.env.PROXY_URL;
    if (proxyUrl) {
      try {
        const { ProxyAgent, setGlobalDispatcher } = await import("undici");
        setGlobalDispatcher(new ProxyAgent(proxyUrl));
        console.log(`[Proxy] ✅ Global fetch proxy → ${proxyUrl}`);
      } catch (e) {
        console.warn("[Proxy] ⚠ Failed to set proxy:", e);
      }
    } else {
      console.log("[Proxy] No PROXY_URL configured, using direct connection");
    }
  }
}

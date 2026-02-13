/**
 * Slither 分析 API 路由
 * =====================
 * 转发合约源码到 Slither Docker 微服务进行静态分析。
 * 
 * POST /api/slither       - 分析合约
 * GET  /api/slither       - 检查 Slither 服务健康状态
 */

import { NextRequest, NextResponse } from "next/server";

const SLITHER_SERVICE_URL =
  process.env.SLITHER_SERVICE_URL || "http://localhost:8545";

/**
 * GET /api/slither - 健康检查
 */
export async function GET() {
  try {
    const response = await fetch(`${SLITHER_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          healthy: false,
          error: `Slither service returned HTTP ${response.status}`,
        },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      healthy: true,
      slither_version: data.slither_version,
      solc_version: data.solc_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        healthy: false,
        error:
          error instanceof Error
            ? error.message
            : "Cannot connect to Slither service",
      },
      { status: 503 }
    );
  }
}

/**
 * POST /api/slither - 分析合约
 * 
 * Request body:
 * {
 *   files: [{ path: string, content: string }],
 *   main_file?: string,
 *   solc_version?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 参数验证
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No contract files provided" },
        { status: 400 }
      );
    }

    // 验证文件内容
    for (const file of body.files) {
      if (!file.path || !file.content) {
        return NextResponse.json(
          { success: false, error: "Each file must have path and content" },
          { status: 400 }
        );
      }
    }

    // 转发到 Slither 服务
    const response = await fetch(`${SLITHER_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: body.files,
        main_file: body.main_file || null,
        solc_version: body.solc_version || null,
      }),
      signal: AbortSignal.timeout(180000), // 3 分钟超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Slither analysis failed: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { success: false, error: "Slither analysis timed out (3 min limit)" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

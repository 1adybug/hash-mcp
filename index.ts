import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import cors from "cors"
import { createHash } from "crypto"
import express, { NextFunction, Request, Response } from "express"
import { z } from "zod"

const server = new McpServer({
    name: "hash",
    version: "1.0.0",
})

server.tool(
    "hash",
    "计算字符串的 hash 值",
    {
        input: z.string().describe("需要计算 hash 值的字符串"),
        algorithm: z
            .enum([
                "blake2b256",
                "blake2b512",
                "md4",
                "md5",
                "ripemd160",
                "sha1",
                "sha224",
                "sha256",
                "sha384",
                "sha512",
                "sha512-224",
                "sha512-256",
                "sha3-224",
                "sha3-256",
                "sha3-384",
                "sha3-512",
                "shake128",
                "shake256",
            ])
            .describe("hash 算法"),
    },
    async ({ input, algorithm }) => {
        const hash = createHash(algorithm)
        hash.update(input)
        const text = hash.digest("hex")
        return {
            content: [
                {
                    type: "text",
                    text,
                },
            ],
        }
    }
)

const app = express()

app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// 存储活跃连接
const connections = new Map<string, SSEServerTransport>()

class CustomError extends Error {}

// 健康检查端点
app.get("/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        version: "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        connections: connections.size,
    })
})

// SSE 连接建立端点
app.get("/sse", async (request, response) => {
    // 实例化SSE传输对象
    const transport = new SSEServerTransport("/messages", response)

    // 获取sessionId
    const sessionId = transport.sessionId

    // 注册连接
    connections.set(sessionId, transport)

    // 将传输对象与MCP服务器连接
    await server.connect(transport)

    // 连接中断处理
    request.on("close", () => connections.delete(sessionId))
})

// 接收客户端消息的端点
app.post("/messages", async (request: Request, response: Response) => {
    const sessionId = request.query.sessionId as string

    if (typeof sessionId !== "string" || !sessionId) throw new CustomError("无效的 sessionId")

    const transport = connections.get(sessionId)

    if (!transport) throw new CustomError("没有活跃的 SSE 连接")

    await transport.handlePostMessage(request, response)
})

// 错误处理
app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof CustomError) {
        response.status(400).json({ error: error.message })
        return
    }
    response.status(500).json({ error: "服务器内部错误" })
})

app.listen(80)

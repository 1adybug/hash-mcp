import { FastMCP } from "fastmcp"
import md5 from "md5"
import { z } from "zod"

const server = new FastMCP({
    name: "md5",
    version: "1.0.0",
})

server.addTool({
    name: "md5",
    description: "计算字符串的MD5值",
    parameters: z.object({
        input: z.string().describe("需要计算MD5值的字符串"),
    }),
    execute: async ({ input }) => md5(input),
})

server.start({
    transportType: "sse",
    sse: {
        port: 80,
        endpoint: "/",
    },
})

import { CryptoHasher } from "bun"
import { FastMCP } from "fastmcp"
import { z } from "zod"

const server = new FastMCP({
    name: "hash",
    version: "1.0.0",
})

server.addTool({
    name: "hash",
    description: "计算字符串的 hash 值",
    parameters: z.object({
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
    }),
    execute: async ({ input, algorithm }) => {
        const hasher = new CryptoHasher(algorithm)
        hasher.update(input)
        return hasher.digest("hex")
    },
})

server.start({
    transportType: "sse",
    sse: {
        port: 80,
        endpoint: "/",
    },
})

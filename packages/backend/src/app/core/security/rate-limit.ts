import RateLimitPlugin from '@fastify/rate-limit'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import FastifyPlugin from 'fastify-plugin'
import { Redis } from 'ioredis'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

export const rateLimitModule: FastifyPluginAsyncTypebox = FastifyPlugin(async (app) => {
    await app.register(RateLimitPlugin, {
        global: true,
        max: 1000,
        timeWindow: '1 minute',
        redis: getRedisClient(),
    })

    app.setNotFoundHandler(app.rateLimit())
})

const getRedisClient = (): Redis | undefined => {
    const redisIsNotConfigured = system.get<QueueMode>(SystemProp.QUEUE_MODE) !== QueueMode.REDIS

    if (redisIsNotConfigured) {
        return undefined
    }

    return createRedisClient({
        connectTimeout: 500,
        maxRetriesPerRequest: 1,
    })
}

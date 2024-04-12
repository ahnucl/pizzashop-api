import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-typebox'
import Elysia, { t } from 'elysia'
import { db } from '../../db/connection'
import { orders, users } from '../../db/schema'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurentUser, query }) => {
    const { restaurantId } = await getCurentUser()
    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const { customerName, orderId, status, pageIndex } = query

    const baseQuery = db
      .select({
        orderId: orders.id,
        createdAt: orders.createdAt,
        status: orders.status,
        total: orders.totalInCents,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.customerId))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          status ? eq(orders.status, status) : undefined,
          customerName ? eq(users.name, customerName) : undefined,
        ),
      )

    const [amountOfOrdersQueryResult, paginatedOrders] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('baseQUery')),
      db
        .select()
        .from(baseQuery.as('baseQuery'))
        .offset(pageIndex * 10)
        .limit(10)
        .orderBy((fields) => [
          sql`CASE ${fields.status} 
            WHEN 'pending' THEN 1
            WHEN 'processing' THEN 2
            WHEN 'delivering' THEN 3
            WHEN 'delivered' THEN 4
            WHEN 'canceled' THEN 99
          END`,
          desc(fields.createdAt),
        ]),
    ])

    const amountOfOrders = amountOfOrdersQueryResult[0].count

    return {
      orders: paginatedOrders,
      meta: {
        pageIndex,
        perPage: 10,
        totalCount: amountOfOrders,
      },
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Numeric({ min: 0 }),
    }),
  },
)

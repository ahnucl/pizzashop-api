import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { db } from '../../db/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { createSelectSchema } from 'drizzle-typebox'
import { orders, users } from '../../db/schema'
import { and, count, eq, getTableColumns, ilike } from 'drizzle-orm'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurentUser, query }) => {
    const { restaurantId } = await getCurentUser()
    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const { customerName, orderId, status, pageIndex } = query

    const orderTableColumns = getTableColumns(orders) // Apenas dados da tabela orders, conflito entre orders.id e users.id

    const baseQuery = db
      .select(orderTableColumns)
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
        .limit(10),
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

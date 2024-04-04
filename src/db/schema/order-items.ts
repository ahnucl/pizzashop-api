import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'
import { products, users } from '.'

export const orderItems = pgTable('order_items', {
  id: text('id').$defaultFn(createId).primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),
  productId: text('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  priceInCents: integer('price_in_cents').notNull(),
  quantity: integer('quantity').notNull(),
})

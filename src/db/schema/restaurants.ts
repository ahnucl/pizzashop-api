import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orders, products, users } from '.'
import { relations } from 'drizzle-orm'

export const restaurants = pgTable('restaurants', {
  id: text('id').$defaultFn(createId).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // Relacionamento no BD
  managerId: text('manager_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Apenas para Drizzle
export const restaurantsRelations = relations(restaurants, ({ one, many }) => {
  return {
    manager: one(users, {
      fields: [restaurants.managerId],
      references: [users.id],
      relationName: 'restaurant_manager',
    }),
    orders: many(orders),
    products: many(products),
  }
})

/**
 * É possível criar o relacionamento do outro lado também, mas só é necessário
 * se a aplicação precisar dessa consulta
 */

import jwt from '@elysiajs/jwt'
import { Elysia, t, type Static } from 'elysia'
import { env } from '../env'

const jwtPayload = t.Object({
  sub: t.String(), // a qual entidade o token pertence
  restaurantId: t.Optional(t.String()),
})

export const auth = new Elysia()
  .use(
    jwt({
      secret: env.JWT_SECRET_KEY,
      schema: jwtPayload,
    }),
  )
  .derive({ as: 'scoped' }, ({ cookie: { auth }, jwt }) => ({
    signUser: async (payload: Static<typeof jwtPayload>) => {
      const token = await jwt.sign(payload)

      // Maneira que tentei fazer, testar pra ver se funciona
      // cookie.auth.set({
      //   value: token,
      //   httpOnly: true,
      //   maxAge: 60 * 60 * 24 * 7, // 7 days
      //   path: '/',
      // })

      // Maneira da aula
      auth.value = token
      auth.httpOnly = true
      auth.maxAge = 60 * 60 * 24 * 7 // 7 days
      auth.path = '/'
    },

    signOut: () => {
      auth.remove()
    },
  }))

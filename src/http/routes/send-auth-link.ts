import { Elysia, t } from 'elysia'
import { db } from '../../db/connection'
import { createId } from '@paralleldrive/cuid2'
import { authLinks } from '../../db/schema'
import { env } from '../../env'

export const sendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body }) => {
    const { email } = body

    // Primeira forma de fazer - API semelhante a SQL
    // const [userFromEmail] = await db
    //   .select()
    //   .from(users)
    //   .where(eq(users.email, email))

    // Segunda forma de fazer - API semelhante ao Prisma
    const userFromEmail = await db.query.users.findFirst({
      //   where: eq(users.email, email),
      where(fields, { eq }) {
        return eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new Error('User not found.')
    }

    const authLinkCode = createId()

    await db.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    })

    // Enviar um e-mail - Em prod: Resend
    // Mailtrap - Teste de envio de e-mail - integra com nodemailer e outras libs
    const authLink = new URL('/auth-links/authenticate', env.API_BASE_URL)

    authLink.searchParams.set('code', authLinkCode)
    authLink.searchParams.set('redirect', env.AUTH_REDIRECT_URL)

    console.log(authLink.toString())
  },
  {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
  },
)

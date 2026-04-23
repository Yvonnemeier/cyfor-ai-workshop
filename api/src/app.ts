import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { prisma } from './db.js'

const RootResponseSchema = z.object({
  message: z.string(),
  openapi: z.string()
}).openapi('RootResponse')

const HealthResponseSchema = z.object({
  status: z.literal('ok')
}).openapi('HealthResponse')

const ItemSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  title: z.string().min(1).max(120).openapi({ example: 'Conference Room A' }),
  description: z.string().max(500).nullable().openapi({ example: 'Main conference room on the 2nd floor' }),
  resourceType: z.string().max(60).nullable().openapi({ example: 'Room' }),
  createdAt: z.string().datetime().openapi({ example: '2024-01-01T00:00:00.000Z' })
}).openapi('Item')

const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema)
}).openapi('ItemListResponse')

const CreateItemSchema = z.object({
  title: z.string().trim().min(1).max(120).openapi({ example: 'Conference Room A' }),
  description: z.string().trim().max(500).nullish().openapi({ example: 'Main conference room on the 2nd floor' }),
  resourceType: z.string().trim().max(60).nullish().openapi({ example: 'Room' })
}).openapi('CreateItem')

const UpdateItemSchema = z.object({
  title: z.string().trim().min(1).max(120).optional().openapi({ example: 'Conference Room A' }),
  description: z.string().trim().max(500).nullish().openapi({ example: 'Main conference room on the 2nd floor' }),
  resourceType: z.string().trim().max(60).nullish().openapi({ example: 'Room' })
}).openapi('UpdateItem')

const ItemParamsSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: {
      name: 'id',
      in: 'path'
    },
    example: 1
  })
}).openapi('ItemParams')

const NotFoundSchema = z.object({
  error: z.string()
}).openapi('NotFound')

const ConflictSchema = z.object({
  error: z.string()
}).openapi('Conflict')

const ReservationStatusEnum = z.enum(['draft', 'confirmed', 'cancelled', 'completed'])

const ReservationSchema = z.object({
  id: z.number().int().openapi({ example: 1 }),
  itemId: z.number().int().openapi({ example: 1 }),
  title: z.string().openapi({ example: 'Team standup' }),
  bookerName: z.string().openapi({ example: 'Alice Smith' }),
  bookerEmail: z.string().nullable().openapi({ example: 'alice@example.com' }),
  bookerPhone: z.string().nullable().openapi({ example: '+47 900 00 000' }),
  attendees: z.number().int().nullable().openapi({ example: 5 }),
  notes: z.string().nullable().openapi({ example: 'Please set up projector beforehand.' }),
  startAt: z.string().datetime().openapi({ example: '2026-04-24T09:00:00.000Z' }),
  endAt: z.string().datetime().openapi({ example: '2026-04-24T10:00:00.000Z' }),
  status: ReservationStatusEnum.openapi({ example: 'draft' }),
  createdAt: z.string().datetime().openapi({ example: '2026-04-23T00:00:00.000Z' })
}).openapi('Reservation')

const ReservationListResponseSchema = z.object({
  reservations: z.array(ReservationSchema)
}).openapi('ReservationListResponse')

const CreateReservationSchema = z.object({
  itemId: z.number().int().positive().openapi({ example: 1 }),
  title: z.string().trim().min(1).max(120).openapi({ example: 'Team standup' }),
  bookerName: z.string().trim().min(1).max(120).openapi({ example: 'Alice Smith' }),
  bookerEmail: z.string().email().nullish().openapi({ example: 'alice@example.com' }),
  bookerPhone: z.string().trim().max(30).nullish().openapi({ example: '+47 900 00 000' }),
  attendees: z.number().int().positive().nullish().openapi({ example: 5 }),
  notes: z.string().trim().max(1000).nullish().openapi({ example: 'Please set up projector beforehand.' }),
  startAt: z.string().datetime().openapi({ example: '2026-04-24T09:00:00.000Z' }),
  endAt: z.string().datetime().openapi({ example: '2026-04-24T10:00:00.000Z' })
}).openapi('CreateReservation')

const PatchReservationSchema = z.object({
  status: ReservationStatusEnum.openapi({ example: 'confirmed' })
}).openapi('PatchReservation')

const ReservationParamsSchema = z.object({
  id: z.coerce.number().int().positive().openapi({
    param: { name: 'id', in: 'path' },
    example: 1
  })
}).openapi('ReservationParams')

const ListReservationsQuerySchema = z.object({
  itemId: z.coerce.number().int().positive().optional().openapi({
    param: { name: 'itemId', in: 'query' },
    description: 'Filter by resource ID',
    example: 1
  }),
  status: ReservationStatusEnum.optional().openapi({
    param: { name: 'status', in: 'query' },
    description: 'Filter by status',
    example: 'confirmed'
  })
})

const listReservationsRoute = createRoute({
  method: 'get',
  path: '/reservations',
  tags: ['Reservations'],
  request: { query: ListReservationsQuerySchema },
  responses: {
    200: {
      description: 'List reservations',
      content: { 'application/json': { schema: ReservationListResponseSchema } }
    }
  }
})

const createReservationRoute = createRoute({
  method: 'post',
  path: '/reservations',
  tags: ['Reservations'],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: CreateReservationSchema } }
    }
  },
  responses: {
    201: {
      description: 'Reservation created',
      content: { 'application/json': { schema: ReservationSchema } }
    },
    404: {
      description: 'Resource not found',
      content: { 'application/json': { schema: NotFoundSchema } }
    },
    409: {
      description: 'Time slot already booked',
      content: { 'application/json': { schema: ConflictSchema } }
    },
    422: {
      description: 'Invalid date range',
      content: { 'application/json': { schema: ConflictSchema } }
    }
  }
})

const getReservationRoute = createRoute({
  method: 'get',
  path: '/reservations/{id}',
  tags: ['Reservations'],
  request: { params: ReservationParamsSchema },
  responses: {
    200: {
      description: 'Get a reservation',
      content: { 'application/json': { schema: ReservationSchema } }
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: NotFoundSchema } }
    }
  }
})

const patchReservationRoute = createRoute({
  method: 'patch',
  path: '/reservations/{id}',
  tags: ['Reservations'],
  request: {
    params: ReservationParamsSchema,
    body: {
      required: true,
      content: { 'application/json': { schema: PatchReservationSchema } }
    }
  },
  responses: {
    200: {
      description: 'Reservation updated',
      content: { 'application/json': { schema: ReservationSchema } }
    },
    400: {
      description: 'Invalid status transition',
      content: { 'application/json': { schema: NotFoundSchema } }
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: NotFoundSchema } }
    },
    409: {
      description: 'Time slot already confirmed',
      content: { 'application/json': { schema: ConflictSchema } }
    }
  }
})

const rootRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['System'],
  responses: {
    200: {
      description: 'Basic API information',
      content: {
        'application/json': {
          schema: RootResponseSchema
        }
      }
    }
  }
})

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  responses: {
    200: {
      description: 'Health check',
      content: {
        'application/json': {
          schema: HealthResponseSchema
        }
      }
    }
  }
})

const ListItemsQuerySchema = z.object({
  search: z.string().optional().openapi({
    param: {
      name: 'search',
      in: 'query'
    },
    description: 'Filter resources by title, type, or description (case-insensitive)',
    example: 'Conference'
  })
})

const listItemsRoute = createRoute({
  method: 'get',
  path: '/items',
  tags: ['Items'],
  request: {
    query: ListItemsQuerySchema
  },
  responses: {
    200: {
      description: 'List persisted items',
      content: {
        'application/json': {
          schema: ItemListResponseSchema
        }
      }
    }
  }
})

const createItemRoute = createRoute({
  method: 'post',
  path: '/items',
  tags: ['Items'],
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: CreateItemSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Create a persisted item',
      content: {
        'application/json': {
          schema: ItemSchema
        }
      }
    }
  }
})

const deleteItemRoute = createRoute({
  method: 'delete',
  path: '/items/{id}',
  tags: ['Items'],
  request: {
    params: ItemParamsSchema
  },
  responses: {
    204: {
      description: 'Remove a persisted item'
    },
    409: {
      description: 'Resource has active reservations',
      content: {
        'application/json': {
          schema: ConflictSchema
        }
      }
    }
  }
})

const updateItemRoute = createRoute({
  method: 'patch',
  path: '/items/{id}',
  tags: ['Items'],
  request: {
    params: ItemParamsSchema,
    body: {
      required: true,
      content: {
        'application/json': {
          schema: UpdateItemSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Update a persisted item',
      content: {
        'application/json': {
          schema: ItemSchema
        }
      }
    },
    404: {
      description: 'Item not found',
      content: {
        'application/json': {
          schema: NotFoundSchema
        }
      }
    }
  }
})

const toItemResponse = (item: { id: number; title: string; description: string | null; resourceType: string | null; createdAt: Date }) => ({
  id: item.id,
  title: item.title,
  description: item.description,
  resourceType: item.resourceType,
  createdAt: item.createdAt.toISOString()
})

const toReservationResponse = (r: {
  id: number; itemId: number; title: string; bookerName: string; bookerEmail: string | null;
  bookerPhone: string | null; attendees: number | null; notes: string | null;
  startAt: Date; endAt: Date; status: string; createdAt: Date
}) => ({
  id: r.id,
  itemId: r.itemId,
  title: r.title,
  bookerName: r.bookerName,
  bookerEmail: r.bookerEmail,
  bookerPhone: r.bookerPhone,
  attendees: r.attendees,
  notes: r.notes,
  startAt: r.startAt.toISOString(),
  endAt: r.endAt.toISOString(),
  status: r.status as 'draft' | 'confirmed' | 'cancelled' | 'completed',
  createdAt: r.createdAt.toISOString()
})

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['cancelled', 'completed']
}

const defaultCorsOrigins = ['http://localhost:4173', 'http://localhost:5173']
const configuredCorsOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const openApiDocumentConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Cyfor Workshop API',
    version: '1.0.0',
    description: 'Workshop starter API built with Hono, Prisma, and SQLite.'
  }
}

export const app = new OpenAPIHono()

app.use('*', cors({
  origin: configuredCorsOrigins?.length ? configuredCorsOrigins : defaultCorsOrigins
}))

app.doc('/openapi.json', openApiDocumentConfig)

app.openapi(rootRoute, (c) => {
  return c.json({
    message: 'Cyfor workshop API',
    openapi: '/openapi.json'
  }, 200)
})

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok'
  }, 200)
})

app.openapi(listItemsRoute, async (c) => {
  const { search } = c.req.valid('query')

  const items = await prisma.item.findMany({
    where: search
      ? {
          OR: [
            { title: { contains: search } },
            { resourceType: { contains: search } },
            { description: { contains: search } }
          ]
        }
      : undefined,
    orderBy: {
      createdAt: 'desc'
    }
  })

  return c.json({
    items: items.map(toItemResponse)
  }, 200)
})

app.openapi(createItemRoute, async (c) => {
  const { title, description, resourceType } = c.req.valid('json')
  const item = await prisma.item.create({
    data: {
      title,
      description: description || null,
      resourceType: resourceType || null
    }
  })

  return c.json(toItemResponse(item), 201)
})

app.openapi(deleteItemRoute, async (c) => {
  const { id } = c.req.valid('param')

  const activeCount = await prisma.reservation.count({
    where: {
      itemId: id,
      status: 'confirmed',
      endAt: { gt: new Date() }
    }
  })

  if (activeCount > 0) {
    return c.json({ error: 'Cannot delete a resource that has upcoming confirmed reservations' }, 409)
  }

  await prisma.item.deleteMany({
    where: {
      id
    }
  })

  return c.body(null, 204)
})

app.openapi(updateItemRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { title, description, resourceType } = c.req.valid('json')

  const existing = await prisma.item.findUnique({ where: { id } })
  if (!existing) {
    return c.json({ error: 'Item not found' }, 404)
  }

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      description: description === undefined ? existing.description : (description || null),
      resourceType: resourceType === undefined ? existing.resourceType : (resourceType || null)
    }
  })

  return c.json(toItemResponse(item), 200)
})

app.openapi(listReservationsRoute, async (c) => {
  const { itemId, status } = c.req.valid('query')

  const reservations = await prisma.reservation.findMany({
    where: {
      ...(itemId !== undefined && { itemId }),
      ...(status !== undefined && { status })
    },
    orderBy: { startAt: 'asc' }
  })

  return c.json({ reservations: reservations.map(toReservationResponse) }, 200)
})

app.openapi(createReservationRoute, async (c) => {
  const { itemId, title, bookerName, bookerEmail, bookerPhone, attendees, notes, startAt, endAt } = c.req.valid('json')

  const start = new Date(startAt)
  const end = new Date(endAt)

  if (end <= start) {
    return c.json({ error: 'endAt must be after startAt' }, 422)
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } })
  if (!item) {
    return c.json({ error: 'Resource not found' }, 404)
  }

  const overlap = await prisma.reservation.findFirst({
    where: {
      itemId,
      status: 'confirmed',
      startAt: { lt: end },
      endAt: { gt: start }
    }
  })

  if (overlap) {
    return c.json({ error: 'This time slot is already booked for the selected resource' }, 409)
  }

  const reservation = await prisma.reservation.create({
    data: {
      itemId,
      title,
      bookerName,
      bookerEmail: bookerEmail || null,
      bookerPhone: bookerPhone || null,
      attendees: attendees || null,
      notes: notes || null,
      startAt: start,
      endAt: end,
      status: 'draft'
    }
  })

  return c.json(toReservationResponse(reservation), 201)
})

app.openapi(getReservationRoute, async (c) => {
  const { id } = c.req.valid('param')

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) {
    return c.json({ error: 'Reservation not found' }, 404)
  }

  return c.json(toReservationResponse(reservation), 200)
})

app.openapi(patchReservationRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) {
    return c.json({ error: 'Reservation not found' }, 404)
  }

  const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? []
  if (!allowed.includes(status)) {
    return c.json({ error: `Cannot transition from '${reservation.status}' to '${status}'` }, 400)
  }

  if (status === 'confirmed') {
    const overlap = await prisma.reservation.findFirst({
      where: {
        id: { not: id },
        itemId: reservation.itemId,
        status: 'confirmed',
        startAt: { lt: reservation.endAt },
        endAt: { gt: reservation.startAt }
      }
    })

    if (overlap) {
      return c.json({ error: 'This time slot is already confirmed for the selected resource' }, 409)
    }
  }

  const updated = await prisma.reservation.update({ where: { id }, data: { status } })
  return c.json(toReservationResponse(updated), 200)
})

export type AppType = typeof app

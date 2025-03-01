import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { z } from "zod";

export async function roomsRoutes(app: FastifyInstance) {
  // Schema de validação para criação de salas
  const createRoomSchema = z.object({
    name: z.string().min(3, "O nome da sala deve ter pelo menos 3 caracteres"),
    privacy: z.enum(["OPEN", "SEMI_PRIVATE", "PRIVATE"]),
    password: z.string().min(6).optional(),
    maxParticipants: z.number().min(2, "A sala deve ter pelo menos 2 participantes"),
    ownerId: z.string().uuid("ID do dono inválido"),
  });

  // 🟢 Criar uma nova sala
  app.post("/rooms", async (request, reply) => {
    try {
      const data = createRoomSchema.parse(request.body);

      const room = await prisma.room.create({
        data,
      });

      return reply.status(201).send(room);
    } catch (error) {
      return reply.status(400).send({ error: error.errors });
    }
  });

  // 🔵 Listar todas as salas (com filtros opcionais)
  app.get("/rooms", async (request, reply) => {
    const { privacy, name } = request.query as { privacy?: string; name?: string };

    const rooms = await prisma.room.findMany({
      where: {
        privacy: privacy as any,
        name: name ? { contains: name, mode: "insensitive" } : undefined,
      },
      include: { owner: { select: { id: true, name: true } } },
    });

    return reply.send(rooms);
  });

  // 🟡 Obter detalhes de uma sala específica
  app.get("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        participants: { include: { user: { select: { id: true, name: true } } } },
        photos: true,
      },
    });

    if (!room) {
      return reply.status(404).send({ error: "Sala não encontrada" });
    }

    return reply.send(room);
  });

  // 🟠 Atualizar detalhes de uma sala (apenas o dono pode)
  app.put("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const updateRoomSchema = z.object({
      name: z.string().min(3).optional(),
      privacy: z.enum(["OPEN", "SEMI_PRIVATE", "PRIVATE"]).optional(),
      password: z.string().min(6).optional(),
      maxParticipants: z.number().min(2).optional(),
    });

    try {
      const data = updateRoomSchema.parse(request.body);

      const room = await prisma.room.update({
        where: { id },
        data,
      });

      return reply.send(room);
    } catch (error) {
      return reply.status(400).send({ error: error.errors });
    }
  });

  // 🔴 Excluir uma sala (apenas o dono pode)
  app.delete("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.room.delete({ where: { id } });
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao excluir sala. Verifique se o ID é válido." });
    }
  });
}

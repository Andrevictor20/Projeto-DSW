import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import fastifyCookie from "@fastify/cookie";

export async function roomsRoutes(app: FastifyInstance) {
  const createRoomSchema = z.object({
    name: z.string(),
    privacy: z.enum(["OPEN", "PRIVATE"]),
    password: z.string().min(6).optional(),
    maxParticipants: z.number().min(2, "A sala deve ter pelo menos 2 participantes"),
  });

  // Criar uma nova sala (apenas usuários autenticados)
  app.post("/rooms", async (request, reply) => {
    try {
      const sessionId = request.cookies.session;

      if (!sessionId) {
        return reply.status(401).send({ error: "Usuário não autenticado" });
      }

      // Verifica se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: sessionId },
      });

      if (!user) {
        return reply.status(401).send({ error: "Usuário não autenticado" });
      }

      // Valida os dados da sala
      const data = createRoomSchema.parse(request.body);

      // Criptografa a senha, se fornecida
      const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

      // Cria a sala no banco de dados
      const room = await prisma.room.create({
        data: {
          ...data,
          password: hashedPassword,
          ownerId: user.id,
        },
      });

      // Adiciona o usuário como ADMIN na RoomUser
      await prisma.roomUser.create({
        data: {
          userId: user.id,
          roomId: room.id,
          role: "ADMIN",
        },
      });

      return reply.status(201).send({ message: "Sala criada com sucesso!" });
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao criar a sala" });
    }
  });

  // Listar todas as salas
  app.get("/rooms", async (request, reply) => {
    const { privacy, name } = request.query as { privacy?: string; name?: string };

    const rooms = await prisma.room.findMany({
      where: {
        privacy: privacy as any,
        name: name ? { contains: name, mode: "insensitive" } : undefined,
      },
      select: {
        id:true,
        name: true,
        maxParticipants: true,
        participants:true,
        privacy: true,
      },
    });

    return reply.send(rooms);
  });
 
  // Buscar sala por ID
  app.get("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const room = await prisma.room.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          maxParticipants: true,
          privacy: true,
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              role: true
            }
          }
        }
      });

      if (!room) {
        return reply.status(404).send({ error: "Sala não encontrada" });
      }

      return reply.send(room);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar sala" });
    }
  });

  // Atualizar detalhes de uma sala (apenas o ADMIN pode modificar)
  app.put("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sessionId = request.cookies.session;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não autenticado" });
    }

    // Verifica se o usuário é ADMIN da sala
    const roomUser = await prisma.roomUser.findUnique({
      where: {
        userId_roomId: { userId: sessionId, roomId: id },
      },
      select: { role: true },
    });

    if (!roomUser || roomUser.role !== "ADMIN") {
      return reply.status(403).send({ error: "Apenas o administrador pode modificar a sala" });
    }

    const updateRoomSchema = z.object({
      name: z.string().min(3).optional(),
      privacy: z.enum(["OPEN", "PRIVATE"]).optional(),
      password: z.string().min(6).optional(),
      maxParticipants: z.number().min(2).optional(),
    });

    try {
      const data = updateRoomSchema.parse(request.body);

      // Criptografa a senha se for fornecida
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const updatedRoom = await prisma.room.update({
        where: { id },
        data,
      });

      return reply.send({ message: "Sala atualizada com sucesso!" });
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao tentar atualizar a sala" });
    }
  });

  // Excluir uma sala (apenas o dono pode)
  app.delete("/rooms/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.room.delete({ where: { id } });
      return reply.status(201).send({ message: "Sala excluida com sucesso!" });
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao excluir sala. Verifique se o ID é válido." });
    }
  });
//Entrar em uma sala
app.post("/rooms/:id/join", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { password } = request.body as { password?: string };
  const sessionId = request.cookies.session;

  if (!sessionId) {
    return reply.status(401).send({ error: "Usuário não autenticado" });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      select: {
        privacy: true,
        password: true,
        maxParticipants: true,
        participants: { select: { userId: true } },
      },
    });

    if (!room) {
      return reply.status(404).send({ error: "Sala não encontrada" });
    }

    const isAlreadyInRoom = room.participants.some((p) => p.userId === sessionId);
    if (isAlreadyInRoom) {
      return reply.status(400).send({ error: "Você já está nesta sala" });
    }

    if (room.participants.length >= room.maxParticipants) {
      return reply.status(403).send({ error: "A sala está cheia" });
    }

    if (room.privacy === "OPEN") {
      // Entra automaticamente
      await prisma.roomUser.create({
        data: { userId: sessionId, roomId: id, role: "MEMBER" },
      });
      return reply.send({ message: "Você entrou na sala!" });

    } 
      else if (room.privacy === "PRIVATE") {
      // Precisa de senha
      if (!password) {
        return reply.status(400).send({ error: "Senha obrigatória para esta sala" });
      }

      const passwordMatch = await bcrypt.compare(password, room.password!);
      if (!passwordMatch) {
        return reply.status(401).send({ error: "Senha incorreta" });
      }

      await prisma.roomUser.create({
        data: { userId: sessionId, roomId: id, role: "MEMBER" },
      });

      return reply.send({ message: "Você entrou na sala!" });
    }

  } catch (error) {
    return reply.status(500).send({ error: "Erro ao tentar entrar na sala" });
  }
});
//Listar participantes de uma sala
app.get("/rooms/:id/members", async (request, reply) => {
  const { id } = request.params as { id: string };

  try {
    const members = await prisma.roomUser.findMany({
      where: { roomId: id },
      select: {
        user:{
          select:{
            id:true,
            name:true,
            profilePicture:true
          }
        },
        role: true,
      },
    });

    return reply.send(members);
  } catch (error) {
    return reply.status(500).send({ error: "Erro ao listar participantes." });
  }
});

//Sair da sala
app.delete("/rooms/:id/leave", async (request, reply) => {
  const { id } = request.params as { id: string };
  const sessionId = request.cookies.sessionId;

  try {
    const roomUser = await prisma.roomUser.findFirst({
      where: { roomId: id, userId: sessionId },
    });

    if (!roomUser) {
      return reply.status(404).send({ error: "Usuário não está na sala." });
    }

    // Verifica se o usuário é o admin e se é o único na sala
    const usersInRoom = await prisma.roomUser.count({ where: { roomId: id } });

    if (roomUser.role === "ADMIN" && usersInRoom === 1) {
      await prisma.room.delete({ where: { id } });
      return reply.send({ message: "Sala excluída, pois o único admin saiu." });
    }

    // Remove o usuário da sala
    await prisma.roomUser.delete({
      where: { id: roomUser.id },
    });

    return reply.send({ message: "Você saiu da sala." });
  } catch (error) {
    return reply.status(500).send({ error: "Erro ao sair da sala." });
  }
});


}

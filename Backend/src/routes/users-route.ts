import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";


export async function userRoutes(app: FastifyInstance) {
  const userSchema = z.object({
    name: z.string(),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    profilePicture: z.string().url().optional(),
    bio: z.string().max(160, "A bio deve ter no máximo 160 caracteres").optional(),
  });

  //Criar um novo usuário (Cadastro)
  app.post("/users", async (request, reply) => {
    try {
      const data = userSchema.parse(request.body);

      // Verifica se o e-mail já está cadastrado
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        return reply.status(400).send({ error: "E-mail já cadastrado" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
        select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
      });

      return reply.status(201).send(newUser);
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao criar novo usuario" });
    }
  });

  //Listar usuários
  app.get("/users", async (request, reply) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
    });
    if (users.length === 0) {
      return reply.status(404).send({ error: "Nenhum usuário encontrado" });
    }
    return reply.send(users);

  });

  //Atualizar um usuário (apenas nome, bio e foto)
  app.put("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const updateSchema = z.object({
      name: z.string().optional(),
      bio: z.string().max(160).optional(),
      profilePicture: z.string().url().optional(),
    });

    try {
      const data = updateSchema.parse(request.body);

      const updatedUser = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
      });

      return reply.send(updatedUser);
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao atualizar dados do usuario" });
    }
  });

  //Deletar um usuário
  app.delete("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.user.delete({ where: { id } });
      return reply.status(200).send({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      return reply.status(400).send({ error: "Erro ao excluir usuário. Verifique se o ID é válido." });
    }
  });
  //Salas que o usuario logado participa
  app.get("/rooms/user", async (request, reply) => {
    try {
      const sessionId = request.cookies.session;

      if (!sessionId) {
        return reply.status(401).send({ error: "Usuário não autenticado." });
      }

      // Busca o usuário pelo ID armazenado no cookie
      const user = await prisma.user.findUnique({
        where: { id: sessionId },
        select: { id: true }
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      // Busca as salas em que o usuário participa
      const userRooms = await prisma.roomUser.findMany({
        where: { userId: user.id },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              maxParticipants: true,
              _count: { select: { participants: true } }
            }
          }
        }
      });

      const rooms = userRooms.map(roomUser => ({
        id: roomUser.room.id,
        name: roomUser.room.name,
        maxParticipants: roomUser.room.maxParticipants,
        currentParticipants: roomUser.room._count.participants
      }));

      return reply.send(rooms);
    } catch (error) {
      console.error("Erro ao buscar salas do usuário:", error);
      return reply.status(500).send({ error: "Erro interno do servidor." });
    }
  });
  //Detalhes das salas que um usuario participa
  app.get('/users/:id/rooms', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // 1. Verificar se o usuário existe
      const userExists = await prisma.user.findUnique({
        where: { id },
        select: { id: true }
      });

      if (!userExists) {
        return reply.status(404).send({ error: 'Usuário não encontrado' });
      }

      // 2. Buscar salas com informações completas
      const rooms = await prisma.room.findMany({
        where: {
          participants: {
            some: {
              userId: id // Corrigido o filtro para userId
            }
          }
        },
        select: {
          id: true,
          name: true,
          privacy: true,
          maxParticipants: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              profilePicture: true
            }
          },
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 3. Mapear os dados para o formato de resposta
      const formattedRooms = rooms.map(room => ({
        id: room.id,
        name: room.name,
        privacy: room.privacy,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt,
        currentParticipants: room._count.participants,
        owner: {
          id: room.owner.id,
          name: room.owner.name,
          avatar: room.owner.profilePicture
        },
        participants: room.participants.map(p => ({
          id: p.user.id,
          name: p.user.name
        }))
      }));

      return reply.send(formattedRooms);

    } catch (error) {
      console.error('Erro:', error);
      return reply.status(500).send({
        error: 'Erro interno ao processar a solicitação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  //Buscar usuário especifico
  app.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const user = await prisma.user.findUnique({
        where: { id: id },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          bio: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      return reply.send(user);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Erro ao buscar usuário." });
    }
  });


}

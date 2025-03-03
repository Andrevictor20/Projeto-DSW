import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";


export async function userRoutes(app: FastifyInstance) {
  // Schema de validação com Zod
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

  // Obter um usuário por ID
  app.get("/users/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    return reply.send(user);
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
      return reply.status(400).send({ error: "Erro ao atualizar dados do usuario"});
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
}

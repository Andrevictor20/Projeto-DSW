import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import fastifyCookie from "@fastify/cookie";

export async function authRoutes(app: FastifyInstance) {
  // Schema de validação para login
  const loginSchema = z.object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  });

  // Schema de redefinição de senha
  const resetPasswordSchema = z.object({
    email: z.string().email("E-mail inválido"),
    oldPassword: z.string().min(6, "A senha antiga deve ter pelo menos 6 caracteres"),
    newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  });

  //Login de usuário
  app.post("/auth/login", async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Verifica se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(400).send({ error: "E-mail ou senha incorretos" });
      }

      // Verifica se a senha está correta
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.status(400).send({ error: "E-mail ou senha incorretos" });
      }

      // Define um cookie de sessão para manter o usuário logado
      reply.setCookie("session", user.id, {
        path: "/",
        httpOnly: true, // Protege contra acessos via JS no navegador
        secure: process.env.NODE_ENV === "production", // Apenas HTTPS em produção
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // Expira em 7 dias
      });

      return reply.send({
        message: "Login realizado com sucesso",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
      });
    } catch (error) {
      return reply.status(400).send({ error: error.errors });
    }
  });

  //Logout retornando o usuário que deslogou
  app.post("/auth/logout/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sessionId = request.cookies.session;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não está autenticado" });
    }

    if (sessionId !== id) {
      return reply.status(403).send({ error: "Operação não permitida para este usuário" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    reply.clearCookie("session", { path: "/" });

    return reply.send({
      message: "Logout realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });


  // Redefinir senha (exige senha antiga)
  app.post("/auth/reset-password", async (request, reply) => {
    try {
      const { email, oldPassword, newPassword } = resetPasswordSchema.parse(request.body);

      // Verifica se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      // Verifica se a senha antiga está correta
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return reply.status(400).send({ error: "Senha antiga incorreta" });
      }

      // Gera hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualiza a senha no banco
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });

      return reply.send({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      return reply.status(400).send({ error: error.errors });
    }
  });

  // Rota de teste para verificar se o cookie está sendo enviado
  app.get("/auth/check-session/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const sessionId = request.cookies.session;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não está autenticado" });
    }

    if (sessionId !== id) {
      return reply.status(403).send({ error: "Sessão inválida para este usuário" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    return reply.send({
      message: "Usuário autenticado",
      user,
    });
  });
}

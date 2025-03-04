import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import path from "path";
import fs from "fs";
import fastifyMultipart from "@fastify/multipart";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";

export async function photoRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart);
  app.register(fastifyStatic, {
    root: path.join(__dirname, "../../uploads"),
    prefix: "/uploads/",
  });

  //Upload de fotos (informações salvas no banco de dados e foto na pasta upload)
  app.post("/rooms/:roomId/photos", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const sessionId = request.cookies.session as string;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Sala não encontrada." });
    }

    const isMember = room.participants.some((p) => p.userId === sessionId);
    if (!isMember) {
      return reply.status(403).send({ error: "Você não faz parte desta sala." });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "Nenhuma imagem enviada." });
    }

    const fileExt = path.extname(data.filename);
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

    if (!allowedExtensions.includes(fileExt.toLowerCase())) {
      return reply.status(400).send({ error: "Formato de arquivo não permitido." });
    }

    const uploadsDir = "uploads";
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Nome original do arquivo sem alterar
    const newFileName = data.filename;
    const filePath = path.join(uploadsDir, newFileName);

    const stream = fs.createWriteStream(filePath);
    await data.file.pipe(stream);

    const photo = await prisma.photo.create({
      data: {
        name: newFileName,
        filePath: filePath,
        userId: sessionId,
        roomId,
      },
    });

    return reply.send({ message: "Foto enviada com sucesso!", photo });
  });
  //Listar as fotos da sala
  app.get("/rooms/:roomId/photos", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const sessionId = request.cookies.session as string;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Sala não encontrada." });
    }

    const isMember = room.participants.some((p) => p.userId === sessionId);
    if (!isMember) {
      return reply.status(403).send({ error: "Você não faz parte desta sala." });
    }

    // Buscar todas as fotos associadas a essa sala
    const photos = await prisma.photo.findMany({
      where: { roomId },
      select: {
        id: true,
        name: true,
        filePath: true,
        user: {
          select: { id: true, name: true }, // Retorna o nome e ID do usuário que enviou a foto
        },
      },
    });

    return reply.send({ photos });
  });

  //Listar as fotos do usuário
  app.get("/users/:userId/photos", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const sessionId = request.cookies.session as string;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não autenticado." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    // Buscar todas as fotos enviadas por esse usuário
    const photos = await prisma.photo.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        filePath: true,
        room: {
          select: { id: true, name: true }, // Retorna a sala onde a foto foi postada
        },
      },
    });

    return reply.send({ photos });
  });
  //Deletar foto
  app.delete("/photo/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.cookies.sessionId;

    // Buscar a foto no banco de dados
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!photo) {
      return reply.status(404).send({ error: "Foto não encontrada!" });
    }

    // Verificar se o usuário é dono da foto ou admin da sala
    const roomUser = await prisma.roomUser.findFirst({
      where: {
        userId,
        roomId: photo.roomId,
      },
    });

    if (photo.userId !== userId && (!roomUser || roomUser.role !== "ADMIN")) {
      return reply.status(403).send({ error: "Você não tem permissão para deletar esta foto!" });
    }

    // Remover a foto do sistema de arquivos
    fs.unlinkSync(photo.filePath);

    // Deletar a foto do banco de dados
    await prisma.photo.delete({
      where: { id },
    });

    return reply.send({ message: "Foto deletada com sucesso!" });
  });
  

}

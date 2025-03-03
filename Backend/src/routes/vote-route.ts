import { FastifyInstance } from "fastify";
import prisma  from "../lib/prisma";

export async function voteRoutes(app: FastifyInstance) {
  app.post("/rooms/:roomId/vote/:photoId", async (request, reply) => {
    const { roomId, photoId } = request.params as { roomId: string; photoId: string };
    const sessionId = request.cookies.session as string;

    if (!sessionId) {
      return reply.status(401).send({ error: "Usuário não autenticado." });
    }

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
    });

    if (!user) {
      return reply.status(404).send({ error: "Usuário não encontrado." });
    }

    // Verifica se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      return reply.status(404).send({ error: "Sala não encontrada." });
    }

    // Verifica se o usuário faz parte da sala
    const isMember = room.participants.some((p) => p.userId === sessionId);
    if (!isMember) {
      return reply.status(403).send({ error: "Você não faz parte desta sala." });
    }

    // Verifica se a foto existe e pertence à sala correta
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.roomId !== roomId) {
      return reply.status(404).send({ error: "Foto não encontrada nesta sala." });
    }

    // Verifica se o usuário já votou em alguma foto dentro da sala
    const existingVote = await prisma.vote.findFirst({
      where: { userId: sessionId, roomId },
    });

    if (existingVote) {
      // Remove o voto anterior antes de registrar o novo
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
    }

    // Registra o novo voto
    const vote = await prisma.vote.create({
      data: {
        userId: sessionId,
        roomId,
        photoId,
      },
    });

    return reply.send({ message: "Voto registrado com sucesso!", vote });
  });
  app.get("/rooms/:roomId/photos/votes", async (request, reply) => {
    const { roomId } = request.params as { roomId: string };

    const photosWithVotes = await prisma.photo.findMany({
      where: { roomId },
      select: {
        id: true,
        name: true,
        filePath: true,
        _count: {
          select: { votes: true },
        },
      },
    });

    return reply.send({ photos: photosWithVotes });
  });
}

import { FastifyInstance } from "fastify";
import prisma from "../lib/prisma";
import fastifyCookie from "@fastify/cookie";

export async function voteRoutes(app: FastifyInstance) {
    app.post("/rooms/:roomId/vote/:photoId", async (request, reply) => {
        const { roomId, photoId } = request.params as { roomId: string; photoId: string };
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

        const photo = await prisma.photo.findUnique({ where: { id: photoId } });
        if (!photo || photo.roomId !== roomId) {
            return reply.status(404).send({ error: "Foto não encontrada nesta sala." });
        }

        // Verificar se o usuário já votou em outra foto
        const existingVote = await prisma.vote.findFirst({
            where: { userId: sessionId, roomId },
        });

        // Se o usuário já tiver um voto, remover antes de registrar o novo
        if (existingVote) {
            try {
                await prisma.vote.delete({ where: { id: existingVote.id } });
                // Verificar se o voto foi realmente deletado
                const deletedVote = await prisma.vote.findUnique({ where: { id: existingVote.id } });
                if (deletedVote) {
                    return reply.status(500).send({ error: 'Erro ao deletar voto existente.' });
                }
            } catch (error) {
                console.error('Erro ao deletar voto:', error);
                return reply.status(500).send({ error: 'Erro ao deletar voto existente.' });
            }
        }

        // Criar novo voto
        await prisma.vote.create({
            data: {
                userId: sessionId,
                roomId,
                photoId,
            },
        });

        // Retorna a nova contagem de votos por foto na sala
        const updatedVotes = await prisma.photo.findMany({
            where: { roomId },
            select: {
                id: true,
                _count: { select: { votes: true } },
            },
        });

        return reply.send({ message: "Voto registrado com sucesso!", votes: updatedVotes });
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

    app.get('/rooms/:roomId/user-votes', async (request, reply) => {
        const { roomId } = request.params as { roomId: string };
        const sessionId = request.cookies.session as string;

        if (!sessionId) {
            return reply.status(401).send({ error: 'Usuário não autenticado.' });
        }

        const userVotes = await prisma.vote.findMany({
            where: { userId: sessionId, roomId },
            select: { photoId: true },
        });

        return reply.send({ votes: userVotes.map(vote => vote.photoId) });
    });

    app.post('/rooms/:roomId/remove-vote', async (request, reply) => {
        const { roomId } = request.params as { roomId: string };
        const sessionId = request.cookies.session as string;
        const { photoId } = request.body as { photoId: string };

        if (!sessionId) {
            return reply.status(401).send({ error: 'Usuário não autenticado.' });
        }

        try {
            await prisma.vote.delete({
                where: {
                    userId_roomId: {
                        userId: sessionId,
                        roomId: roomId,
                    },
                },
            });
            return reply.status(200).send({ message: 'Voto removido com sucesso' });
        } catch (error) {
            return reply.status(500).send({ error: 'Erro ao remover o voto' });
        }
    });
}

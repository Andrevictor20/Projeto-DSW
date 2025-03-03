"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteRoutes = voteRoutes;
const prisma_1 = __importDefault(require("../lib/prisma"));
function voteRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.post("/rooms/:roomId/vote/:photoId", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId, photoId } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado." });
            }
            // Verifica se o usuário existe
            const user = yield prisma_1.default.user.findUnique({
                where: { id: sessionId },
            });
            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado." });
            }
            // Verifica se a sala existe
            const room = yield prisma_1.default.room.findUnique({
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
            const photo = yield prisma_1.default.photo.findUnique({
                where: { id: photoId },
            });
            if (!photo || photo.roomId !== roomId) {
                return reply.status(404).send({ error: "Foto não encontrada nesta sala." });
            }
            // Verifica se o usuário já votou em alguma foto dentro da sala
            const existingVote = yield prisma_1.default.vote.findFirst({
                where: { userId: sessionId, roomId },
            });
            if (existingVote) {
                // Remove o voto anterior antes de registrar o novo
                yield prisma_1.default.vote.delete({
                    where: { id: existingVote.id },
                });
            }
            // Registra o novo voto
            const vote = yield prisma_1.default.vote.create({
                data: {
                    userId: sessionId,
                    roomId,
                    photoId,
                },
            });
            return reply.send({ message: "Voto registrado com sucesso!", vote });
        }));
        app.get("/rooms/:roomId/photos/votes", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = request.params;
            const photosWithVotes = yield prisma_1.default.photo.findMany({
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
        }));
    });
}

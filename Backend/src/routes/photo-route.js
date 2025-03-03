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
exports.photoRoutes = photoRoutes;
const prisma_1 = __importDefault(require("../lib/prisma"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
function photoRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.register(multipart_1.default);
        //Upload de fotos (informações salvas no banco de dados e foto na pasta upload)
        app.post("/rooms/:roomId/photos", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado." });
            }
            const user = yield prisma_1.default.user.findUnique({ where: { id: sessionId } });
            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado." });
            }
            const room = yield prisma_1.default.room.findUnique({
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
            const data = yield request.file();
            if (!data) {
                return reply.status(400).send({ error: "Nenhuma imagem enviada." });
            }
            const fileExt = path_1.default.extname(data.filename);
            const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
            if (!allowedExtensions.includes(fileExt.toLowerCase())) {
                return reply.status(400).send({ error: "Formato de arquivo não permitido." });
            }
            const uploadsDir = "uploads";
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir);
            }
            // Nome original do arquivo sem alterar
            const newFileName = data.filename;
            const filePath = path_1.default.join(uploadsDir, newFileName);
            const stream = fs_1.default.createWriteStream(filePath);
            yield data.file.pipe(stream);
            const photo = yield prisma_1.default.photo.create({
                data: {
                    name: newFileName,
                    filePath: filePath,
                    userId: sessionId,
                    roomId,
                },
            });
            return reply.send({ message: "Foto enviada com sucesso!", photo });
        }));
        //Listar as fotos da sala
        app.get("/rooms/:roomId/photos", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado." });
            }
            const user = yield prisma_1.default.user.findUnique({ where: { id: sessionId } });
            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado." });
            }
            const room = yield prisma_1.default.room.findUnique({
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
            const photos = yield prisma_1.default.photo.findMany({
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
        }));
        //Listar as fotos do usuário
        app.get("/users/:userId/photos", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado." });
            }
            const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado." });
            }
            // Buscar todas as fotos enviadas por esse usuário
            const photos = yield prisma_1.default.photo.findMany({
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
        }));
        //Deletar foto
        app.delete("/photo/:id", (req, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const userId = req.cookies.sessionId;
            // Buscar a foto no banco de dados
            const photo = yield prisma_1.default.photo.findUnique({
                where: { id },
                include: { room: true },
            });
            if (!photo) {
                return reply.status(404).send({ error: "Foto não encontrada!" });
            }
            // Verificar se o usuário é dono da foto ou admin da sala
            const roomUser = yield prisma_1.default.roomUser.findFirst({
                where: {
                    userId,
                    roomId: photo.roomId,
                },
            });
            if (photo.userId !== userId && (!roomUser || roomUser.role !== "ADMIN")) {
                return reply.status(403).send({ error: "Você não tem permissão para deletar esta foto!" });
            }
            // Remover a foto do sistema de arquivos
            fs_1.default.unlinkSync(photo.filePath);
            // Deletar a foto do banco de dados
            yield prisma_1.default.photo.delete({
                where: { id },
            });
            return reply.send({ message: "Foto deletada com sucesso!" });
        }));
    });
}

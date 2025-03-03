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
exports.roomsRoutes = roomsRoutes;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
function roomsRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Schema de validação para criação de salas
        const createRoomSchema = zod_1.z.object({
            name: zod_1.z.string(),
            privacy: zod_1.z.enum(["OPEN", "PRIVATE"]),
            password: zod_1.z.string().min(6).optional(),
            maxParticipants: zod_1.z.number().min(2, "A sala deve ter pelo menos 2 participantes"),
        });
        // Criar uma nova sala (apenas usuários autenticados)
        app.post("/rooms", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = request.cookies.session;
                if (!sessionId) {
                    return reply.status(401).send({ error: "Usuário não autenticado" });
                }
                // Verifica se o usuário existe
                const user = yield prisma_1.default.user.findUnique({
                    where: { id: sessionId },
                });
                if (!user) {
                    return reply.status(401).send({ error: "Usuário não autenticado" });
                }
                // Valida os dados da sala
                const data = createRoomSchema.parse(request.body);
                // Criptografa a senha, se fornecida
                const hashedPassword = data.password ? yield bcrypt_1.default.hash(data.password, 10) : null;
                // Cria a sala no banco de dados
                const room = yield prisma_1.default.room.create({
                    data: Object.assign(Object.assign({}, data), { password: hashedPassword, ownerId: user.id }),
                });
                // Adiciona o usuário como ADMIN na RoomUser
                yield prisma_1.default.roomUser.create({
                    data: {
                        userId: user.id,
                        roomId: room.id,
                        role: "ADMIN",
                    },
                });
                return reply.status(201).send({ message: "Sala criada com sucesso!" });
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao criar a sala" });
            }
        }));
        // Listar todas as salas
        app.get("/rooms", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { privacy, name } = request.query;
            const rooms = yield prisma_1.default.room.findMany({
                where: {
                    privacy: privacy,
                    name: name ? { contains: name, mode: "insensitive" } : undefined,
                },
                select: {
                    id: true,
                    name: true,
                    maxParticipants: true,
                    privacy: true,
                },
            });
            return reply.send(rooms);
        }));
        // Atualizar detalhes de uma sala (apenas o ADMIN pode modificar)
        app.put("/rooms/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado" });
            }
            // Verifica se o usuário é ADMIN da sala
            const roomUser = yield prisma_1.default.roomUser.findUnique({
                where: {
                    userId_roomId: { userId: sessionId, roomId: id },
                },
                select: { role: true },
            });
            if (!roomUser || roomUser.role !== "ADMIN") {
                return reply.status(403).send({ error: "Apenas o administrador pode modificar a sala" });
            }
            const updateRoomSchema = zod_1.z.object({
                name: zod_1.z.string().min(3).optional(),
                privacy: zod_1.z.enum(["OPEN", "PRIVATE"]).optional(),
                password: zod_1.z.string().min(6).optional(),
                maxParticipants: zod_1.z.number().min(2).optional(),
            });
            try {
                const data = updateRoomSchema.parse(request.body);
                // Criptografa a senha se for fornecida
                if (data.password) {
                    data.password = yield bcrypt_1.default.hash(data.password, 10);
                }
                const updatedRoom = yield prisma_1.default.room.update({
                    where: { id },
                    data,
                });
                return reply.send({ message: "Sala atualizada com sucesso!" });
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao tentar atualizar a sala" });
            }
        }));
        // Excluir uma sala (apenas o dono pode)
        app.delete("/rooms/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            try {
                yield prisma_1.default.room.delete({ where: { id } });
                return reply.status(201).send({ message: "Sala excluida com sucesso!" });
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao excluir sala. Verifique se o ID é válido." });
            }
        }));
        //Entrar em uma sala
        app.post("/rooms/:id/join", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const { password } = request.body;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não autenticado" });
            }
            try {
                const room = yield prisma_1.default.room.findUnique({
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
                    yield prisma_1.default.roomUser.create({
                        data: { userId: sessionId, roomId: id, role: "MEMBER" },
                    });
                    return reply.send({ message: "Você entrou na sala!" });
                }
                else if (room.privacy === "PRIVATE") {
                    // Precisa de senha
                    if (!password) {
                        return reply.status(400).send({ error: "Senha obrigatória para esta sala" });
                    }
                    const passwordMatch = yield bcrypt_1.default.compare(password, room.password);
                    if (!passwordMatch) {
                        return reply.status(401).send({ error: "Senha incorreta" });
                    }
                    yield prisma_1.default.roomUser.create({
                        data: { userId: sessionId, roomId: id, role: "MEMBER" },
                    });
                    return reply.send({ message: "Você entrou na sala!" });
                }
            }
            catch (error) {
                return reply.status(500).send({ error: "Erro ao tentar entrar na sala" });
            }
        }));
        //Listar participantes de uma sala
        app.get("/rooms/:id/members", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            try {
                const members = yield prisma_1.default.roomUser.findMany({
                    where: { roomId: id },
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profilePicture: true
                            }
                        },
                        role: true,
                    },
                });
                return reply.send(members);
            }
            catch (error) {
                return reply.status(500).send({ error: "Erro ao listar participantes." });
            }
        }));
        //Transferir ADM para outro participante
        app.put("/rooms/:id/transfer-admin", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const { newAdminId } = request.body;
            const sessionId = request.cookies.sessionId;
            try {
                const roomUser = yield prisma_1.default.roomUser.findFirst({
                    where: { roomId: id, userId: sessionId },
                });
                if (!roomUser || roomUser.role !== "ADMIN") {
                    return reply.status(403).send({ error: "Apenas o admin pode transferir o cargo." });
                }
                const newAdmin = yield prisma_1.default.roomUser.findFirst({
                    where: { roomId: id, userId: newAdminId },
                });
                if (!newAdmin || newAdmin.role === "ADMIN") {
                    return reply.status(400).send({ error: "Usuário inválido para ser admin." });
                }
                yield prisma_1.default.roomUser.update({
                    where: { id: roomUser.id },
                    data: { role: "MEMBER" },
                });
                yield prisma_1.default.roomUser.update({
                    where: { id: newAdmin.id },
                    data: { role: "ADMIN" },
                });
                return reply.send({ message: "Admin transferido com sucesso." });
            }
            catch (error) {
                return reply.status(500).send({ error: "Erro ao transferir administração." });
            }
        }));
        //Sair da sala
        app.delete("/rooms/:id/leave", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const sessionId = request.cookies.sessionId;
            try {
                const roomUser = yield prisma_1.default.roomUser.findFirst({
                    where: { roomId: id, userId: sessionId },
                });
                if (!roomUser) {
                    return reply.status(404).send({ error: "Usuário não está na sala." });
                }
                // Verifica se o usuário é o admin e se é o único na sala
                const usersInRoom = yield prisma_1.default.roomUser.count({ where: { roomId: id } });
                if (roomUser.role === "ADMIN" && usersInRoom === 1) {
                    yield prisma_1.default.room.delete({ where: { id } });
                    return reply.send({ message: "Sala excluída, pois o único admin saiu." });
                }
                // Remove o usuário da sala
                yield prisma_1.default.roomUser.delete({
                    where: { id: roomUser.id },
                });
                return reply.send({ message: "Você saiu da sala." });
            }
            catch (error) {
                return reply.status(500).send({ error: "Erro ao sair da sala." });
            }
        }));
        // Rota para exibir as fotos mais votadas (do maior para o menor)
        app.get("/rooms/:roomId/photos/top-voted", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = request.params;
            const topVotedPhotos = yield prisma_1.default.photo.findMany({
                where: { roomId },
                select: {
                    id: true,
                    name: true,
                    filePath: true,
                    _count: {
                        select: { votes: true },
                    },
                },
                orderBy: {
                    votes: { _count: "desc" },
                },
            });
            return reply.send({ photos: topVotedPhotos });
        }));
        // Rota para exibir as fotos mais recentes (da mais nova para a mais antiga)
        app.get("/rooms/:roomId/photos/recent", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = request.params;
            const recentPhotos = yield prisma_1.default.photo.findMany({
                where: { roomId },
                select: {
                    id: true,
                    name: true,
                    filePath: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            return reply.send({ photos: recentPhotos });
        }));
    });
}

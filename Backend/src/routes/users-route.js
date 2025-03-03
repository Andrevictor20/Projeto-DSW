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
exports.userRoutes = userRoutes;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
function userRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Schema de validação com Zod
        const userSchema = zod_1.z.object({
            name: zod_1.z.string(),
            email: zod_1.z.string().email("E-mail inválido"),
            password: zod_1.z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
            profilePicture: zod_1.z.string().url().optional(),
            bio: zod_1.z.string().max(160, "A bio deve ter no máximo 160 caracteres").optional(),
        });
        //Criar um novo usuário (Cadastro)
        app.post("/users", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = userSchema.parse(request.body);
                // Verifica se o e-mail já está cadastrado
                const existingUser = yield prisma_1.default.user.findUnique({
                    where: { email: data.email },
                });
                if (existingUser) {
                    return reply.status(400).send({ error: "E-mail já cadastrado" });
                }
                // Hash da senha
                const hashedPassword = yield bcrypt_1.default.hash(data.password, 10);
                const newUser = yield prisma_1.default.user.create({
                    data: Object.assign(Object.assign({}, data), { password: hashedPassword }),
                    select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
                });
                return reply.status(201).send(newUser);
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao criar novo usuario" });
            }
        }));
        //Listar usuários
        app.get("/users", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const users = yield prisma_1.default.user.findMany({
                select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
            });
            if (users.length === 0) {
                return reply.status(404).send({ error: "Nenhum usuário encontrado" });
            }
            return reply.send(users);
        }));
        // Obter um usuário por ID
        app.get("/users/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const user = yield prisma_1.default.user.findUnique({
                where: { id },
                select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
            });
            if (!user) {
                return reply.status(404).send({ error: "Usuário não encontrado" });
            }
            return reply.send(user);
        }));
        //Atualizar um usuário (apenas nome, bio e foto)
        app.put("/users/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const updateSchema = zod_1.z.object({
                name: zod_1.z.string().optional(),
                bio: zod_1.z.string().max(160).optional(),
                profilePicture: zod_1.z.string().url().optional(),
            });
            try {
                const data = updateSchema.parse(request.body);
                const updatedUser = yield prisma_1.default.user.update({
                    where: { id },
                    data,
                    select: { id: true, name: true, email: true, profilePicture: true, bio: true, createdAt: true },
                });
                return reply.send(updatedUser);
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao atualizar dados do usuario" });
            }
        }));
        //Deletar um usuário
        app.delete("/users/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            try {
                yield prisma_1.default.user.delete({ where: { id } });
                return reply.status(200).send({ message: "Usuário deletado com sucesso" });
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao excluir usuário. Verifique se o ID é válido." });
            }
        }));
    });
}

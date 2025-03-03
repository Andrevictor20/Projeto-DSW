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
exports.authRoutes = authRoutes;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
function authRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        // Schema de validação para login
        const loginSchema = zod_1.z.object({
            email: zod_1.z.string().email("E-mail inválido"),
            password: zod_1.z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
        });
        // Schema de redefinição de senha
        const resetPasswordSchema = zod_1.z.object({
            email: zod_1.z.string().email("E-mail inválido"),
            oldPassword: zod_1.z.string().min(6, "A senha antiga deve ter pelo menos 6 caracteres"),
            newPassword: zod_1.z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
        });
        //Login de usuário
        app.post("/auth/login", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = loginSchema.parse(request.body);
                // Verifica se o usuário existe
                const user = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    return reply.status(400).send({ error: "E-mail ou senha incorretos" });
                }
                // Verifica se a senha está correta
                const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
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
            }
            catch (error) {
                return reply.status(400).send({ error: "Não foi possível realizar o login" });
            }
        }));
        //Logout retornando o usuário que deslogou
        app.post("/auth/logout/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não está autenticado" });
            }
            if (sessionId !== id) {
                return reply.status(403).send({ error: "Operação não permitida para este usuário" });
            }
            const user = yield prisma_1.default.user.findUnique({
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
        }));
        // Redefinir senha (exige senha antiga)
        app.post("/auth/reset-password", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, oldPassword, newPassword } = resetPasswordSchema.parse(request.body);
                // Verifica se o usuário existe
                const user = yield prisma_1.default.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    return reply.status(404).send({ error: "Usuário não encontrado" });
                }
                // Verifica se a senha antiga está correta
                const isOldPasswordValid = yield bcrypt_1.default.compare(oldPassword, user.password);
                if (!isOldPasswordValid) {
                    return reply.status(400).send({ error: "Senha antiga incorreta" });
                }
                // Gera hash da nova senha
                const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
                // Atualiza a senha no banco
                yield prisma_1.default.user.update({
                    where: { email },
                    data: { password: hashedPassword },
                });
                return reply.send({ message: "Senha redefinida com sucesso" });
            }
            catch (error) {
                return reply.status(400).send({ error: "Erro ao redefinir a senha" });
            }
        }));
        // Rota de teste para verificar se o usuario está ativo
        app.get("/auth/check-session/:id", (request, reply) => __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const sessionId = request.cookies.session;
            if (!sessionId) {
                return reply.status(401).send({ error: "Usuário não está autenticado" });
            }
            if (sessionId !== id) {
                return reply.status(403).send({ error: "Sessão inválida para este usuário" });
            }
            const user = yield prisma_1.default.user.findUnique({
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
        }));
    });
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const users_route_1 = require("./routes/users-route");
const auth_route_1 = require("./routes/auth-route");
const rooms_route_1 = require("./routes/rooms-route");
const cookie_1 = __importDefault(require("@fastify/cookie"));
const photo_route_1 = require("./routes/photo-route");
const vote_route_1 = require("./routes/vote-route");
const app = (0, fastify_1.default)();
app.register(cookie_1.default, {
    secret: "secret",
    parseOptions: {},
});
app.register(users_route_1.userRoutes);
app.register(auth_route_1.authRoutes);
app.register(rooms_route_1.roomsRoutes);
app.register(photo_route_1.photoRoutes);
app.register(vote_route_1.voteRoutes);
app.listen({ port: 5700 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server running on http://localhost:5700`);
});

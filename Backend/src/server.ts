import fastify from 'fastify';
import { userRoutes } from './routes/users-route';
import { authRoutes } from './routes/auth-route';
import { roomsRoutes } from './routes/rooms-route';
import fastifyCookie from "@fastify/cookie";
import { photoRoutes } from './routes/photo-route';
import { voteRoutes } from './routes/vote-route';
import fastifyCors from "@fastify/cors";
const app = fastify();


app.register(fastifyCors, {
    origin: true, // Permite requisições de qualquer origem (ideal para testes)
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, // Permite cookies e headers autenticados
});


app.register(fastifyCookie, {
  secret: "secret", 
  parseOptions: {},
});

app.register(userRoutes)
app.register(authRoutes)
app.register(roomsRoutes)
app.register(photoRoutes)
app.register(voteRoutes)
app.listen({ port: 5700,host:'0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:5700`);
});  
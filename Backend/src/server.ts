import fastify from 'fastify';
import { userRoutes } from './routes/users-route';
import { authRoutes } from './routes/auth-route';
import { roomsRoutes } from './routes/rooms-route';
import fastifyCookie from "@fastify/cookie";
import { photoRoutes } from './routes/photo-route';
import { voteRoutes } from './routes/vote-route';



const app = fastify();
app.register(fastifyCookie, {
  secret: "secret", 
  parseOptions: {},
});

app.register(userRoutes)
app.register(authRoutes)
app.register(roomsRoutes)
app.register(photoRoutes)
app.register(voteRoutes)
app.listen({ port: 5700 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:5700`);
});  
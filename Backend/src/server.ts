import fastify from 'fastify';

const app = fastify();
app.listen({ port: 5700 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on http://localhost:5700`);
});  
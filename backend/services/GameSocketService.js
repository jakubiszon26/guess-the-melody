export function setupSocketLogic(fastify) {
  fastify.io.on("connection", (socket) => {
    console.log(`new player ${socket.id}`);

    // socket.on("join_game", () => {
    // });

    //     socket.on("disconnect", () => {
    //       console.log(`[IO] client ${socket.id} rozłączony.`);
    //     });
  });
}

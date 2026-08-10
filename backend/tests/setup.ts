import { sequelize } from '../src/db';
import { Server } from 'http';
import app from '../src/app';

let server: Server;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  server = app.listen(0);
});

afterAll(async () => {
  await sequelize.close();
  if (server) {
    server.close();
  }
});

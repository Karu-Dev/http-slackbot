import { Router } from 'express';
import { Controller } from './controller';

export const routes = Router();
routes.post('/slackbot', Controller.slackCall);

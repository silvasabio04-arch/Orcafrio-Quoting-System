import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import orcamentosRouter from "./orcamentos";
import dashboardRouter from "./dashboard";
import sugestaoPrecoRouter from "./sugestao-preco";
import usersRouter from "./users";
import hotmartRouter from "./hotmart";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(hotmartRouter);
router.use(clientesRouter);
router.use(orcamentosRouter);
router.use(dashboardRouter);
router.use(sugestaoPrecoRouter);

export default router;

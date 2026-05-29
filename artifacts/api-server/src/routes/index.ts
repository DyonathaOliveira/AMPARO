import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import residentsRouter from "./residents";
import medicationsRouter from "./medications";
import activitiesRouter from "./activities";
import appointmentsRouter from "./appointments";
import handoversRouter from "./handovers";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(residentsRouter);
router.use(medicationsRouter);
router.use(activitiesRouter);
router.use(appointmentsRouter);
router.use(handoversRouter);
router.use(alertsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;

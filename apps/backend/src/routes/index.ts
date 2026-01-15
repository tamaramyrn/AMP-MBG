import { Hono } from "hono"
import auth from "./auth"
import reports from "./reports"
import locations from "./locations"
import categories from "./categories"
import admin from "./admin"
import profile from "./profile"

const routes = new Hono()

routes.route("/auth", auth)
routes.route("/reports", reports)
routes.route("/locations", locations)
routes.route("/categories", categories)
routes.route("/admin", admin)
routes.route("/profile", profile)

export default routes

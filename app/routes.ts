import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("admin", "routes/admin.tsx"),
  route("shop", "routes/shop/fontshop.tsx"),
  route("shop/:id", "routes/shop/shopin.tsx"),
] satisfies RouteConfig;

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/chrome-devtools-resource.ts",
  ),
  route("admin", "routes/Admin/admin.tsx"),
  route("admin/dashboard", "routes/Admin/route-pages/dashboard.tsx"),
  route("admin/orders", "routes/Admin/route-pages/orders.tsx"),
  route("admin/categories", "routes/Admin/route-pages/categories.tsx"),
  route("admin/restaurants", "routes/Admin/route-pages/restaurants.tsx"),
  route("admin/menu_items", "routes/Admin/route-pages/menu-items.tsx"),
  route("admin/customers", "routes/Admin/route-pages/customers.tsx"),
  route("admin/addresses", "routes/Admin/route-pages/addresses.tsx"),
  route("admin/riders", "routes/Admin/route-pages/riders.tsx"),
  route("admin/payments", "routes/Admin/route-pages/payments.tsx"),
  route("shop", "routes/shop/fontshop.tsx"),
  route("shop/:id", "routes/shop/shopin.tsx"),
] satisfies RouteConfig;

/**
 * Food Delivery API for the Google Sheets database:
 * "Food Delivery Database - อาตี๋น้อย"
 *
 * Deploy:
 * 1) Open the spreadsheet > Extensions > Apps Script
 * 2) Paste this file into Code.gs
 * 3) Run setup() once and authorize
 * 4) Deploy > New deployment > Web app
 *
 * POST body examples are included in API_EXAMPLES.md.
 */

const CONFIG = Object.freeze({
  API_VERSION: "1.1.0",
  TIME_ZONE: "Asia/Bangkok",
  FREE_DELIVERY_MINIMUM: 150,
  DELIVERY_FEE: 20,
  SHEETS: Object.freeze({
    CATEGORIES: "Categories",
    RESTAURANTS: "Restaurants",
    MENU_ITEMS: "Menu_Items",
    CUSTOMIZATION_GROUPS: "Customization_Groups",
    CUSTOMIZATION_OPTIONS: "Customization_Options",
    CUSTOMERS: "Customers",
    ADDRESSES: "Addresses",
    ORDERS: "Orders",
    ORDER_ITEMS: "Order_Items",
    ORDER_ITEM_OPTIONS: "Order_Item_Options",
    PAYMENTS: "Payments",
    RIDERS: "Riders",
    ORDER_STATUS_HISTORY: "Order_Status_History",
  }),
});

const ORDER_STATUSES = Object.freeze([
  "received",
  "preparing",
  "delivering",
  "delivered",
  "cancelled",
]);

const PAYMENT_METHODS = Object.freeze(["QR PromptPay", "เงินสดปลายทาง"]);
const PAYMENT_STATUSES = Object.freeze(["pending", "paid", "failed", "refunded"]);

const ADMIN_ENTITIES = Object.freeze({
  categories: { sheet: "Categories", id: "category_id", prefix: "CAT", width: 3 },
  restaurants: { sheet: "Restaurants", id: "restaurant_id", prefix: "RES", width: 3 },
  menu_items: { sheet: "Menu_Items", id: "menu_item_id", prefix: "MENU", width: 3 },
  customization_groups: { sheet: "Customization_Groups", id: "group_id", prefix: "GRP", width: 3 },
  customization_options: { sheet: "Customization_Options", id: "option_id", prefix: "OPT", width: 3 },
  customers: { sheet: "Customers", id: "customer_id", prefix: "CUS", width: 6 },
  addresses: { sheet: "Addresses", id: "address_id", prefix: "ADR", width: 6 },
  orders: { sheet: "Orders", id: "order_id", prefix: "ORD", width: 8 },
  order_items: { sheet: "Order_Items", id: "order_item_id", prefix: "ORI", width: 9 },
  payments: { sheet: "Payments", id: "payment_id", prefix: "PAY", width: 8 },
  riders: { sheet: "Riders", id: "rider_id", prefix: "RID", width: 6 },
  order_status_history: { sheet: "Order_Status_History", id: "history_id", prefix: "HIS", width: 10 },
});

function setup() {
  const requiredHeaders = {
    Categories: ["category_id", "name_th", "slug", "icon", "is_active", "created_at"],
    Restaurants: ["restaurant_id", "category_id", "name", "rating", "image_url", "is_popular", "delivery_min_minutes", "delivery_max_minutes", "distance_km", "is_active", "created_at", "updated_at"],
    Menu_Items: ["menu_item_id", "restaurant_id", "name", "category", "base_price", "rating", "image_url", "is_popular", "is_available", "created_at", "updated_at"],
    Customization_Groups: ["group_id", "menu_item_id", "title", "selection_type", "is_required", "min_select", "max_select", "sort_order", "is_active"],
    Customization_Options: ["option_id", "group_id", "name", "extra_price", "sort_order", "is_active"],
    Customers: ["customer_id", "full_name", "phone", "email", "password_hash", "is_active", "created_at", "updated_at"],
    Addresses: ["address_id", "customer_id", "label", "recipient_name", "phone", "address_line", "subdistrict", "district", "province", "postal_code", "latitude", "longitude", "is_default", "created_at", "updated_at"],
    Orders: ["order_id", "order_number", "customer_id", "restaurant_id", "address_id", "rider_id", "subtotal", "delivery_fee", "discount", "total", "payment_method", "payment_status", "order_status", "note", "ordered_at", "updated_at"],
    Order_Items: ["order_item_id", "order_id", "menu_item_id", "item_name_snapshot", "base_price_snapshot", "unit_price", "quantity", "line_total", "special_note"],
    Order_Item_Options: ["order_item_option_id", "order_item_id", "group_title_snapshot", "option_name_snapshot", "extra_price_snapshot"],
    Payments: ["payment_id", "order_id", "method", "amount", "status", "transaction_ref", "paid_at", "created_at"],
    Riders: ["rider_id", "full_name", "phone", "vehicle_type", "license_plate", "status", "current_latitude", "current_longitude", "created_at", "updated_at"],
    Order_Status_History: ["history_id", "order_id", "status", "changed_by_type", "changed_by_id", "note", "created_at"],
  };

  Object.keys(requiredHeaders).forEach(function (sheetName) {
    const actual = getHeaders_(getSheet_(sheetName));
    const expected = requiredHeaders[sheetName];
    if (actual.join("|") !== expected.join("|")) {
      throw new Error("Header mismatch in " + sheetName);
    }
  });

  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", getDb_().getId());
  return { ok: true, spreadsheetId: getDb_().getId(), apiVersion: CONFIG.API_VERSION };
}

function setupAdmin(adminKey) {
  adminKey = String(adminKey || "").trim();
  if (adminKey.length < 8) {
    throw new Error("Admin key ต้องมีอย่างน้อย 8 ตัวอักษร");
  }
  PropertiesService.getScriptProperties().setProperty("ADMIN_KEY", adminKey);
  return { ok: true, message: "ตั้งค่า Admin key สำเร็จ" };
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const resource = String(params.resource || "health").toLowerCase();
    let data;

    switch (resource) {
      case "health":
        data = { status: "ok", version: CONFIG.API_VERSION, time: now_() };
        break;
      case "categories":
        data = listCategories_();
        break;
      case "restaurants":
        data = listRestaurants_(params);
        break;
      case "restaurant":
        data = getRestaurantDetail_(required_(params.id, "id"));
        break;
      case "menu":
        data = listMenu_(required_(params.restaurant_id, "restaurant_id"));
        break;
      case "order":
        data = getOrder_(params);
        break;
      default:
        throw apiError_("UNKNOWN_RESOURCE", "ไม่รู้จัก resource: " + resource, 404);
    }

    return json_({ ok: true, data: data });
  } catch (error) {
    return errorResponse_(error);
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const action = String(body.action || "").toLowerCase();
    let data;

    switch (action) {
      case "create_customer":
        data = withScriptLock_(function () { return createCustomer_(body); });
        break;
      case "save_address":
        data = withScriptLock_(function () { return saveAddress_(body); });
        break;
      case "create_order":
        data = withScriptLock_(function () { return createOrder_(body); });
        break;
      case "update_order_status":
        data = withScriptLock_(function () { return updateOrderStatus_(body); });
        break;
      case "update_payment_status":
        data = withScriptLock_(function () { return updatePaymentStatus_(body); });
        break;
      case "admin_auth":
        assertAdmin_(body.admin_key);
        data = { authenticated: true, api_version: CONFIG.API_VERSION };
        break;
      case "admin_snapshot":
        assertAdmin_(body.admin_key);
        data = getAdminSnapshot_();
        break;
      case "admin_list":
        assertAdmin_(body.admin_key);
        data = adminList_(body);
        break;
      case "admin_upsert":
        assertAdmin_(body.admin_key);
        data = withScriptLock_(function () { return adminUpsert_(body); });
        break;
      case "admin_delete":
        assertAdmin_(body.admin_key);
        data = withScriptLock_(function () { return adminDelete_(body); });
        break;
      case "admin_update_order":
        assertAdmin_(body.admin_key);
        data = withScriptLock_(function () { return adminUpdateOrder_(body); });
        break;
      default:
        throw apiError_("UNKNOWN_ACTION", "ไม่รู้จัก action: " + action, 404);
    }

    return json_({ ok: true, data: data });
  } catch (error) {
    return errorResponse_(error);
  }
}

function assertAdmin_(providedKey) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!expectedKey) {
    throw apiError_("ADMIN_NOT_CONFIGURED", "ยังไม่ได้ตั้งค่า Admin key กรุณารัน setupAdmin('รหัสของคุณ')", 503);
  }
  if (String(providedKey || "") !== expectedKey) {
    throw apiError_("UNAUTHORIZED", "รหัสผู้ดูแลระบบไม่ถูกต้อง", 401);
  }
}

function getAdminSnapshot_() {
  const restaurants = readTable_(CONFIG.SHEETS.RESTAURANTS).map(publicRow_);
  const menuItems = readTable_(CONFIG.SHEETS.MENU_ITEMS).map(publicRow_);
  const orders = readTable_(CONFIG.SHEETS.ORDERS).map(publicRow_);
  const customers = readTable_(CONFIG.SHEETS.CUSTOMERS).map(publicRow_);
  const riders = readTable_(CONFIG.SHEETS.RIDERS).map(publicRow_);
  const payments = readTable_(CONFIG.SHEETS.PAYMENTS).map(publicRow_);
  const today = Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyy-MM-dd");
  const todayOrders = orders.filter(function (row) {
    return String(row.ordered_at || "").indexOf(today) === 0;
  });
  return {
    stats: {
      restaurants: restaurants.length,
      active_restaurants: restaurants.filter(function (row) { return toBoolean_(row.is_active); }).length,
      menu_items: menuItems.length,
      available_menu_items: menuItems.filter(function (row) { return toBoolean_(row.is_available); }).length,
      orders: orders.length,
      active_orders: orders.filter(function (row) {
        return ["received", "preparing", "delivering"].indexOf(String(row.order_status)) !== -1;
      }).length,
      customers: customers.length,
      riders: riders.length,
      today_orders: todayOrders.length,
      today_revenue: roundMoney_(todayOrders.reduce(function (sum, row) {
        return sum + (String(row.payment_status) === "paid" ? Number(row.total || 0) : 0);
      }, 0)),
      total_revenue: roundMoney_(orders.reduce(function (sum, row) {
        return sum + (String(row.payment_status) === "paid" ? Number(row.total || 0) : 0);
      }, 0)),
    },
    recent_orders: orders.slice(-20).reverse(),
    restaurants: restaurants,
    menu_items: menuItems,
    customers: customers,
    riders: riders,
    payments: payments.slice(-50).reverse(),
  };
}

function getAdminEntity_(entity) {
  const config = ADMIN_ENTITIES[String(entity || "").toLowerCase()];
  if (!config) throw apiError_("UNKNOWN_ENTITY", "ไม่รู้จัก entity: " + entity, 400);
  return config;
}

function adminList_(body) {
  const config = getAdminEntity_(body.entity);
  const query = String(body.query || "").trim().toLowerCase();
  let rows = readTable_(config.sheet).map(publicRow_);
  if (query) {
    rows = rows.filter(function (row) {
      return Object.keys(row).some(function (key) {
        return String(row[key] == null ? "" : row[key]).toLowerCase().indexOf(query) !== -1;
      });
    });
  }
  return { entity: body.entity, headers: getHeaders_(getSheet_(config.sheet)), rows: rows };
}

function adminUpsert_(body) {
  const config = getAdminEntity_(body.entity);
  const values = body.values && typeof body.values === "object" ? body.values : {};
  const headers = getHeaders_(getSheet_(config.sheet));
  const clean = {};
  headers.forEach(function (header) {
    if (Object.prototype.hasOwnProperty.call(values, header)) clean[header] = values[header];
  });

  let id = String(clean[config.id] || body.id || "").trim();
  const timestamp = now_();
  if (id) {
    const existing = findByIdOrThrow_(config.sheet, config.id, id);
    if (headers.indexOf("updated_at") !== -1) clean.updated_at = timestamp;
    delete clean[config.id];
    updateById_(config.sheet, config.id, id, clean);
    return publicRow_(Object.assign({}, existing, clean, (function () {
      const obj = {}; obj[config.id] = id; return obj;
    })()));
  }

  id = nextId_(config.prefix, config.sheet, config.id, config.width);
  clean[config.id] = id;
  if (headers.indexOf("created_at") !== -1 && !clean.created_at) clean.created_at = timestamp;
  if (headers.indexOf("updated_at") !== -1 && !clean.updated_at) clean.updated_at = timestamp;
  appendObject_(config.sheet, clean);
  return publicRow_(clean);
}

function adminDelete_(body) {
  const config = getAdminEntity_(body.entity);
  const id = required_(body.id, "id");
  const row = findByIdOrThrow_(config.sheet, config.id, id);
  const softDeleteFields = ["is_active", "is_available"];
  const softField = softDeleteFields.find(function (field) {
    return Object.prototype.hasOwnProperty.call(row, field);
  });
  if (softField) {
    const changes = {}; changes[softField] = false;
    if (Object.prototype.hasOwnProperty.call(row, "updated_at")) changes.updated_at = now_();
    updateById_(config.sheet, config.id, id, changes);
    return { id: id, deleted: false, deactivated: true };
  }
  if (["orders", "order_items", "payments", "order_status_history"].indexOf(String(body.entity)) !== -1) {
    throw apiError_("DELETE_NOT_ALLOWED", "ไม่อนุญาตให้ลบข้อมูลธุรกรรม", 409);
  }
  deleteById_(config.sheet, config.id, id);
  return { id: id, deleted: true, deactivated: false };
}

function adminUpdateOrder_(body) {
  const orderId = required_(body.order_id, "order_id");
  findByIdOrThrow_(CONFIG.SHEETS.ORDERS, "order_id", orderId);
  const changes = { updated_at: now_() };
  if (body.order_status) {
    if (ORDER_STATUSES.indexOf(String(body.order_status)) === -1) {
      throw apiError_("INVALID_ORDER_STATUS", "สถานะออเดอร์ไม่ถูกต้อง", 400);
    }
    changes.order_status = body.order_status;
    appendStatusHistory_(orderId, body.order_status, "admin", "admin", String(body.note || ""));
  }
  if (body.payment_status) {
    if (PAYMENT_STATUSES.indexOf(String(body.payment_status)) === -1) {
      throw apiError_("INVALID_PAYMENT_STATUS", "สถานะการชำระเงินไม่ถูกต้อง", 400);
    }
    changes.payment_status = body.payment_status;
  }
  if (Object.prototype.hasOwnProperty.call(body, "rider_id")) changes.rider_id = body.rider_id;
  updateById_(CONFIG.SHEETS.ORDERS, "order_id", orderId, changes);
  return Object.assign({ order_id: orderId }, changes);
}

function listCategories_() {
  return readTable_(CONFIG.SHEETS.CATEGORIES)
    .filter(function (row) { return toBoolean_(row.is_active); })
    .map(publicRow_);
}

function listRestaurants_(params) {
  const category = String(params.category || "").trim().toLowerCase();
  const search = String(params.search || "").trim().toLowerCase();
  const popularOnly = String(params.popular || "").toLowerCase() === "true";
  const categoryById = indexBy_(readTable_(CONFIG.SHEETS.CATEGORIES), "category_id");

  return readTable_(CONFIG.SHEETS.RESTAURANTS)
    .filter(function (row) {
      if (!toBoolean_(row.is_active)) return false;
      const categoryRow = categoryById[String(row.category_id)];
      if (category && (!categoryRow || String(categoryRow.slug).toLowerCase() !== category)) return false;
      if (popularOnly && !toBoolean_(row.is_popular)) return false;
      if (search && String(row.name).toLowerCase().indexOf(search) === -1) return false;
      return true;
    })
    .map(function (row) {
      const result = publicRow_(row);
      result.category = categoryById[String(row.category_id)]
        ? categoryById[String(row.category_id)].slug
        : null;
      result.delivery_time = row.delivery_min_minutes + "-" + row.delivery_max_minutes + " นาที";
      return result;
    });
}

function getRestaurantDetail_(restaurantId) {
  const restaurant = findByIdOrThrow_(CONFIG.SHEETS.RESTAURANTS, "restaurant_id", restaurantId);
  if (!toBoolean_(restaurant.is_active)) {
    throw apiError_("RESTAURANT_INACTIVE", "ร้านนี้ไม่เปิดให้บริการ", 404);
  }
  return {
    restaurant: publicRow_(restaurant),
    menu: listMenu_(restaurantId),
  };
}

function listMenu_(restaurantId) {
  const groups = readTable_(CONFIG.SHEETS.CUSTOMIZATION_GROUPS)
    .filter(function (row) { return toBoolean_(row.is_active); });
  const options = readTable_(CONFIG.SHEETS.CUSTOMIZATION_OPTIONS)
    .filter(function (row) { return toBoolean_(row.is_active); });
  const groupsByMenu = groupBy_(groups, "menu_item_id");
  const optionsByGroup = groupBy_(options, "group_id");

  return readTable_(CONFIG.SHEETS.MENU_ITEMS)
    .filter(function (row) {
      return String(row.restaurant_id) === String(restaurantId) && toBoolean_(row.is_available);
    })
    .map(function (menu) {
      const result = publicRow_(menu);
      result.customization_groups = (groupsByMenu[String(menu.menu_item_id)] || [])
        .sort(sortByNumberField_("sort_order"))
        .map(function (group) {
          const groupResult = publicRow_(group);
          groupResult.options = (optionsByGroup[String(group.group_id)] || [])
            .sort(sortByNumberField_("sort_order"))
            .map(publicRow_);
          return groupResult;
        });
      return result;
    });
}

function createCustomer_(body) {
  const fullName = required_(body.full_name, "full_name");
  const phone = normalizePhone_(required_(body.phone, "phone"));
  const email = String(body.email || "").trim().toLowerCase();
  const customers = readTable_(CONFIG.SHEETS.CUSTOMERS);

  if (customers.some(function (row) { return normalizePhone_(row.phone) === phone; })) {
    throw apiError_("PHONE_EXISTS", "เบอร์โทรนี้ถูกใช้งานแล้ว", 409);
  }
  if (email && customers.some(function (row) { return String(row.email).toLowerCase() === email; })) {
    throw apiError_("EMAIL_EXISTS", "อีเมลนี้ถูกใช้งานแล้ว", 409);
  }

  const timestamp = now_();
  const row = {
    customer_id: nextId_("CUS", CONFIG.SHEETS.CUSTOMERS, "customer_id", 6),
    full_name: fullName,
    phone: phone,
    email: email,
    password_hash: "",
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendObject_(CONFIG.SHEETS.CUSTOMERS, row);
  return publicRow_(row);
}

function saveAddress_(body) {
  const customerId = required_(body.customer_id, "customer_id");
  findByIdOrThrow_(CONFIG.SHEETS.CUSTOMERS, "customer_id", customerId);

  const timestamp = now_();
  const row = {
    address_id: nextId_("ADR", CONFIG.SHEETS.ADDRESSES, "address_id", 6),
    customer_id: customerId,
    label: String(body.label || "ที่อยู่จัดส่ง").trim(),
    recipient_name: required_(body.recipient_name, "recipient_name"),
    phone: normalizePhone_(required_(body.phone, "phone")),
    address_line: required_(body.address_line, "address_line"),
    subdistrict: String(body.subdistrict || "").trim(),
    district: String(body.district || "").trim(),
    province: String(body.province || "").trim(),
    postal_code: String(body.postal_code || "").trim(),
    latitude: nullableNumber_(body.latitude),
    longitude: nullableNumber_(body.longitude),
    is_default: toBoolean_(body.is_default),
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (row.is_default) {
    clearDefaultAddresses_(customerId);
  }
  appendObject_(CONFIG.SHEETS.ADDRESSES, row);
  return publicRow_(row);
}

function createOrder_(body) {
  const customerId = required_(body.customer_id, "customer_id");
  const restaurantId = required_(body.restaurant_id, "restaurant_id");
  const addressId = required_(body.address_id, "address_id");
  const items = Array.isArray(body.items) ? body.items : [];
  const paymentMethod = required_(body.payment_method, "payment_method");

  if (!items.length) throw apiError_("EMPTY_CART", "ตะกร้าสินค้าว่าง", 400);
  if (PAYMENT_METHODS.indexOf(paymentMethod) === -1) {
    throw apiError_("INVALID_PAYMENT_METHOD", "รูปแบบการชำระเงินไม่ถูกต้อง", 400);
  }

  const customer = findByIdOrThrow_(CONFIG.SHEETS.CUSTOMERS, "customer_id", customerId);
  const restaurant = findByIdOrThrow_(CONFIG.SHEETS.RESTAURANTS, "restaurant_id", restaurantId);
  const address = findByIdOrThrow_(CONFIG.SHEETS.ADDRESSES, "address_id", addressId);
  if (String(address.customer_id) !== String(customerId)) {
    throw apiError_("ADDRESS_NOT_OWNED", "ที่อยู่นี้ไม่ใช่ของลูกค้า", 403);
  }
  if (!toBoolean_(customer.is_active) || !toBoolean_(restaurant.is_active)) {
    throw apiError_("INACTIVE_ACCOUNT", "ลูกค้าหรือร้านค้าไม่พร้อมใช้งาน", 400);
  }

  const menuById = indexBy_(readTable_(CONFIG.SHEETS.MENU_ITEMS), "menu_item_id");
  const groupById = indexBy_(readTable_(CONFIG.SHEETS.CUSTOMIZATION_GROUPS), "group_id");
  const optionById = indexBy_(readTable_(CONFIG.SHEETS.CUSTOMIZATION_OPTIONS), "option_id");
  const normalizedItems = [];
  let subtotal = 0;

  items.forEach(function (requestedItem) {
    const menuId = required_(requestedItem.menu_item_id, "items[].menu_item_id");
    const menu = menuById[String(menuId)];
    if (!menu || String(menu.restaurant_id) !== String(restaurantId) || !toBoolean_(menu.is_available)) {
      throw apiError_("MENU_NOT_AVAILABLE", "เมนูไม่พร้อมขาย: " + menuId, 400);
    }

    const quantity = positiveInteger_(requestedItem.quantity, "items[].quantity");
    const selectedOptionIds = uniqueStrings_(requestedItem.option_ids || []);
    const selectedByGroup = {};
    let optionTotal = 0;
    const selectedOptions = selectedOptionIds.map(function (optionId) {
      const option = optionById[optionId];
      if (!option || !toBoolean_(option.is_active)) {
        throw apiError_("OPTION_NOT_AVAILABLE", "ตัวเลือกไม่พร้อมใช้งาน: " + optionId, 400);
      }
      const group = groupById[String(option.group_id)];
      if (!group || String(group.menu_item_id) !== String(menuId) || !toBoolean_(group.is_active)) {
        throw apiError_("OPTION_NOT_FOR_MENU", "ตัวเลือกไม่ตรงกับเมนู: " + optionId, 400);
      }
      const groupId = String(group.group_id);
      selectedByGroup[groupId] = (selectedByGroup[groupId] || 0) + 1;
      optionTotal += Number(option.extra_price || 0);
      return { group: group, option: option };
    });

    readTable_(CONFIG.SHEETS.CUSTOMIZATION_GROUPS)
      .filter(function (group) {
        return String(group.menu_item_id) === String(menuId) && toBoolean_(group.is_active);
      })
      .forEach(function (group) {
        const count = selectedByGroup[String(group.group_id)] || 0;
        const min = Number(group.min_select || (toBoolean_(group.is_required) ? 1 : 0));
        const max = Number(group.max_select || (String(group.selection_type) === "radio" ? 1 : 999));
        if (count < min || count > max) {
          throw apiError_("INVALID_OPTION_COUNT", "จำนวนตัวเลือกไม่ถูกต้องในกลุ่ม " + group.title, 400);
        }
      });

    const basePrice = Number(menu.base_price || 0);
    const unitPrice = roundMoney_(basePrice + optionTotal);
    const lineTotal = roundMoney_(unitPrice * quantity);
    subtotal += lineTotal;
    normalizedItems.push({
      menu: menu,
      quantity: quantity,
      basePrice: basePrice,
      unitPrice: unitPrice,
      lineTotal: lineTotal,
      specialNote: String(requestedItem.special_note || "").trim(),
      selectedOptions: selectedOptions,
    });
  });

  subtotal = roundMoney_(subtotal);
  const deliveryFee = subtotal >= CONFIG.FREE_DELIVERY_MINIMUM ? 0 : CONFIG.DELIVERY_FEE;
  const discount = 0;
  const total = roundMoney_(subtotal + deliveryFee - discount);
  const timestamp = now_();
  const orderId = nextId_("ORD", CONFIG.SHEETS.ORDERS, "order_id", 8);
  const orderNumber = makeOrderNumber_();
  const paymentStatus = paymentMethod === "เงินสดปลายทาง" ? "pending" : "pending";

  const orderRow = {
    order_id: orderId,
    order_number: orderNumber,
    customer_id: customerId,
    restaurant_id: restaurantId,
    address_id: addressId,
    rider_id: "",
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    discount: discount,
    total: total,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    order_status: "received",
    note: String(body.note || "").trim(),
    ordered_at: timestamp,
    updated_at: timestamp,
  };
  appendObject_(CONFIG.SHEETS.ORDERS, orderRow);

  normalizedItems.forEach(function (item) {
    const orderItemId = nextId_("ORI", CONFIG.SHEETS.ORDER_ITEMS, "order_item_id", 9);
    appendObject_(CONFIG.SHEETS.ORDER_ITEMS, {
      order_item_id: orderItemId,
      order_id: orderId,
      menu_item_id: item.menu.menu_item_id,
      item_name_snapshot: item.menu.name,
      base_price_snapshot: item.basePrice,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
      special_note: item.specialNote,
    });
    item.selectedOptions.forEach(function (selected) {
      appendObject_(CONFIG.SHEETS.ORDER_ITEM_OPTIONS, {
        order_item_option_id: nextId_("OIO", CONFIG.SHEETS.ORDER_ITEM_OPTIONS, "order_item_option_id", 10),
        order_item_id: orderItemId,
        group_title_snapshot: selected.group.title,
        option_name_snapshot: selected.option.name,
        extra_price_snapshot: Number(selected.option.extra_price || 0),
      });
    });
  });

  const paymentId = nextId_("PAY", CONFIG.SHEETS.PAYMENTS, "payment_id", 8);
  appendObject_(CONFIG.SHEETS.PAYMENTS, {
    payment_id: paymentId,
    order_id: orderId,
    method: paymentMethod,
    amount: total,
    status: paymentStatus,
    transaction_ref: String(body.transaction_ref || "").trim(),
    paid_at: "",
    created_at: timestamp,
  });
  appendStatusHistory_(orderId, "received", "customer", customerId, "สร้างออเดอร์");

  return {
    order_id: orderId,
    order_number: orderNumber,
    subtotal: subtotal,
    delivery_fee: deliveryFee,
    discount: discount,
    total: total,
    payment_id: paymentId,
    payment_status: paymentStatus,
    order_status: "received",
    ordered_at: timestamp,
  };
}

function getOrder_(params) {
  const orderId = String(params.order_id || "").trim();
  const orderNumber = String(params.order_number || "").trim();
  if (!orderId && !orderNumber) {
    throw apiError_("MISSING_PARAMETER", "ต้องระบุ order_id หรือ order_number", 400);
  }

  const orders = readTable_(CONFIG.SHEETS.ORDERS);
  const order = orders.find(function (row) {
    return orderId
      ? String(row.order_id) === orderId
      : String(row.order_number) === orderNumber;
  });
  if (!order) throw apiError_("ORDER_NOT_FOUND", "ไม่พบออเดอร์", 404);

  const orderItems = readTable_(CONFIG.SHEETS.ORDER_ITEMS)
    .filter(function (row) { return String(row.order_id) === String(order.order_id); });
  const itemIds = {};
  orderItems.forEach(function (row) { itemIds[String(row.order_item_id)] = true; });
  const optionsByItem = groupBy_(
    readTable_(CONFIG.SHEETS.ORDER_ITEM_OPTIONS)
      .filter(function (row) { return itemIds[String(row.order_item_id)]; }),
    "order_item_id"
  );

  const result = publicRow_(order);
  result.items = orderItems.map(function (item) {
    const itemResult = publicRow_(item);
    itemResult.options = (optionsByItem[String(item.order_item_id)] || []).map(publicRow_);
    return itemResult;
  });
  result.status_history = readTable_(CONFIG.SHEETS.ORDER_STATUS_HISTORY)
    .filter(function (row) { return String(row.order_id) === String(order.order_id); })
    .map(publicRow_);
  return result;
}

function updateOrderStatus_(body) {
  const orderId = required_(body.order_id, "order_id");
  const nextStatus = required_(body.status, "status");
  if (ORDER_STATUSES.indexOf(nextStatus) === -1) {
    throw apiError_("INVALID_ORDER_STATUS", "สถานะออเดอร์ไม่ถูกต้อง", 400);
  }

  const order = findByIdOrThrow_(CONFIG.SHEETS.ORDERS, "order_id", orderId);
  validateStatusTransition_(String(order.order_status), nextStatus);
  updateById_(CONFIG.SHEETS.ORDERS, "order_id", orderId, {
    order_status: nextStatus,
    updated_at: now_(),
  });
  appendStatusHistory_(
    orderId,
    nextStatus,
    String(body.changed_by_type || "system"),
    String(body.changed_by_id || ""),
    String(body.note || "")
  );
  return { order_id: orderId, order_status: nextStatus, updated_at: now_() };
}

function updatePaymentStatus_(body) {
  const orderId = required_(body.order_id, "order_id");
  const status = required_(body.status, "status");
  if (PAYMENT_STATUSES.indexOf(status) === -1) {
    throw apiError_("INVALID_PAYMENT_STATUS", "สถานะการชำระเงินไม่ถูกต้อง", 400);
  }
  findByIdOrThrow_(CONFIG.SHEETS.ORDERS, "order_id", orderId);

  const payment = readTable_(CONFIG.SHEETS.PAYMENTS)
    .find(function (row) { return String(row.order_id) === String(orderId); });
  if (!payment) throw apiError_("PAYMENT_NOT_FOUND", "ไม่พบข้อมูลการชำระเงิน", 404);

  const paidAt = status === "paid" ? now_() : "";
  updateById_(CONFIG.SHEETS.PAYMENTS, "payment_id", payment.payment_id, {
    status: status,
    transaction_ref: String(body.transaction_ref || payment.transaction_ref || ""),
    paid_at: paidAt,
  });
  updateById_(CONFIG.SHEETS.ORDERS, "order_id", orderId, {
    payment_status: status,
    updated_at: now_(),
  });
  return { order_id: orderId, payment_id: payment.payment_id, payment_status: status, paid_at: paidAt };
}

function appendStatusHistory_(orderId, status, changedByType, changedById, note) {
  appendObject_(CONFIG.SHEETS.ORDER_STATUS_HISTORY, {
    history_id: nextId_("HIS", CONFIG.SHEETS.ORDER_STATUS_HISTORY, "history_id", 10),
    order_id: orderId,
    status: status,
    changed_by_type: changedByType,
    changed_by_id: changedById,
    note: note,
    created_at: now_(),
  });
}

function validateStatusTransition_(current, next) {
  if (current === next) return;
  const allowed = {
    received: ["preparing", "cancelled"],
    preparing: ["delivering", "cancelled"],
    delivering: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  if (!allowed[current] || allowed[current].indexOf(next) === -1) {
    throw apiError_("INVALID_STATUS_TRANSITION", "เปลี่ยนสถานะจาก " + current + " เป็น " + next + " ไม่ได้", 409);
  }
}

function clearDefaultAddresses_(customerId) {
  const sheet = getSheet_(CONFIG.SHEETS.ADDRESSES);
  const headers = getHeaders_(sheet);
  const customerCol = headers.indexOf("customer_id");
  const defaultCol = headers.indexOf("is_default");
  if (sheet.getLastRow() < 2) return;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  values.forEach(function (row, index) {
    if (String(row[customerCol]) === String(customerId) && toBoolean_(row[defaultCol])) {
      sheet.getRange(index + 2, defaultCol + 1).setValue(false);
    }
  });
}

function getDb_() {
  const configuredId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (configuredId) return SpreadsheetApp.openById(configuredId);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error("ไม่พบ Spreadsheet โปรดผูกสคริปต์กับ Google Sheets แล้วรัน setup()");
  return active;
}

function getSheet_(name) {
  const sheet = getDb_().getSheetByName(name);
  if (!sheet) throw new Error("ไม่พบชีต: " + name);
  return sheet;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
}

function readTable_(sheetName) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !headers.length) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues()
    .filter(function (row) {
      return row.some(function (value) { return value !== "" && value !== null; });
    })
    .map(function (row, index) {
      const object = { _rowNumber: index + 2 };
      headers.forEach(function (header, column) { object[header] = row[column]; });
      return object;
    });
}

function appendObject_(sheetName, object) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const values = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(object, header) ? object[header] : "";
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([values]);
}

function updateById_(sheetName, idField, idValue, changes) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const idColumn = headers.indexOf(idField);
  if (idColumn === -1) throw new Error("ไม่พบคอลัมน์: " + idField);
  if (sheet.getLastRow() < 2) throw apiError_("RECORD_NOT_FOUND", "ไม่พบข้อมูล", 404);
  const ids = sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const index = ids.findIndex(function (row) { return String(row[0]) === String(idValue); });
  if (index === -1) throw apiError_("RECORD_NOT_FOUND", "ไม่พบข้อมูล: " + idValue, 404);
  const rowNumber = index + 2;
  Object.keys(changes).forEach(function (field) {
    const column = headers.indexOf(field);
    if (column !== -1) sheet.getRange(rowNumber, column + 1).setValue(changes[field]);
  });
}

function deleteById_(sheetName, idField, idValue) {
  const sheet = getSheet_(sheetName);
  const headers = getHeaders_(sheet);
  const idColumn = headers.indexOf(idField);
  if (idColumn === -1) throw new Error("ไม่พบคอลัมน์: " + idField);
  if (sheet.getLastRow() < 2) throw apiError_("RECORD_NOT_FOUND", "ไม่พบข้อมูล", 404);
  const ids = sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  const index = ids.findIndex(function (row) { return String(row[0]) === String(idValue); });
  if (index === -1) throw apiError_("RECORD_NOT_FOUND", "ไม่พบข้อมูล: " + idValue, 404);
  sheet.deleteRow(index + 2);
}

function findByIdOrThrow_(sheetName, field, value) {
  const row = readTable_(sheetName).find(function (item) {
    return String(item[field]) === String(value);
  });
  if (!row) throw apiError_("RECORD_NOT_FOUND", "ไม่พบ " + field + ": " + value, 404);
  return row;
}

function nextId_(prefix, sheetName, field, width) {
  const rows = readTable_(sheetName);
  let max = 0;
  rows.forEach(function (row) {
    const match = String(row[field] || "").match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return prefix + String(max + 1).padStart(width, "0");
}

function makeOrderNumber_() {
  return Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyyMMddHHmmss") +
    String(Math.floor(Math.random() * 100)).padStart(2, "0");
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw apiError_("EMPTY_BODY", "ไม่พบ JSON body", 400);
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw apiError_("INVALID_JSON", "JSON body ไม่ถูกต้อง", 400);
  }
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw apiError_("BUSY", "ระบบกำลังประมวลผล กรุณาลองใหม่", 503);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function indexBy_(rows, field) {
  return rows.reduce(function (result, row) {
    result[String(row[field])] = row;
    return result;
  }, {});
}

function groupBy_(rows, field) {
  return rows.reduce(function (result, row) {
    const key = String(row[field]);
    if (!result[key]) result[key] = [];
    result[key].push(row);
    return result;
  }, {});
}

function sortByNumberField_(field) {
  return function (a, b) { return Number(a[field] || 0) - Number(b[field] || 0); };
}

function publicRow_(row) {
  const copy = {};
  Object.keys(row).forEach(function (key) {
    if (key !== "_rowNumber" && key !== "password_hash") copy[key] = row[key];
  });
  return copy;
}

function required_(value, field) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw apiError_("MISSING_FIELD", "กรุณาระบุ " + field, 400);
  }
  return typeof value === "string" ? value.trim() : value;
}

function positiveInteger_(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    throw apiError_("INVALID_NUMBER", field + " ต้องเป็นจำนวนเต็ม 1-99", 400);
  }
  return number;
}

function nullableNumber_(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) throw apiError_("INVALID_NUMBER", "ค่าพิกัดไม่ถูกต้อง", 400);
  return number;
}

function normalizePhone_(value) {
  const phone = String(value || "").replace(/[^\d+]/g, "");
  if (phone.length < 9 || phone.length > 15) {
    throw apiError_("INVALID_PHONE", "รูปแบบเบอร์โทรไม่ถูกต้อง", 400);
  }
  return phone;
}

function uniqueStrings_(values) {
  const seen = {};
  return values.map(String).filter(function (value) {
    if (seen[value]) return false;
    seen[value] = true;
    return true;
  });
}

function toBoolean_(value) {
  return value === true || String(value).toLowerCase() === "true" || String(value) === "1";
}

function roundMoney_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function now_() {
  return Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyy-MM-dd HH:mm:ss");
}

function apiError_(code, message, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status || 400;
  return error;
}

function errorResponse_(error) {
  console.error(error && error.stack ? error.stack : error);
  return json_({
    ok: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "เกิดข้อผิดพลาดภายในระบบ",
      status: error.status || 500,
    },
  });
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

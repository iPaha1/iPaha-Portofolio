// lib/config/dashboard-configs.ts
import type { DashboardConfig } from "@/lib/actions/company-actions";

// Default dashboard config for iPaha Ltd
export const IPAHA_LTD_DASHBOARD_CONFIG: DashboardConfig = {
  nav: [
    {
      id: "main",
      label: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", iconName: "LayoutDashboard", href: "/dashboard" },
        { id: "bookings", label: "Bookings", iconName: "Calendar", href: "/bookings" },
        { id: "clients", label: "Clients", iconName: "Users", href: "/clients" },
        { id: "invoices", label: "Invoices", iconName: "FileText", href: "/invoices" },
        { id: "portal", label: "Client Portal", iconName: "Globe", href: "/portal" },
      ],
    },
    {
      id: "dev",
      label: "Developer",
      items: [
        { id: "api-keys", label: "API Keys", iconName: "Key", href: "/api-keys" },
        { id: "webhooks", label: "Webhooks", iconName: "Webhook", href: "/webhooks" },
        { id: "logs", label: "Logs", iconName: "Terminal", href: "/logs" },
      ],
    },
    {
      id: "config",
      label: "Settings",
      items: [
        { id: "settings", label: "Settings", iconName: "Settings", href: "/settings" },
      ],
    },
  ],
  modules: ["bookings", "contacts", "invoices", "client_portal", "api_keys", "webhooks"],
  settings: { currency: "GBP", timezone: "Europe/London" },
};

// Default dashboard config for iPahaStores Ltd
export const IPAHASTORES_DASHBOARD_CONFIG: DashboardConfig = {
  nav: [
    {
      id: "main",
      label: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", iconName: "LayoutDashboard", href: "/dashboard" },
        { id: "products", label: "Products", iconName: "Package", href: "/products" },
        { id: "orders", label: "Orders", iconName: "ShoppingCart", href: "/orders" },
        { id: "inventory", label: "Inventory", iconName: "Boxes", href: "/inventory" },
        { id: "customers", label: "Customers", iconName: "Users", href: "/customers" },
        { id: "shipping", label: "Shipping", iconName: "Truck", href: "/shipping" },
      ],
    },
    {
      id: "dev",
      label: "Developer",
      items: [
        { id: "api-keys", label: "API Keys", iconName: "Key", href: "/api-keys" },
        { id: "webhooks", label: "Webhooks", iconName: "Webhook", href: "/webhooks" },
        { id: "logs", label: "Logs", iconName: "Terminal", href: "/logs" },
      ],
    },
  ],
  modules: ["products", "orders", "inventory", "customers", "shipping", "api_keys", "webhooks"],
  settings: { currency: "GBP", timezone: "Europe/London", vatNumber: "" },
};
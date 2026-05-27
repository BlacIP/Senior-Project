import { auth } from "@/lib/auth";

export const { DELETE, GET, PATCH, POST, PUT } = auth.handler();

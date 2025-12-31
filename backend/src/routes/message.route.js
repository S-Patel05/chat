import express from "express";
import {
  getAllContacts,
  getChatPartners,
   getMessagesByUserId,
   sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";


const router = express.Router();

// the midleware execute in order - so request get rate-limited first, then authenticated.
// this is actually more efficient since unathenticated request get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
 router.get("/:id", getMessagesByUserId);
 router.post("/send/:id", sendMessage);

export default router;
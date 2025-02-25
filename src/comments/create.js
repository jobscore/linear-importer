import linearClient from "../../config/client.mjs";

import { detailedLogger } from "../../logger/logger_instance.js";

async function createComment({ issueId, body }) {
  try {
    const response = await linearClient.createComment({
      issueId,
      body,
    });

    if (response.success) {
      detailedLogger.createdSecondary(
        `Comment`,
        response._comment.id,
        `${body.slice(0, 30)}...`,
      );
    } else {
      detailedLogger.error(`Error creating comment: ${response.errors}`);
      process.exit(1);
    }
  } catch (error) {
    detailedLogger.error(`Error creating comment: ${response.errors}`);
    process.exit(1);
  }
}

export default createComment;

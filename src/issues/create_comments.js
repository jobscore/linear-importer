import createComment from "../comments/create.js";
import { REQUEST_DELAY_MS } from "../../config/config.js";
import { detailedLogger } from "../../logger/logger_instance.js";

async function createComments({ issue, newIssue }) {
  detailedLogger.loading(`Finding comments for story ${issue.id}`);

  if (issue.comments.length === 0) {
    detailedLogger.info(`No comments found for story ${issue.id}.`);
    return;
  }

  // Create comments
  for (const body of issue.comments) {
    const userData = parseCommentDetails(body);

    if (!userData) {
      await createComment({
        issueId: newIssue._issue.id,
        body: body,
      });
    } else {
      await createComment({
        issueId: newIssue._issue.id,
        body: userData.body,
        createAsUser: userData.user,
        createdAt: userData.date
      });
    }

    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }
}

function parseCommentDetails(body) {
  if (!body || typeof body !== 'string') {
    return null;
  }

  const regex = /^([\s\S]*?)\s*\((.+?)\s*-\s*(.+?)\)$/;
  const match = body.match(regex);

  if (!match) {
    return;
  }

  const [, commentBody, user, dateString] = match;
  const date = new Date(dateString.trim());

  return {
    body: commentBody,
    user: user.trim(),
    date: date.toISOString()
  }
}

export default createComments;

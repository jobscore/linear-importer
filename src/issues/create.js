import linearClient from "../../config/client.mjs";
import { detailedLogger } from "../../logger/logger_instance.js";
import logSuccessfulImport from "../../logger/log_successful_import.js";
import fetchLabels from "../labels/list.js";
import fetchStatuses from "../statuses/list.mjs";
import fetchIssueEstimationSettings from "../estimates/list.mjs";
import { REQUEST_DELAY_MS } from "../../config/config.js";
import buildIssueParams from "./build_issue_params.js";
import createComments from "./create_comments.js";
import createFileAttachments from "./create_file_attachments.js";
import { RELEASE_LABEL_NAME } from "../labels/pivotal/_constants.js";
import fetchIssuesForTeam from "./list.mjs";

async function create({
  team,
  issuesPayload,
  options,
  importSource,
  directory,
}) {
  // Keep outside of loop to only fetch these values once
  const teamStatuses = await fetchStatuses(team.id);
  const teamLabels = await fetchLabels(team.id);
  const { scale } = await fetchIssueEstimationSettings(team.id);
  // Fetch release issues to set parentId
  const releaseIssues = await fetchIssuesForTeam({
    teamId: team.id,
    filters: {
      labels: { some: { name: { eq: RELEASE_LABEL_NAME } } },
    },
  });

  for (const [index, issue] of issuesPayload.entries()) {
    try {
      const issueParams = await buildIssueParams({
        team,
        issue,
        options,
        importSource,
        teamStatuses,
        teamLabels,
        scale,
        index,
        releaseIssues,
      });

      // Create Issue
      const newIssue = await linearClient.createIssue(issueParams);

      // Create Zendesk Ticket
      await createZendeskLinks(linearClient, newIssue._issue.id, issue, detailedLogger);

      // Create Pull Request
      await createGitHubPRLinks(linearClient, newIssue._issue.id, issue, detailedLogger);

      // Create Intercom Link
      await createIntercomLinks(linearClient, newIssue._issue.id, issue, detailedLogger);

      // Create Comments
      if (options.shouldImportComments)
        await createComments({ issue, newIssue });

      // Create File Attachments
      if (options.shouldImportFiles)
        await createFileAttachments({ issue, newIssue, directory });

      // Write successful import to log
      await logSuccessfulImport({
        team,
        issue,
        newIssue,
        importNumber: index + 1,
      });

      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    } catch (error) {
      detailedLogger.importantError(`Failed to create issue: ${error.message}`);
      process.exit(0);
    }
  }
}

async function createZendeskLinks(linearClient, linearIssueId, issue, detailedLogger) {
  if (!issue.zendeskId) return;

  try {
    await linearClient.attachmentLinkZendesk(linearIssueId, issue.zendeskId);
  } catch (error) {
    detailedLogger.error(
      `Failed to create Zendesk link: ${error.message}. ` +
      `Issue: ${linearIssueId} - ${issue.title}. ` +
      `Zendesk ID: ${issue.zendeskId}`
    );
  }
}

async function createGitHubPRLinks(linearClient, linearIssueId, issue, detailedLogger) {
  if (!issue.pullRequests) return;

  const normalizedPRs = Array.isArray(issue.pullRequests)
    ? issue.pullRequests.filter(Boolean)
    : [issue.pullRequests];

  const prLinks = normalizedPRs.map(pr =>
    pr.startsWith("https://github.com/") ? pr : `https://github.com/${pr}`
  );

  try {
    await Promise.all(
      prLinks.map(prLink =>
        linearClient.attachmentLinkGitHubPR(linearIssueId, prLink)
      )
    );
  } catch (error) {
    detailedLogger.error(
      `Failed to create Pull Request link: ${error.message}. ` +
      `Issue: ${linearIssueId} - ${issue.title}. ` +
      `Pull Requests: ${prLinks.join(', ')}`
    );
  }
}

async function createIntercomLinks(linearClient, linearIssueId, issue, detailedLogger) {
  if (!issue.intercomId) return;

  try {
    await linearClient.attachmentLinkIntercom(issue.intercomId, linearIssueId);
  } catch (error) {
    detailedLogger.error(
      `Failed to create Intercom link: ${error.message}. ` +
      `Issue: ${linearIssueId} - ${issue.title}. ` +
      `Intercom ID: ${issue.intercomId}`
    );
  }
}

export default create;

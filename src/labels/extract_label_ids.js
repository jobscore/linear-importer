import { detailedLogger } from "../../logger/logger_instance.js";

function extractLabelIds(issue, teamLabels, shouldImportLabels, importSource) {
  // Create a Map for O(1) label lookups
  const labelMap = new Map(teamLabels.map((label) => [label.name, label.id]));

  // Single lookup for type label
  const typeColumnLabelName = issue.type;
  const typeColumnLabelId = labelMap.get(typeColumnLabelName.toUpperCase());

  // This should always be present. If it's not, something is wrong and we should halt
  if (!typeColumnLabelId) {
    detailedLogger.error(
      `No label found from 'Type' column for ${issue.type}, ${issue.type.length}`,
    );

    process.exit(0);
  }

  // Process other labels if included options
  const otherLabelIds = shouldImportLabels
    ? issue.labels
      ? issue.labels.split(",").reduce((ids, label) => {
          const id = labelMap.get(label.trim());
          if (id) ids.push(id);
          return ids;
        }, [])
      : []
    : [];

  return [typeColumnLabelId, ...otherLabelIds].filter(Boolean);
}

export default extractLabelIds;

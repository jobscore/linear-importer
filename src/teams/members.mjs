import linearClient from "../../config/client.mjs";
import { detailedLogger } from "../../logger/logger_instance.js";

async function _getTeamMembers({ teamId }) {
  try {
    const team = await linearClient.team(teamId); // Pass teamId directly, not as an object
    let members = await team.members();

    while (members.pageInfo.hasNextPage) {
      members = await members.fetchNext();
    }

    detailedLogger.info(`Team Members: ${JSON.stringify(members, null, 2)}`);
    return { teamMembers: members };
  } catch (error) {
    detailedLogger.error(`Error fetching team members: ${error.message}`);
    return { teamMembers: [] };
  }
}

async function getTeamMembers({ teamId }) {
  try {
    let users = await linearClient.users({includeDisabled: true});

    while (users.pageInfo.hasNextPage) {
      users = await users.fetchNext();
    }

    detailedLogger.info(`Users: ${JSON.stringify(users, null, 2)}`);
    return { teamMembers: users };
  } catch (error) {
    detailedLogger.error(`Error fetching users: ${error.message}`);
    return { teamMembers: [] };
  }
}

export default getTeamMembers;

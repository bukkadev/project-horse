const { query } = require("../db/index");
const mmr = require("../mmr/mmr");
const { LOBBY_LOCK_TIME, LOBBY_SIZE } = require("../common/constants");
const LobbyPlayers = require("./lobby-players");
const Players = require("../db//players");

module.exports = {
  async getAllLobbies() {
    const { rows } = await query(`
      SELECT lobby_id, region, min_rank, max_rank,
        count(*) as lobbySize
      FROM lobbies
      JOIN lobby_players
      USING (lobby_id)
      GROUP BY lobby_id
      ORDER BY max_rank desc`);
    return rows;
  },

  async getAllLobbiesForPlayer(steamID) {
    try {
      const mmr = await LobbyPlayers.getPlayerMMR(steamID);
      const { rows } = await query(
        `
        SELECT lobby_id, region, min_rank, max_rank,
          count(*) as lobbySize
        FROM lobbies
        JOIN lobby_players
        USING (lobby_id)
        WHERE min_rank <= $1 AND max_rank >= $1
        GROUP BY lobby_id
        ORDER BY max_rank desc`,
        [mmr]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getLobby(lobbyID) {
    const { rows } = await query(
      `
      SELECT lobby_id, region, min_rank, max_rank, lobby_password,
        (lock_time > NOW() - INTERVAL '${LOBBY_LOCK_TIME} SECONDS') as locked,
        EXTRACT(EPOCH FROM NOW()) - EXTRACT(EPOCH FROM lock_time) as time_since_lock
      FROM lobbies
      WHERE lobby_id = $1
    `,
      [lobbyID]
    );

    const lobby = rows[0];
    if (lobby && lobby.locked == null) {
      lobby.locked = false;
    }

    return lobby;
  },

  async isLobbyLocked(lobbyID) {
    const lobby = await this.getLobby(lobbyID);
    return false;
  },

  async lockLobby(lobbyID) {
    await query(`UPDATE lobbies SET lock_time = NOW() WHERE lobby_id = $1`, [
      lobbyID,
    ]);
  },

  async unlockLobby(lobbyID) {
    await query("UPDATE lobbies SET lock_time = NULL WHERE lobby_id = $1", [
      lobbyID,
    ]);
  },

  async setLobbyPassword(lobbyID, password) {
    await query(`UPDATE lobbies SET lobby_password = $2 WHERE lobby_id = $1`, [
      lobbyID,
      password,
    ]);
  },

  async getLobbyPlayers(lobbyID) {
    const { rows } = await query(
      `
      SELECT players.steam_id, is_host, username, avatar, ladder_mmr, leaderboard_rank as rank
      FROM lobby_players
      JOIN players
      USING (steam_id)
      WHERE lobby_id = $1
    `,
      [lobbyID]
    );
    for (const player of rows) {
      player.badge = mmr.getRankBadge(player.ladder_mmr);
      player.pips = mmr.getRankPips(player.ladder_mmr);
    }

    return rows;
  },

  async getDetailedLobby(lobbyID) {
    const lobby = await this.getLobby(lobbyID);
    const lobbyPlayers = await this.getLobbyPlayers(lobbyID);

    return {
      ...lobby,
      lobbyPlayers,
    };
  },

  async getLobbySize(lobbyID) {
    const { rows } = await query(
      `
      SELECT count(*) as size FROM lobbies JOIN lobby_players USING (lobby_id)
      WHERE lobby_id = $1
    `,
      [lobbyID]
    );

    return rows[0].size;
  },

  async isFull(lobbyID) {
    const lobbySize = await this.getLobbySize(lobbyID);
    return lobbySize >= LOBBY_SIZE;
  },

  async makeLobby(steamID, avatar, region, minRank, maxRank) {
    try {
      // Create the lobby
      const { rows } = await query(
        `INSERT INTO
        lobbies(region, min_rank, max_rank)
        VALUES($1, $2, $3)
        RETURNING lobby_id`,
        [region, minRank, maxRank]
      );
      const lobbyID = rows[0].lobby_id;

      // Insert the player as host
      await query(
        `INSERT INTO
        lobby_players(lobby_id, steam_id, is_host, avatar)
        VALUES ($1, $2, $3, $4)`,
        [lobbyID, steamID, true, avatar]
      );

      return lobbyID;
    } catch (e) {
      throw e;
    }
  },

  async deleteLobby(lobbyID) {
    console.log(`Deleting Lobby ${lobbyID}`);
    let queryText = `DELETE FROM lobby_players WHERE lobby_id = $1`;
    await query(queryText, [lobbyID]);
    queryText = `DELETE FROM lobbies WHERE lobby_id = $1`;
    await query(queryText, [lobbyID]);
  },

  async updateHost(lobbyID) {
    const players = await this.getLobbyPlayers(lobbyID);

    // Make sure there isn't already a host
    for (const player of players) {
      if (player.is_host) return;
    }

    const newHostSteamID = players[0].steam_id;
    await LobbyPlayers.setIsHost(newHostSteamID, true);
  },
};

const { query } = require("./index");

module.exports = {
  async getAllCosmetics() {
    try {
      const { rows } = await query(
        `SELECT * FROM cosmetics ORDER BY cosmetic_type, cosmetic_name`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getCosmetic(cosmeticID) {
    try {
      const { rows } = await query(
        `SELECT * FROM cosmetics WHERE cosmetic_id = $1`,
        [cosmeticID]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async getEquipGroup(cosmeticID) {
    try {
      const { rows } = await query(
        `SELECT equip_group FROM cosmetics WHERE cosmetic_id = $1`,
        [cosmeticID]
      );
      return rows[0].equip_group;
    } catch (error) {
      throw error;
    }
  },

  async getCosmeticsByRarity(rarity) {
    try {
      const { rows } = await query(
        `
        SELECT * FROM cosmetics
        WHERE rarity = $1
          AND cost > 0
          AND cosmetic_type != 'Chest'
      `,
        [rarity]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getPurchaseableCosmetics() {
    try {
      const { rows } = await query(`SELECT * FROM cosmetics WHERE cost > 0`);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async createCosmetic(name, type, equipGroup, coins, cost, rarity) {
    try {
      const sql_query = `
        INSERT INTO cosmetics (cosmetic_name, cosmetic_type, equip_group, cost_coins, cost_usd, rarity)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const { rows } = await query(sql_query, [
        name,
        type,
        equipGroup,
        coins,
        cost,
        rarity,
      ]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async addChestItemReward(chestID, rarity, odds) {
    try {
      const { rows } = await query(
        `
      INSERT INTO chest_item_rewards (cosmetic_id, reward_rarity, reward_odds)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [chestID, rarity, odds]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async addChestCoinsReward(chestID, coins, cumSum) {
    try {
      const { rows } = await query(
        `
      INSERT INTO chest_coin_rewards (cosmetic_id, coins, cum_sum)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [chestID, coins, cumSum]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async addChestBonusReward(chestID, reward, cumSum) {
    try {
      const { rows } = await query(
        `
      INSERT INTO chest_bonus_rewards
      (cosmetic_id, reward_id, cum_sum)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
        [chestID, reward, cumSum]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getAllChestRewards() {
    try {
      const { rows: itemRewards } = await query(
        `SELECT * FROM chest_item_rewards`
      );
      const { rows: poggerRewards } = await query(
        `SELECT * FROM chest_pogger_rewards`
      );
      const { rows: bonusRewards } = await query(
        `SELECT * FROM chest_bonus_rewards`
      );
      return [...itemRewards, ...poggerRewards, ...bonusRewards];
    } catch (error) {
      throw error;
    }
  },

  async getPotentialChestRewards(chestID) {
    try {
      const { rows: itemRewards } = await query(
        `SELECT * FROM chest_item_rewards WHERE cosmetic_id = $1`,
        [chestID]
      );
      const { rows: poggerRewards } = await query(
        `SELECT * FROM chest_pogger_rewards WHERE cosmetic_id = $1`,
        [chestID]
      );
      const { rows: bonusRewards } = await query(
        `SELECT * FROM chest_bonus_rewards WHERE cosmetic_id = $1`,
        [chestID]
      );
      return [...itemRewards, ...poggerRewards, ...bonusRewards];
    } catch (error) {
      throw error;
    }
  },
};

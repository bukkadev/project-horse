const { query } = require("./index");

module.exports = {
  async addTransactionLog(steamID, type, transaction) {
    try {
      await query(
        `
        INSERT INTO player_logs (steam_id, log_event, log_data)
        VALUES ($1, $2, $3)
      `,
        [steamID, type, transaction]
      );
    } catch (error) {
      throw error;
    }
  },

  async getLogsOfType(type) {
    try {
      const { rows } = await query(
        `
        SELECT * FROM player_logs
        WHERE log_event = $1
        ORDER BY log_time DESC
      `,
        [type]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getPaypalPayments() {
    try {
      const { rows } = await query(`
        SELECT steam_id, log_time,
          log_data->'capture'->'result'->'purchase_units'->0->'payments'->'captures'->0->'seller_receivable_breakdown'->'gross_amount'->>'value' AS gross_amount,
          log_data->'capture'->'result'->'purchase_units'->0->'payments'->'captures'->0->'seller_receivable_breakdown'->'paypal_fee'->>'value' AS paypal_fee,
          log_data->'capture'->'result'->'purchase_units'->0->'payments'->'captures'->0->'seller_receivable_breakdown'->'net_amount'->>'value' AS net_amount
        FROM player_logs
        WHERE log_event = 'paypal'
        ORDER BY log_time DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getTotalPaypalPayments() {
    try {
      const { rows } = await query(`
        SELECT SUM((log_data->'capture'->'result'->'purchase_units'->0->'payments'->'captures'->0->'seller_receivable_breakdown'->'net_amount'->>'value') :: DECIMAL) AS net_amount
        FROM player_logs
        WHERE log_event = 'paypal';
      `);
      return rows[0].net_amount;
    } catch (error) {
      throw error;
    }
  },

  async getStripePayments() {
    try {
      const { rows } = await query(`
        SELECT steam_id, log_time,
          log_data->'intent'->>'amount' AS amount
        FROM player_logs
        WHERE log_event = 'stripe'
        ORDER BY log_time DESC;
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getTotalStripePayments() {
    try {
      const { rows } = await query(`
        SELECT SUM((log_data->'intent'->>'amount') :: DECIMAL * 0.01) AS amount
        FROM player_logs
        WHERE log_event = 'stripe';`);
      return rows[0].amount;
    } catch (error) {
      throw error;
    }
  },

  async getPaypalByEmail(email) {
    try {
      const { rows } = await query(
        `
        SELECT steam_id FROM player_logs
        WHERE log_event = 'paypal'
          AND log_data->'capture'->'result'->'payment_source'->'paypal'->>'email_address' = $1`,
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async getLogsForPlayer(steamID) {
    try {
      const { rows } = await query(
        `
        SELECT * FROM player_logs
        WHERE steam_id = $1
        ORDER BY log_time DESC
      `,
        [steamID]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getLogsOfTypeForPlayer(steamID, type) {
    try {
      const { rows } = await query(
        `
        SELECT * FROM player_logs
        WHERE steam_id = $1 AND log_event = $2
        ORDER BY log_time DESC
      `,
        [steamID, type]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async getLastLogEvent(steamID, event) {
    try {
      const { rows } = await query(
        `
        SELECT * FROM player_logs
        WHERE steam_id = $1 AND log_event = $2
        ORDER BY log_time DESC
      `,
        [steamID, event]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

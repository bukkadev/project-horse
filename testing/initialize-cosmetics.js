const cosmetics = require("../db/cosmetics");
const comseticsList = require("./data/cosmetics-list");
const { dropOdds, typeOdds } = require("./data/chest-rewards");
const players = require("../db/players");

async function initializeCosmetics() {
  try {
    console.log("Initializing cosmetics...");
    await cosmetics.bulkCreateCosmetics(comseticsList);
    console.log("Cosmetics initialized");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function clearCosmetics() {
  try {
    console.log("Deleting all cosmetics...");
    await cosmetics.deleteAllCosmetics();
    console.log("Cosmetics Deleted");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteHats() {
  try {
    console.log("Deleting hats...");
    const allCosmetics = await cosmetics.getAllCosmetics();
    for (const cosmetic of allCosmetics) {
      const equipGroups = [
        "avatar_hat",
        "avatar_accessory",
        "avatar_mouth",
        "avatar_eyewear",
        "avatar_emote",
        "avatar_facial_hair",
        "avatar_mouth",
      ];
      if (equipGroups.includes(cosmetic.equip_group)) {
        console.log(`Deleting cosmetic ${cosmetic.cosmetic_name}`);
        await cosmetics.deleteCosmetic(cosmetic.cosmetic_id);
      } else if (cosmetic.cosmetic_type === "Avatar Hat") {
        console.log(`Deleting cosmetic ${cosmetic.cosmetic_name}`);
        await cosmetics.deleteCosmetic(cosmetic.cosmetic_id);
      }
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addCosmetics() {
  try {
    console.log("Adding cosmetics...");
    await cosmetics.bulkCreateCosmetics([
      {
        name: "avatar_rainbow_night",
        type: "Avatar Frame",
        equip_group: "avatar_frame",
        coins: -1,
        cost_usd: -1,
        rarity: "Rare",
      },
    ]);
    console.log("Cosmetics initialized");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function updateCosmetics() {
  try {
    console.log("Updating cosmetics...");
    const cosmeticsToUpdate = [
      {
        // Real Money Purchase
        name: "buy_xp_5000",
        type: "Consumable",
        coins: -1,
        cost_usd: 11.99,
        equip_group: "",
        rarity: "Legendary",
      },
      {
        // Real Money Purchase
        name: "buy_xp_1000",
        type: "Consumable",
        coins: -1,
        cost_usd: 2.99,
        equip_group: "",
        rarity: "Mythical",
      },
      {
        // Real Money Purchase
        name: "buy_xp_300",
        type: "Consumable",
        coins: -1,
        cost_usd: 0.99,
        equip_group: "",
        rarity: "Rare",
      },
    ];
    for (const c of cosmeticsToUpdate) {
      const cosmetic = await cosmetics.getCosmeticByName(c.name);
      if (!cosmetic) throw new Error(`Cosmetic ${c.name} does not exist`);
      await cosmetics.updateCosmetic(
        cosmetic.cosmetic_id,
        c.name,
        c.type,
        c.equip_group,
        c.coins,
        c.cost_usd,
        c.rarity
      );
      console.log(`Updated cosmetic ${c.name}`);
    }
    console.log("Cosmetics updated");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function setChestRewards() {
  try {
    console.log("Setting chest rewards...");
    await cosmetics.clearChestDrops();

    for (const [chestName, chestDrops] of Object.entries(dropOdds)) {
      const chest = await cosmetics.getCosmeticByName(chestName);
      if (!chest) throw new Error(`Chest/Cosmetic ${chestName} does not exist`);
      const chestID = chest.cosmetic_id;
      let cumSumOdds = 0;
      for (const drop of chestDrops) {
        let { type, odds } = drop;
        if (odds < 0) odds = 100 / chestDrops.length;
        cumSumOdds += odds;
        await cosmetics.addChestDropType(chestID, type, cumSumOdds);
      }
    }

    for (const [type, rewards] of Object.entries(typeOdds)) {
      let cumSumOdds = 0;
      for (const reward of rewards) {
        let { odds, item_name } = reward;
        if (odds < 0) odds = 100 / rewards.length;
        const cosmetic = await cosmetics.getCosmeticByName(item_name);
        if (!cosmetic) throw new Error(`Cosmetic ${item_name} does not exist`);
        const cosmeticID = cosmetic.cosmetic_id;
        cumSumOdds += odds;
        await cosmetics.addDropTypeRewards(type, cosmeticID, cumSumOdds);
      }
    }
    console.log("Chest rewards set");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addDefaultCosmeticsToAllPlayers() {
  try {
    console.log("Adding default cosmetics to all players...");
    const defaultCosmetics = await cosmetics.getDefaultCosmetics();
    const allSteamIDs = await players.getAllSteamIDs();
    for (const steamID of allSteamIDs) {
      for (const cosmetic of defaultCosmetics) {
        const hasCosmetic = await players.hasCosmetic(
          steamID,
          cosmetic.cosmetic_id
        );
        if (!hasCosmetic) {
          await players.giveCosmeticByName(steamID, cosmetic.cosmetic_name);
        }
      }
    }
    console.log("Default cosmetics added to all players");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function addCosmeticsToPlayers() {
  const steamIDs = [
    "76561197960956468",
    "76561198030851434",
    "76561198100383941",
    "76561198051143960",
    "76561197960492311",
    "76561198163991316",
    "76561198032067769",
  ];
  const cosmeticsToGive = [
    {
      cosmeticName: "chest_god",
      amount: 1,
    },
    {
      cosmeticName: "chest_basic",
      amount: 5,
    },
    {
      cosmeticName: "get_xp_1000",
      amount: 2,
    },
    {
      cosmeticName: "gold_10000",
      amount: 1,
    },
  ];
  // const terrains = [
  //   "terrain_green",
  //   "terrain_icelake",
  //   "terrain_lava",
  //   "terrain_snow",
  //   "terrain_tropical",
  // ];
  try {
    console.log("Adding cosmetics to players...");
    const transaction = { items: {} };
    for (const cosmetic of cosmeticsToGive) {
      const dbComsetic = await cosmetics.getCosmeticByName(
        cosmetic.cosmeticName
      );
      transaction.items[dbComsetic.cosmetic_id] = cosmetic.amount;
    }
    for (const steamID of steamIDs) {
      const playerTransaction = { ...transaction };
      // const playerCosmetics = await players.getCosmetics(steamID);
      // const missingTerrains = terrains.filter(
      //   (terrain) =>
      //     !playerCosmetics.some(
      //       (cosmetic) => cosmetic.cosmetic_name === terrain
      //     )
      // );
      // // pick a random terrain they don't already have
      // if (missingTerrains.length > 0) {
      //   const randomTerrain =
      //     missingTerrains[Math.floor(Math.random() * missingTerrains.length)];
      //   const terrainCosmetic = await cosmetics.getCosmeticByName(
      //     randomTerrain
      //   );
      //   playerTransaction.items[terrainCosmetic.cosmetic_id] = 1;
      // }
      try {
        console.log(`Adding cosmetics to ${steamID}`);
        await players.doItemTransaction(steamID, playerTransaction);
      } catch (error) {
        console.log(`Error adding cosmetics to ${steamID}`);
        console.log(`Transaction: ${playerTransaction.items}`);
      }
    }
    console.log("cosmetics added to players");
  } catch (error) {
    console.error(error);
    throw error;
  }
}

(async function () {
  // await addCosmetics();
  // await setChestRewards();
  await updateCosmetics();
  // await addCosmeticsToPlayers();
})();

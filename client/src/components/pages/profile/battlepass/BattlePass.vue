<template>
  <div>
    <h1 class="page-title">{{ $t("battle_pass.page_title") }}</h1>
    <div class="timeline">
      <ul class="battlepass-timeline">
        <li v-for="i in 50" :key="i">
          <div
            class="timeline-container"
            v-bind:class="{ left: i % 2 === 0, right: i % 2 === 1 }"
          >
            <div class="timeline-content">
              <span
                v-b-tooltip.hover.html
                :title="`${$t('battle_pass.level_tooltip', {
                  total_xp: getLevelTotalXP(i),
                  next_level: getNextLevelXP(i),
                })}`"
              >
                {{ $t("battle_pass.level") }} {{ i }}
                <i v-if="getLevelLocked(i)" class="fas fa-lock info-icon"></i>
              </span>
              <div
                v-bind:class="{
                  'lvl-wrapper': true,
                  'lvl-locked': i > bpLevel || getLevelLocked(i),
                }"
              >
                <div>
                  <template v-if="loading">
                    <img src="./images/bp_placeholder.png" alt="placeholder" />
                  </template>
                  <template v-else>
                    <img
                      v-if="getItemImage(i)"
                      :src="getItemImage(i)"
                      :alt="getRewardItem(i)"
                      @click="$bvModal.show(`bp-modal-${i}`)"
                    />
                    <b-modal
                      v-if="getRewardItem(i)"
                      :id="`bp-modal-${i}`"
                      centered
                      hide-header
                      hide-footer
                    >
                      <h2 class="mb-2 text-center">
                        {{ getTranslatedItemName(i) }}
                      </h2>

                      <div class="text-center">
                        <div>
                          <img
                            v-if="getItemImage(i)"
                            :src="getItemImage(i)"
                            :alt="getRewardItem(i)"
                            class="mb-2"
                          />
                        </div>
                        <CosmeticDescription :cosmetic="getRewards(i)" />
                      </div>
                    </b-modal>
                  </template>
                </div>
                <div class="claim-button">
                  <b-button
                    size="sm"
                    variant="primary"
                    @click="claimReward(i)"
                    v-if="getLevelCanClaim(i)"
                  >
                    {{ $t("common.claim") }}
                    <b-spinner
                      small
                      v-if="levelLoading(i)"
                      :label="Loading"
                    ></b-spinner>
                  </b-button>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import CosmeticDescription from "../../cosmetics/CosmeticDescription.vue";
export default {
  components: {
    CosmeticDescription,
  },

  data: () => ({
    error: "",
    rewards: [],
    loading: true,
  }),

  created() {
    this.fetchBattlePass();
  },

  computed: {
    bpLevel() {
      return this.$store.getters.bpLevel;
    },
    bpUpgraded() {
      return this.$store.getters.bpUpgraded;
    },
    steamID() {
      return this.$store.state.auth.userSteamID;
    },
  },

  methods: {
    fetchBattlePass() {
      fetch(`/api/players/${this.steamID}/battle_pass/levels`)
        .then((res) => res.json())
        .then((rewards) => {
          this.rewards = rewards;
          this.loading = false;
        })
        .catch((err) => (this.error = err));
    },
    claimReward(level) {
      const reward = this.getRewards(level);
      reward.loading = true;
      fetch(`/api/players/${this.steamID}/battle_pass/claim?level=${level}`, {
        method: "post",
      })
        .then((res) => res.json())
        .then((claimed) => {
          reward.claimed = claimed;
          reward.loading = false;
          this.fetchBattlePass();
          this.$store.dispatch("REFRESH_PLAYER");
        })
        .catch(() => (level.loading = false));
    },
    isEven(number) {
      return number % 2 === 0;
    },
    getRewards(level) {
      return this.rewards.find((reward) => reward.bp_level === level);
    },
    levelLoading(level) {
      return this.getRewards(level)?.loading;
    },
    getRewardItem(level) {
      const reward = this.getRewards(level)?.cosmetic_name;
      return reward;
    },
    getTranslatedItemName(level) {
      const name = this.getRewards(level)?.cosmetic_name;
      const translationString = `cosmetics.${name}`;
      return this.$i18n.t(translationString);
    },
    getTranslatedDescription(level) {
      const name = this.getRewards(level)?.cosmetic_name;
      const translationString = `cosmetic_descriptions.${name}`;
      return this.$i18n.t(translationString);
    },
    getLevelTotalXP(level) {
      if (!this.getRewards(level)) return null;
      return this.getRewards(level).total_xp.toLocaleString();
    },
    getNextLevelXP(level) {
      if (!this.getRewards(level)) return null;
      return this.getRewards(level).next_level_xp.toLocaleString();
    },
    getLevelLocked(level) {
      if (!this.getRewards(level)) return false;
      if (this.bpUpgraded) return false;
      return !this.getRewards(level).free;
    },
    getLevelClaimed(level) {
      if (!this.getRewards(level)) return false;
      return this.getRewards(level).claimed;
    },
    getLevelCanClaim(level) {
      if (!this.getRewards(level)) return false;
      return this.getRewards(level).can_claim;
    },
    hasItemReward(level) {
      return this.getRewards(level)?.cosmetic_id !== null;
    },
    getItemImage(level) {
      const cosmeticName = this.getRewardItem(level);
      if (!cosmeticName) return require("./images/bp_placeholder.png");
      return `/images/cosmetics/${cosmeticName}.png`;
    },
  },
};
</script>

<style scoped>
.info-icon {
  font-size: 12px;
  vertical-align: top;
}

.modal-content {
  /* color: #212529; */
  background-color: #13171d;
}

.close {
  color: white;
}

.modal-backdrop {
  opacity: 0.5;
}

.modal-title {
  font-size: 36px;
}

.reward {
  text-align: center;
  margin-bottom: 10px;

  font-size: 24px;
}

.reward-image {
  width: auto;
  height: 30px;
}

.battlepass-timeline {
  position: relative;
  width: 960px;
  margin: 0 auto;
  margin-top: 20px;
  padding: 1em 0;
  list-style-type: none;
}

.battlepass-timeline:before {
  position: absolute;
  left: 50%;
  top: 0;
  content: " ";
  display: block;
  width: 6px;
  height: 100%;
  margin-left: -3px;
  background-image: linear-gradient(
    to bottom,
    var(--primary-color-light),
    var(--primary-color) 48%,
    var(--primary-color-dark) 99%
  );
  z-index: 5;
}

.battlepass-timeline li:after {
  content: "";
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}

.left {
  position: relative;
  width: 300px;
  float: left;
  text-align: right;
}

.left:before {
  position: absolute;
  left: 110%;
  top: -70px;
  transform: rotate(90deg);
  content: " ";
  display: block;
  width: 6px;
  height: 300px;
  background-image: linear-gradient(
    to bottom,
    var(--primary-color-light),
    var(--primary-color) 48%,
    var(--primary-color-dark) 99%
  );
  z-index: -1;
}

.left span {
  position: relative;
  left: 52%;
  bottom: -31px;
  font-size: 32px;
  color: #fcfcfc;
}

.right {
  position: relative;
  width: 300px;
  float: right;
}

.right:before {
  position: absolute;
  right: 110%;
  top: -70px;
  transform: rotate(90deg);
  content: " ";
  display: block;
  width: 6px;
  height: 300px;
  background-image: linear-gradient(
    to bottom,
    var(--primary-color-light),
    var(--primary-color) 48%,
    var(--primary-color-dark) 99%
  );
  z-index: -1;
}

.right span {
  position: relative;
  right: 52%;
  bottom: -31px;
  font-size: 32px;
  color: #fcfcfc;
}

.lvl-wrapper {
  position: relative;
  display: inline-block;
  top: -1em;

  width: 300px;
}

.lvl-wrapper img {
  height: 150px;

  cursor: pointer;
}

.lvl-wrapper img:hover {
  box-shadow: 0 0 30px 0 rgba(11, 134, 196, 0.3);
}

.lvl-locked {
  box-shadow: unset;
  filter: grayscale(100%);
}

.lvl-locked:hover {
  filter: grayscale(0%);
}

.left .claim-button {
  width: 137px;
  margin-left: auto;
  margin-top: 0.25rem;
  text-align: center;
}

.right .claim-button {
  width: 137px;
  margin-right: auto;
  margin-top: 0.25rem;
  text-align: center;
}

/* Media queries - Responsive timeline on screens less than 600px wide */
@media screen and (max-width: 960px) {
  .battlepass-timeline {
    width: 480px;
  }

  .battlepass-timeline:before {
    left: 100%;
  }

  .right {
    position: relative;
    width: 300px;
    float: left;
    text-align: right;
  }

  .right:before {
    position: absolute;
    left: 110%;
    top: -70px;
    transform: rotate(90deg);
    content: " ";
    display: block;
    width: 6px;
    height: 300px;
    background-image: linear-gradient(
      to bottom,
      var(--primary-color-light),
      var(--primary-color) 48%,
      var(--primary-color-dark) 99%
    );
    z-index: -1;
  }

  .right span {
    position: relative;
    left: 52%;
    bottom: -31px;
    font-size: 32px;
    color: #fcfcfc;
  }
}
</style>
<template>
  <v-container class="friends-container py-8 px-6" fluid>
    <div class="mb-8">
      <div class="d-flex align-center justify-center mb-6">
        <v-icon class="mr-4" color="cyan-accent-2" icon="mdi-account-group" size="48" />
        <h1 class="text-h2 font-weight-bold text-white tracking-wide">{{ $t('friends.title') }}</h1>
      </div>

      <v-tabs
        v-model="tab"
        align-tabs="center"
        bg-color="transparent"
        class="mb-6 custom-tabs"
        color="cyan-accent-2"
      >
        <v-tab class="text-uppercase font-weight-bold px-8" value="friends">{{ $t('friends.tabs.myFriends') }}</v-tab>
        <v-tab class="text-uppercase font-weight-bold px-8" value="search">{{ $t('friends.tabs.search') }}</v-tab>
        <v-tab class="text-uppercase font-weight-bold px-8" value="requests">
          {{ $t('friends.tabs.requests') }}
          <v-chip
            v-if="totalRequests > 0"
            class="ml-2 font-weight-black"
            color="error"
            size="x-small"
          >
            {{ totalRequests }}
          </v-chip>
        </v-tab>
      </v-tabs>
    </div>

    <v-window v-model="tab" class="bg-transparent" :touch="false">
      <!-- PESTAÑA: MIS AMIGOS -->
      <v-window-item value="friends">
        <v-text-field
          v-model="searchQuery"
          bg-color="rgba(13, 25, 48, 0.4)"
          class="search-bar w-100 mb-8"
          hide-details
          clearable
          :placeholder="$t('friends.searchBar1')"
          prepend-inner-icon="mdi-magnify"
          rounded="xl"
          variant="solo"
        />

        <div v-if="loading" class="d-flex justify-center align-center py-10">
          <v-progress-circular color="cyan-accent-2" indeterminate size="64" width="6" />
        </div>

        <v-row v-else-if="myFriendsList.length > 0">
          <v-col
            v-for="friend in myFriendsList"
            :key="friend.user"
            cols="12"
            lg="4"
            md="6"
            xl="3"
          >
            <v-card
              class="friend-card detailed-card h-100"
              :style="{ background: friend.profileColor ? `${friend.profileColor}CC` : 'rgba(30, 41, 59, 0.4)' }"
              variant="flat"
            >
              <div class="card-header-gradient" :class="getRankClass(friend.level)" />

              <div class="card-body pa-5 pt-2">
                <div class="d-flex align-start justify-space-between mb-2">
                  <div class="avatar-container mt-n12">
                    <div class="avatar-ring" :class="getRankClass(friend.level)">
                      <v-avatar class="main-avatar" color="#0a192f" size="84">
                        <v-img v-if="friend.avatar" cover :src="getAvatarUrl(friend.avatar, friend.user)" />
                        <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                          friend.user.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">{{ $t('friends.level', { level: friend.level || 1 }) }}</div>
                    <div class="xp-mini-bar">
                      <v-progress-linear color="cyan-accent-2" height="4" :model-value="65" rounded />
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ friend.user }}</h2>
                  <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(friend.level)]" size="x-small">
                    {{ friend.selectedTitle ? $t('shopItems.' + getTitleKey(friend.selectedTitle) + '.name') : getRankName(friend.level) }}
                  </v-chip>
                </div>

                <!-- Achievements Mini Showcase -->
                <div class="section-label-mini mb-2">{{ $t('friends.activeAchievements') }}</div>
                <div class="achievements-showcase mb-6">
                  <div v-for="i in 3" :key="i" class="mini-medal-slot">
                    <Medal
                      v-if="getAchievement(friend.selectedAchievements?.[i - 1])"
                      :icon="getAchievement(friend.selectedAchievements[i - 1]).icon"
                      :scale="0.25"
                      :type="getAchievement(friend.selectedAchievements[i - 1]).type"
                    />
                    <v-icon v-else color="rgba(255,255,255,0.05)" icon="mdi-shield-outline" size="20" />
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white" />

                <div class="d-flex flex-column gap-2">
                  <v-btn
                    block
                    class="font-weight-bold rounded-lg h-large"
                    color="primary"
                    :disabled="challengeCooldowns[friend.user]"
                    :loading="challengeCooldowns[friend.user]"
                    variant="elevated"
                    @click="challengeFriend(friend.user)"
                  >
                    <v-icon icon="mdi-sword-cross" size="18" start />
                    {{ $t('friends.challenge') }}
                  </v-btn>
                  <div class="d-flex gap-2">
                    <v-badge
                      class="flex-grow-1 msg-badge"
                      color="error"
                      :content="chatStore.unreadCounts[friend.user] > 9 ? '9+' : chatStore.unreadCounts[friend.user]"
                      floating
                      :model-value="!!chatStore.unreadCounts[friend.user]"
                    >
                      <v-btn
                        class="w-100 font-weight-bold rounded-lg h-large"
                        color="cyan-accent-2"
                        variant="tonal"
                        @click="startChat(friend)"
                      >
                        <v-icon icon="mdi-message-text-outline" size="18" start />
                        {{ $t('friends.chat') }}
                      </v-btn>
                    </v-badge>
                    <v-btn
                      class="px-0 rounded-lg h-large"
                      color="error"
                      style="min-width: 48px"
                      variant="tonal"
                      @click="removeFriend(friend.user)"
                    >
                      <v-icon icon="mdi-account-minus-outline" size="20" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-16">
          <v-icon class="mb-4" color="blue-grey-darken-3" icon="mdi-account-search-outline" size="80" />
          <h3 v-if="searchQuery" class="text-h5 text-grey">{{ $t('friends.noSearchMatch') }}</h3>
          <h3 v-else class="text-h5 text-grey">{{ $t('friends.emptyCrew') }}</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: EXPLORAR GALAXIA -->
      <v-window-item value="search">
        <div class="d-flex flex-column flex-sm-row gap-4 mb-8">
          <v-text-field
            v-model="searchExploreQuery"
            bg-color="rgba(13, 25, 48, 0.4)"
            class="search-bar flex-grow-1"
            hide-details
            :placeholder="$t('friends.searchExplore')"
            clearable
            prepend-inner-icon="mdi-radar"
            rounded="xl"
            variant="solo"
            @update:model-value="reloadRandomExplorers"
          />

          <v-btn
            class="rounded-pill px-8 font-weight-bold"
            color="cyan-accent-2"
            height="56"
            :loading="reloading"
            prepend-icon="mdi-refresh"
            variant="elevated"
            @click="reloadRandomExplorers"
          >
            {{ $t('friends.searchOthersBtn') }}
          </v-btn>
        </div>

        <div v-if="loading || reloading" class="d-flex justify-center align-center py-16">
          <v-progress-circular color="cyan-accent-3" indeterminate size="80" width="8" />
        </div>

        <v-row v-else-if="randomExplorers.length > 0">
          <v-col
            v-for="explorer in randomExplorers"
            :key="explorer.user"
            cols="12"
            lg="4"
            md="6"
            xl="3"
          >
            <v-card
              class="friend-card explorer-card detailed-card h-100"
              :style="{ background: explorer.profileColor ? `${explorer.profileColor}CC` : 'rgba(30, 41, 59, 0.4)' }"
              variant="flat"
            >
              <div class="card-header-gradient" :class="getRankClass(explorer.level)" />

              <div class="card-body pa-5 pt-2">
                <div class="d-flex align-start justify-space-between mb-2">
                  <div class="avatar-container mt-n12">
                    <div class="avatar-ring" :class="getRankClass(explorer.level)">
                      <v-avatar class="main-avatar" color="#0a192f" size="84">
                        <v-img v-if="explorer.avatar" cover :src="getAvatarUrl(explorer.avatar, explorer.user)" />
                        <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                          explorer.user.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">
                      {{ $t('friends.level', { level: explorer.level || 1 }) }}
                    </div>
                    <div class="xp-mini-bar">
                      <v-progress-linear color="cyan-accent-2" height="4" :model-value="65" rounded />
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ explorer.user }}</h2>
                  <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(explorer.level)]" size="x-small">
                    {{ explorer.selectedTitle ? $t('shopItems.' + getTitleKey(explorer.selectedTitle) + '.name') : getRankName(explorer.level) }}
                  </v-chip>
                </div>

                <!-- Achievements Mini Showcase -->
                <div class="section-label-mini mb-2">{{ $t('friends.activeAchievements') }}</div>
                <div class="achievements-showcase mb-6">
                  <div v-for="i in 3" :key="i" class="mini-medal-slot">
                    <Medal
                      v-if="getAchievement(explorer.selectedAchievements?.[i - 1])"
                      :icon="getAchievement(explorer.selectedAchievements[i - 1]).icon"
                      :scale="0.25"
                      :type="getAchievement(explorer.selectedAchievements[i - 1]).type"
                    />
                    <v-icon v-else color="rgba(255,255,255,0.05)" icon="mdi-shield-outline" size="20" />
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white" />

                <div class="d-flex gap-3">
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="white"
                    variant="tonal"
                    @click="openProfile(explorer)"
                  >
                    {{ $t('friends.viewProfile') }}
                  </v-btn>
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="success"
                    :disabled="hasSentRequest(explorer.user)"
                    variant="elevated"
                    @click="sendRequest(explorer.user)"
                  >
                    <v-icon :icon="hasSentRequest(explorer.user) ? 'mdi-check' : 'mdi-plus-thick'" start />
                    {{ hasSentRequest(explorer.user) ? $t('friends.sentReq') : $t('friends.recruit') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-16">
          <v-icon class="mb-4" color="blue-grey-darken-3" icon="mdi-satellite-variant" size="80" />
          <h3 class="text-h5 text-grey">{{ $t('friends.noExplorers') }}</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: SOLICITUDES -->
      <v-window-item value="requests">
        <div v-if="loading" class="d-flex justify-center align-center py-16">
          <v-progress-circular color="cyan-accent-3" indeterminate size="80" width="8" />
        </div>

        <v-row v-if="!loading && groupInvitationsList.length > 0" class="mb-6">
          <v-col
            v-for="invitation in groupInvitationsList"
            :key="invitation.id"
            cols="12"
            lg="4"
            md="6"
            xl="3"
          >
            <v-card class="friend-card request-card detailed-card h-100" variant="flat">
              <div class="card-header-gradient bg-requests" />
              <div class="card-body pa-5 pt-4">
                <div class="mb-6">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">Invitación grupal</h2>
                  <div class="text-body-2 text-grey-lighten-1">
                    {{ invitation.from }} te invita como <strong>{{ invitation.targetRole }}</strong>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="success"
                    variant="elevated"
                    @click="acceptGroupInvitation(invitation.id)"
                  >
                    {{ $t('friends.accept') }}
                  </v-btn>
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="error"
                    variant="tonal"
                    @click="rejectGroupInvitation(invitation.id)"
                  >
                    {{ $t('friends.reject') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="!loading && leaveApprovalRequestsList.length > 0" class="mb-6">
          <v-col
            v-for="request in leaveApprovalRequestsList"
            :key="request.id"
            cols="12"
            lg="4"
            md="6"
            xl="3"
          >
            <v-card class="friend-card request-card detailed-card h-100" variant="flat">
              <div class="card-header-gradient bg-requests" />
              <div class="card-body pa-5 pt-4">
                <div class="mb-6">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">Solicitud de salida</h2>
                  <div class="text-body-2 text-grey-lighten-1">
                    {{ request.requester }} ({{ request.requesterRole }}) quiere pasar a plan individual.
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="success"
                    variant="elevated"
                    @click="approveLeaveRequest(request.id)"
                  >
                    {{ $t('friends.accept') }}
                  </v-btn>
                  <v-btn
                    class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    color="error"
                    variant="tonal"
                    @click="rejectLeaveRequest(request.id)"
                  >
                    {{ $t('friends.reject') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-if="!loading && requestsList.length > 0">
          <v-col
            v-for="requester in requestsList"
            :key="requester.user"
            cols="12"
            lg="4"
            md="6"
            xl="3"
          >
            <v-card class="friend-card request-card detailed-card h-100" variant="flat">
              <div class="card-header-gradient bg-requests" />

              <div class="card-body pa-5 pt-2">
                <div class="avatar-container mt-n12 mb-4">
                  <div class="avatar-ring ring-requests">
                    <v-avatar class="main-avatar" color="#0a192f" size="84">
                      <v-img v-if="requester.avatar" cover :src="getAvatarUrl(requester.avatar, requester.user)" />
                      <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                        requester.user.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </div>
                </div>

                <div class="mb-6">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ requester.user }}</h2>
                  <div class="d-flex align-center gap-2">
                    <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(requester.level)]" size="x-small">
                      {{ requester.selectedTitle ? $t('shopItems.' + getTitleKey(requester.selectedTitle) + '.name') : getRankName(requester.level) }}
                    </v-chip>
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">
                      {{ $t('friends.level', { level: requester.level || 1 }) }}
                    </div>
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white" />

                <div class="d-flex flex-column gap-2">
                  <div class="d-flex gap-2">
                    <v-btn
                      class="flex-grow-1 font-weight-bold rounded-lg h-large"
                      color="success"
                      variant="elevated"
                      @click="acceptRequest(requester.user)"
                    >
                      {{ $t('friends.accept') }}
                    </v-btn>
                    <v-btn
                      class="flex-grow-1 font-weight-bold rounded-lg h-large"
                      color="error"
                      variant="tonal"
                      @click="rejectRequest(requester.user)"
                    >
                      {{ $t('friends.reject') }}
                    </v-btn>
                  </div>
                  <v-btn
                    block
                    class="text-caption font-weight-black"
                    color="white"
                    variant="text"
                    @click="openProfile(requester)"
                  >
                    {{ $t('friends.viewProfile') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="!loading && requestsList.length === 0 && groupInvitationsList.length === 0 && leaveApprovalRequestsList.length === 0" class="text-center py-16">
          <v-icon class="mb-4" color="blue-grey-darken-3" icon="mdi-inbox-outline" size="80" />
          <h3 class="text-h5 text-grey">{{ $t('friends.noReqs') }}</h3>
        </div>
      </v-window-item>
    </v-window>

    <!-- PROFILE DIALOG (EXPEDIENTE) -->
    <v-dialog v-model="profileDialog.show" max-width="480">
      <v-card class="expediente-card pa-8 rounded-xl">
        <div class="d-flex justify-end mb-n4">
          <v-btn
            color="white"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="profileDialog.show = false"
          />
        </div>

        <div class="text-center">
          <div class="position-relative mb-6 d-inline-block">
            <div class="avatar-ring-large" :class="getRankClass(profileDialog.user?.level)">
              <v-avatar class="main-avatar bg-black" size="140">
                <v-img
                  v-if="profileDialog.user?.avatar"
                  cover
                  :src="getAvatarUrl(profileDialog.user.avatar, profileDialog.user.user)"
                />
                <span v-else class="text-h1 text-cyan-accent-2 font-weight-bold">{{
                  profileDialog.user?.user?.charAt(0).toUpperCase() }}</span>
              </v-avatar>
            </div>
          </div>

          <h2 class="text-h3 font-weight-black text-white mb-1">{{ profileDialog.user?.user }}</h2>
          <div class="mb-6">
            <v-chip :class="['rank-chip font-weight-black px-6', getRankClass(profileDialog.user?.level)]" size="large">
              {{ profileDialog.user?.selectedTitle ? $t('shopItems.' + getTitleKey(profileDialog.user?.selectedTitle) + '.name') : getRankName(profileDialog.user?.level) }}
            </v-chip>
            <div class="mt-2 text-overline text-cyan-accent-1">{{ $t('friends.level', { level: profileDialog.user?.level || 1 }) }}</div>
          </div>

          <v-row class="bg-black-semi pa-4 rounded-lg mb-8" no-gutters>
            <v-col class="border-right-dim" cols="6">
              <div class="text-overline text-grey">{{ $t('profile.levelLabel') }}</div>
              <div class="text-h5 text-white font-weight-bold">{{ profileDialog.user?.level || 1 }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-overline text-grey">{{ $t('profile.seniorityLabel') }}</div>
              <div class="text-h5 text-white font-weight-bold">{{ $t('profile.systemValue') }}</div>
            </v-col>
          </v-row>

          <div class="section-label-mini mb-4">{{ $t('friends.activeAchievements') }}</div>
          <div class="d-flex justify-center gap-6 mb-8">
            <div v-for="i in 3" :key="i" class="achievement-display-slot">
              <Medal
                v-if="getAchievement(profileDialog.user?.selectedAchievements?.[i - 1])"
                :icon="getAchievement(profileDialog.user.selectedAchievements[i - 1]).icon"
                :scale="0.45"
                :type="getAchievement(profileDialog.user.selectedAchievements[i - 1]).type"
              />
              <v-icon v-else color="rgba(255,255,255,0.05)" icon="mdi-lock-outline" size="32" />
            </div>
          </div>

          <v-btn
            v-if="!isFriend(profileDialog.user?.user) && profileDialog.user?.user !== astroStore.user"
            block
            class="rounded-lg font-weight-black action-btn-glow"
            color="success"
            :disabled="hasSentRequest(profileDialog.user?.user)"
            size="x-large"
            @click="sendRequest(profileDialog.user?.user); profileDialog.show = false;"
          >
            <v-icon :icon="hasSentRequest(profileDialog.user?.user) ? 'mdi-check' : 'mdi-account-plus'" start />
            {{ hasSentRequest(profileDialog.user?.user) ? $t('friends.sentReq') : $t('friends.recruit') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" class="custom-snackbar" :color="snackbar.color" timeout="3000">
      <div class="d-flex align-center">
        <v-icon class="mr-3" :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        <span class="font-weight-bold">{{ snackbar.text }}</span>
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import Medal from '@/components/achievements/Medal.vue'
  import { ACHIEVEMENTS } from '@/constants/achievements'
  import { useAstroStore } from '@/stores/astroStore'
  import { useChatStore } from '@/stores/chatStore'
  import { useGroupStore } from '@/stores/groupStore'
  import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()
  const chatStore = useChatStore()
  const multiplayerStore = useMultiplayerStore()
  const { explorers, friends, friendRequests, groupInvitations, groupApprovalRequests } = storeToRefs(astroStore)

  const loading = ref(true)
  const reloading = ref(false)
  const searchQuery = ref('')
  const searchExploreQuery = ref('')
  const tab = ref('friends')
  const randomExplorers = ref([])
  const sentRequests = ref([])
  const challengeCooldowns = ref({})

  const profileDialog = ref({
    show: false,
    user: null,
  })

  function openProfile (userObj) {
    profileDialog.value.user = userObj
    profileDialog.value.show = true
  }

  const snackbar = ref({
    show: false,
    text: '',
    color: 'success',
  })

  function showMessage (text, color = 'success') {
    snackbar.value = {
      show: true,
      text: text,
      color: color,
    }
  }

  const ALL_TITLES = [
    { id: 105, name: 'El Imparable', key: 'titleUnstoppable' },
    { id: 106, name: 'Leyenda Galáctica', key: 'titleLegend' },
    { id: 107, name: 'Destructor de Asteroides', key: 'titleDestroyer' },
  ]

  function getTitleKey (titleName) {
    if (!titleName) return ''
    const cleanName = titleName.replace('Título: ', '')
    const title = ALL_TITLES.find(t => t.name === cleanName)
    return title ? title.key : ''
  }

  function getAchievement (id) {
    if (id === null || id === undefined) return null
    return ACHIEVEMENTS.find(a => a.id === Number(id))
  }

  function getAvatarUrl (avatarStr, username) {
    if (!avatarStr || typeof avatarStr !== 'string') {
      if (username && username !== '[object Object]') {
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
      }
      return '/Astronauta_blanc.jpg'
    }
    return avatarStr.startsWith('/') ? avatarStr : `/${avatarStr}`
  }

  function isFriend (username) {
    if (!username) return false
    return Array.isArray(friends.value) && friends.value.includes(username)
  }

  function getRankName (level = 1) {
    const index = Math.min(Math.floor((level - 1) / 10), 14)
    return t(`ranks.${index}`)
  }

  function getRankClass (level = 1) {
    if (level <= 10) return 'rank-tier-1'
    if (level <= 30) return 'rank-tier-2'
    if (level <= 60) return 'rank-tier-3'
    if (level <= 100) return 'rank-tier-4'
    if (level <= 130) return 'rank-tier-5'
    return 'rank-tier-6'
  }

  const myFriendsList = computed(() => {
    const allUsers = Array.isArray(explorers.value) ? explorers.value : []
    let myFriends = allUsers.filter(f => isFriend(f.user) && f.user !== astroStore.user)
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      myFriends = myFriends.filter(f => f.user.toLowerCase().includes(query))
    }
    return myFriends
  })

  async function fetchFriends () {
    loading.value = true
    await astroStore.fetchAllUsers()
    await astroStore.fetchUserStats()
    if (explorers.value?.length > 0) {
      reloadRandomExplorers()
    }
    loading.value = false
  }

  function reloadRandomExplorers () {
    reloading.value = true
    const allUsers = Array.isArray(explorers.value) ? explorers.value : []
    let potential = allUsers.filter(e => e.user !== astroStore.user && !isFriend(e.user))

    if (searchExploreQuery.value) {
      const q = searchExploreQuery.value.toLowerCase()
      potential = potential.filter(p => p.user.toLowerCase().includes(q))
    }

    randomExplorers.value = [...potential].sort(() => 0.5 - Math.random()).slice(0, 12)
    reloading.value = false
  }

  const requestsList = computed(() => {
    const allUsers = Array.isArray(explorers.value) ? explorers.value : []
    const reqUsernames = Array.isArray(friendRequests.value) ? friendRequests.value : []
    return allUsers.filter(u => reqUsernames.includes(u.user))
  })

  const groupInvitationsList = computed(() => Array.isArray(groupInvitations.value) ? groupInvitations.value : [])
  const leaveApprovalRequestsList = computed(() => Array.isArray(groupApprovalRequests.value) ? groupApprovalRequests.value : [])
  const totalRequests = computed(() => {
    const friendCount = Array.isArray(friendRequests.value) ? friendRequests.value.length : 0
    return friendCount + groupInvitationsList.value.length + leaveApprovalRequestsList.value.length
  })

  onMounted(() => {
    fetchFriends()
  })

  async function removeFriend (friendName) {
    await astroStore.removeFriendAction(friendName)
    showMessage(t('friends.removed', { name: friendName }), 'error')
    await astroStore.fetchUserStats()
  }

  function hasSentRequest (username) {
    return sentRequests.value.includes(username)
  }

  async function sendRequest (friendName) {
    if (isFriend(friendName)) return
    const result = await astroStore.sendFriendRequest(friendName)
    if (result && result.success) {
      showMessage(t('friends.sent', { name: friendName }))
      sentRequests.value.push(friendName)
    } else {
      showMessage(result?.message || t('friends.errSendReq'), 'error')
    }
  }

  async function acceptRequest (friendName) {
    const result = await astroStore.acceptFriendRequest(friendName)
    if (result.success) {
      showMessage(t('friends.accepted', { name: friendName }))
      await astroStore.fetchUserStats()
    }
  }

  async function rejectRequest (friendName) {
    const result = await astroStore.rejectFriendRequest(friendName)
    if (result.success) {
      showMessage(t('friends.rejected', { name: friendName }), 'error')
      await astroStore.fetchUserStats()
    }
  }

  async function acceptGroupInvitation (invitationId) {
    const result = await groupStore.acceptGroupInvitation(invitationId, astroStore.user)
    if (!result.success) {
      showMessage(result.message || 'No se pudo aceptar la invitación de grupo', 'error')
      return
    }
    showMessage('Te has unido al grupo')
    await astroStore.fetchUserStats()
  }

  async function rejectGroupInvitation (invitationId) {
    const result = await groupStore.rejectGroupInvitation(invitationId, astroStore.user)
    if (!result.success) {
      showMessage(result.message || 'No se pudo rechazar la invitación de grupo', 'error')
      return
    }
    showMessage('Invitación rechazada', 'error')
    await astroStore.fetchUserStats()
  }

  async function approveLeaveRequest (requestId) {
    const result = await groupStore.approveLeaveRequest(astroStore.user, requestId)
    if (!result.success) {
      showMessage(result.message || 'No se pudo aprobar la solicitud de salida', 'error')
      return
    }
    showMessage('Solicitud de salida aprobada')
    await astroStore.fetchUserStats()
  }

  async function rejectLeaveRequest (requestId) {
    const result = await groupStore.rejectLeaveRequest(astroStore.user, requestId)
    if (!result.success) {
      showMessage(result.message || 'No se pudo rechazar la solicitud de salida', 'error')
      return
    }
    showMessage('Solicitud de salida rechazada', 'error')
    await astroStore.fetchUserStats()
  }

  function startChat (friendObj) {
    chatStore.openChat(friendObj)
  }

  async function challengeFriend (friendName) {
    if (challengeCooldowns.value[friendName]) return
    showMessage(t('friends.connectingChallenge', { name: friendName }), 'info')
    challengeCooldowns.value[friendName] = true
    const success = await multiplayerStore.sendChallenge(friendName)

    if (success) {
      showMessage(t('friends.challengeSent', { name: friendName }))
    } else {
      showMessage(t('friends.challengeError', { name: friendName }), 'error')
      setTimeout(() => {
        challengeCooldowns.value[friendName] = false
      }, 5000)
    }
  }
</script>

<style scoped>
.friends-container {
  min-height: 100vh;
}

:deep(.custom-tabs) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

:deep(.v-tab) {
  letter-spacing: 2px;
  transition: all 0.3s ease;
  opacity: 0.5;
}

:deep(.v-tab--selected) {
  opacity: 1;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.detailed-card {
  background: rgba(10, 25, 41, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.detailed-card:hover {
  transform: translateY(-8px);
  border-color: rgba(0, 229, 255, 0.3) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-header-gradient {
  height: 80px;
  opacity: 0.6;
}

.card-header-gradient.rank-tier-1 { background: linear-gradient(135deg, #455a64, #1a237e); }
.card-header-gradient.rank-tier-2 { background: linear-gradient(135deg, #2e7d32, #004d40); }
.card-header-gradient.rank-tier-3 { background: linear-gradient(135deg, #1565c0, #0d47a1); }
.card-header-gradient.rank-tier-4 { background: linear-gradient(135deg, #6a1b9a, #4a148c); }
.card-header-gradient.rank-tier-5 { background: linear-gradient(135deg, #ff8f00, #e65100); }
.card-header-gradient.rank-tier-6 { background: linear-gradient(135deg, #c62828, #b71c1c); }

.card-header-gradient.bg-requests {
  background: linear-gradient(135deg, #fbc02d, #f57f17);
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.avatar-ring.rank-tier-1 { background: #90a4ae; box-shadow: 0 0 15px rgba(144, 164, 174, 0.3); }
.avatar-ring.rank-tier-2 { background: #4caf50; box-shadow: 0 0 15px rgba(76, 175, 80, 0.3); }
.avatar-ring.rank-tier-3 { background: #2196f3; box-shadow: 0 0 15px rgba(33, 150, 243, 0.3); }
.avatar-ring.rank-tier-4 { background: #9c27b0; box-shadow: 0 0 15px rgba(156, 39, 176, 0.3); }
.avatar-ring.rank-tier-5 { background: #ff9800; box-shadow: 0 0 15px rgba(255, 152, 0, 0.3); }
.avatar-ring.rank-tier-6 { background: #f44336; box-shadow: 0 0 15px rgba(244, 67, 54, 0.3); }

.avatar-ring.ring-requests {
  background: #fbc02d;
}

.main-avatar {
  border: 4px solid #0a192f;
}

:deep(.main-avatar .v-img__img) {
  transform: scale(1.4);
}

.name-title {
  letter-spacing: 1px;
}

.rank-chip-mini {
  height: 18px;
  font-size: 0.6rem;
  letter-spacing: 1px;
}

.rank-chip-mini.rank-tier-1 { background: #90a4ae !important; color: #000 !important; }
.rank-chip-mini.rank-tier-2 { background: #4caf50 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-3 { background: #2196f3 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-4 { background: #9c27b0 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-5 { background: #ff9800 !important; color: #000 !important; }
.rank-chip-mini.rank-tier-6 { background: #f44336 !important; color: #fff !important; }

.section-label-mini {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.xp-mini-bar {
  width: 60px;
}

.achievements-showcase {
  display: flex;
  gap: 8px;
}

.mini-medal-slot {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.h-large {
  height: 48px !important;
}

.msg-badge :deep(.v-badge__badge) {
  font-family: 'Inter', sans-serif;
  font-weight: 900;
}

.expediente-card {
  background: linear-gradient(180deg, #0d192f 0%, #050b18 100%) !important;
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
  box-shadow: 0 0 100px rgba(0, 229, 255, 0.1) !important;
}

.avatar-ring-large {
  padding: 8px;
  border-radius: 50%;
  display: inline-block;
}

.avatar-ring-large.rank-tier-1 { background: #90a4ae; }
.avatar-ring-large.rank-tier-2 { background: #4caf50; }
.avatar-ring-large.rank-tier-3 { background: #2196f3; }
.avatar-ring-large.rank-tier-4 { background: #9c27b0; }
.avatar-ring-large.rank-tier-5 { background: #ff9800; }
.avatar-ring-large.rank-tier-6 { background: #f44336; }

.bg-black-semi {
  background: rgba(0, 0, 0, 0.3);
}

.border-right-dim {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.action-btn-glow {
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
  letter-spacing: 2px;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.lh-1 { line-height: 1; }

.custom-snackbar :deep(.v-snackbar__wrapper) {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>


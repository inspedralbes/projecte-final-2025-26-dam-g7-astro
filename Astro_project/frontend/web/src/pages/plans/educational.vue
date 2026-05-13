<template>
  <v-container class="edu-dashboard fill-height pa-8" fluid>
    <v-row>
      <!-- SIDEBAR DE GESTIÓN -->
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-6 mb-6">
          <div class="d-flex align-center mb-6">
            <v-icon class="mr-3" color="cyan-accent-3" size="32">mdi-shield-account</v-icon>
            <h2 class="text-h5 font-weight-bold text-white">{{ $t('educational.title') }}</h2>
          </div>

          <v-list bg-color="transparent" class="text-white">
            <v-list-item
              v-if="role === 'CENTER'"
              :class="{ 'active-item': currentTab === 'teachers' }"
              prepend-icon="mdi-domain"
              :title="$t('educational.manageTeachers')"
              @click="currentTab = 'teachers'"
            />

            <v-list-item
              v-if="role === 'TEACHER'"
              :class="{ 'active-item': currentTab === 'students' }"
              prepend-icon="mdi-school"
              :title="$t('educational.myClass')"
              @click="currentTab = 'students'"
            />

            <v-list-item
              :class="{ 'active-item': currentTab === 'stats' }"
              prepend-icon="mdi-chart-areaspline"
              :title="$t('educational.stats')"
              @click="currentTab = 'stats'"
            />

            <v-list-item
              :class="{ 'active-item': currentTab === 'supplies' }"
              prepend-icon="mdi-playlist-edit"
              :title="$t('educational.supplyEditor')"
              @click="currentTab = 'supplies'"
            />
          </v-list>

          <v-divider class="my-6 border-opacity-10" />

          <v-btn
            block
            color="cyan-accent-4"
            prepend-icon="mdi-arrow-left"
            to="/profile"
            variant="tonal"
          >
            {{ $t('educational.backToProfile') }}
          </v-btn>
        </v-card>
      </v-col>

      <!-- CONTENIDO PRINCIPAL -->
      <v-col cols="12" md="9">
        <v-card class="glass-card pa-8 fill-height">

          <!-- TAB: GESTIÓN DE PROFESORES (CENTER ONLY) -->
          <div v-if="currentTab === 'teachers' && role === 'CENTER'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h3 class="text-h4 font-weight-black text-white">{{ $t('educational.teachersTitle') }}</h3>
              <v-btn color="green-accent-3" prepend-icon="mdi-plus" @click="showAddDialog = true">{{ $t('educational.addTeacher') }}</v-btn>
            </div>

            <v-table class="tech-table">
              <thead>
                <tr>
                  <th>{{ $t('educational.teacher') }}</th>
                  <th>{{ $t('educational.rank') }}</th>
                  <th>{{ $t('educational.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in groupStore.members" :key="teacher.username">
                  <td>{{ teacher.username }}</td>
                  <td><v-chip size="small">{{ teacher.rank }}</v-chip></td>
                  <td>
                    <v-btn color="cyan" icon="mdi-chart-bar" variant="text" @click="viewTeacherStats(teacher.username)" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- TAB: GESTIÓN DE ALUMNOS (TEACHER ONLY) -->
          <div v-if="currentTab === 'students' && role === 'TEACHER'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h3 class="text-h4 font-weight-black text-white">{{ $t('educational.studentsTitle') }}</h3>
              <v-btn color="green-accent-3" prepend-icon="mdi-plus" @click="showAddDialog = true">{{ $t('educational.addStudent') }}</v-btn>
            </div>

            <v-table class="tech-table">
              <thead>
                <tr>
                  <th>{{ $t('educational.student') }}</th>
                  <th>{{ $t('educational.level') }}</th>
                  <th>{{ $t('educational.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in groupStore.members" :key="student.username">
                  <td>{{ student.username }}</td>
                  <td>{{ student.level }}</td>
                  <td>
                    <v-btn color="cyan" icon="mdi-eye" variant="text" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- TAB: ESTADÍSTICAS -->
          <div v-if="currentTab === 'stats'">
            <h3 class="text-h4 font-weight-black text-white mb-6">{{ $t('educational.telemetryTitle') }}</h3>

            <v-row v-if="groupStore.currentStats">
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">{{ $t('educational.totalGames') }}</div>
                  <div class="text-h4 text-cyan-accent-3">{{ groupStore.currentStats.totalGames }}</div>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">{{ $t('educational.avgLevel') }}</div>
                  <div class="text-h4 text-amber-accent-2">{{ groupStore.currentStats.avgLevel.toFixed(1) }}</div>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">{{ $t('educational.totalMembers') }}</div>
                  <div class="text-h4 text-purple-accent-1">{{ groupStore.currentStats.totalStudents || groupStore.currentStats.totalTeachers }}</div>
                </v-card>
              </v-col>
            </v-row>

            <p v-else class="text-grey">{{ $t('educational.noData') }}</p>
          </div>

          <!-- TAB: EDITOR DE SUMINISTROS -->
          <div v-if="currentTab === 'supplies'">
            <SupplyEditor />
          </div>

        </v-card>
      </v-col>
    </v-row>

    <!-- DIALOGO: AÑADIR MIEMBRO -->
    <v-dialog v-model="showAddDialog" max-width="400">
      <v-card class="glass-popup pa-6">
        <h3 class="text-h5 text-white mb-6">{{ $t('educational.addMember', { role: selectedRole === 'TEACHER' ? $t('educational.teacher') : $t('educational.student') }) }}</h3>
        <v-select
          v-if="role === 'CENTER'"
          v-model="selectedRole"
          class="mb-4"
          :items="roleOptions"
          :label="$t('educational.roleLabel')"
          variant="solo-filled"
        />
        <v-select
          v-model="addMode"
          class="mb-4"
          :items="modeOptions"
          :label="$t('educational.modeLabel')"
          variant="solo-filled"
        />
        <v-text-field v-model="newName" class="mb-4" :label="$t('educational.username')" variant="solo-filled" />
        <v-text-field
          v-if="addMode === 'create'"
          v-model="newPass"
          class="mb-6"
          :label="$t('educational.password')"
          type="password"
          variant="solo-filled"
        />
        <v-btn block color="cyan-accent-3" @click="addMember">{{ $t('educational.confirmReg') }}</v-btn>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import SupplyEditor from '@/components/educational/SupplyEditor.vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()
  const { user, role } = storeToRefs(astroStore)

  const currentTab = ref('stats')
  const showAddDialog = ref(false)

  // Forms
  const addMode = ref('create')
  const selectedRole = ref('STUDENT')
  const newName = ref('')
  const newPass = ref('')
  const roleOptions = computed(() => [
    { title: t('educational.roles.teacher'), value: 'TEACHER' },
    { title: t('educational.roles.student'), value: 'STUDENT' },
  ])
  const modeOptions = computed(() => [
    { title: t('educational.addModes.create'), value: 'create' },
    { title: t('educational.addModes.invite'), value: 'invite' },
  ])

  onMounted(async () => {
    if (role.value === 'CENTER') {
      currentTab.value = 'teachers'
      selectedRole.value = 'TEACHER'
      await groupStore.fetchMembers(user.value)
      await groupStore.fetchCenterStats(user.value)
    } else if (role.value === 'TEACHER') {
      currentTab.value = 'students'
      selectedRole.value = 'STUDENT'
      await groupStore.fetchMembers(user.value)
      await groupStore.fetchClassStats(user.value)
      await groupStore.fetchSupplySets(user.value)
    }
  })

  async function addMember () {
    if (!newName.value) {
      alert(t('educational.errors.usernameRequired'))
      return
    }
    if (addMode.value === 'create' && !newPass.value) {
      alert(t('educational.errors.passwordRequired'))
      return
    }

    let result
    const targetRole = role.value === 'CENTER' ? selectedRole.value : 'STUDENT'
    if (addMode.value === 'invite') {
      result = await groupStore.inviteExistingMember(user.value, newName.value, targetRole)
    } else {
      result = await groupStore.createMember(user.value, targetRole, { username: newName.value, password: newPass.value })
    }

    if (result.success) {
      showAddDialog.value = false
      newName.value = ''
      newPass.value = ''
      await groupStore.fetchMembers(user.value)
    } else {
      alert(result.message || t('educational.errors.addMemberFailed'))
    }
  }

  async function viewTeacherStats (tUsername) {
    currentTab.value = 'stats'
    await groupStore.fetchClassStats(tUsername)
  }
</script>

<style scoped>
.edu-dashboard {
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  color: white;
}

.glass-card {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 242, 255, 0.1);
  border-radius: 20px !important;
}

.active-item {
  background: rgba(0, 242, 255, 0.1);
  color: #00e5ff !important;
  border-left: 4px solid #00e5ff;
}

.tech-table {
  background: transparent !important;
  color: white !important;
}

.tech-table th {
  color: #00e5ff !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.stat-mini-card {
  background: rgba(255, 255, 255, 0.03) !important;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.supply-card {
  background: rgba(255, 255, 255, 0.05) !important;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.active-set {
  border-color: #00e676;
  background: rgba(0, 230, 118, 0.05) !important;
}

.glass-popup {
  background: rgba(15, 23, 42, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 24px !important;
}
</style>

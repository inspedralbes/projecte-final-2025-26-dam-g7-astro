
<template>
  <v-container fluid class="edu-dashboard fill-height pa-8">
    <v-row>
      <!-- SIDEBAR DE GESTIÓN -->
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-6 mb-6">
          <div class="d-flex align-center mb-6">
            <v-icon color="cyan-accent-3" size="32" class="mr-3">mdi-shield-account</v-icon>
            <h2 class="text-h5 font-weight-bold text-white">PANEL EDUCATIVO</h2>
          </div>
          
          <v-list bg-color="transparent" class="text-white">
            <v-list-item 
              v-if="role === 'CENTER'" 
              prepend-icon="mdi-domain" 
              title="Gestión de Profesores"
              @click="currentTab = 'teachers'"
              :class="{ 'active-item': currentTab === 'teachers' }"
            ></v-list-item>
            
            <v-list-item 
              v-if="role === 'TEACHER'" 
              prepend-icon="mdi-school" 
              title="Mi Clase"
              @click="currentTab = 'students'"
              :class="{ 'active-item': currentTab === 'students' }"
            ></v-list-item>

            <v-list-item 
              prepend-icon="mdi-chart-areaspline" 
              title="Estadísticas"
              @click="currentTab = 'stats'"
              :class="{ 'active-item': currentTab === 'stats' }"
            ></v-list-item>

            <v-list-item 
              prepend-icon="mdi-playlist-edit" 
              title="Editor de Suministros"
              @click="currentTab = 'supplies'"
              :class="{ 'active-item': currentTab === 'supplies' }"
            ></v-list-item>
          </v-list>

          <v-divider class="my-6 border-opacity-10"></v-divider>

          <v-btn block color="cyan-accent-4" variant="tonal" to="/profile" prepend-icon="mdi-arrow-left">
            VOLVER AL PERFIL
          </v-btn>
        </v-card>
      </v-col>

      <!-- CONTENIDO PRINCIPAL -->
      <v-col cols="12" md="9">
        <v-card class="glass-card pa-8 fill-height">
          
          <!-- TAB: GESTIÓN DE PROFESORES (CENTER ONLY) -->
          <div v-if="currentTab === 'teachers' && role === 'CENTER'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h3 class="text-h4 font-weight-black text-white">PROFESORES</h3>
              <v-btn color="green-accent-3" @click="showAddDialog = true" prepend-icon="mdi-plus">AÑADIR PROFESOR</v-btn>
            </div>
            
            <v-table class="tech-table">
              <thead>
                <tr>
                  <th>PROFESOR</th>
                  <th>RANGO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="teacher in groupStore.members" :key="teacher.username">
                  <td>{{ teacher.username }}</td>
                  <td><v-chip size="small">{{ teacher.rank }}</v-chip></td>
                  <td>
                    <v-btn icon="mdi-chart-bar" variant="text" color="cyan" @click="viewTeacherStats(teacher.username)"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- TAB: GESTIÓN DE ALUMNOS (TEACHER ONLY) -->
          <div v-if="currentTab === 'students' && role === 'TEACHER'">
            <div class="d-flex justify-space-between align-center mb-6">
              <h3 class="text-h4 font-weight-black text-white">ALUMNOS DE LA CLASE</h3>
              <v-btn color="green-accent-3" @click="showAddDialog = true" prepend-icon="mdi-plus">AÑADIR ALUMNO</v-btn>
            </div>
            
            <v-table class="tech-table">
              <thead>
                <tr>
                  <th>ALUMNO</th>
                  <th>NIVEL</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in groupStore.members" :key="student.username">
                  <td>{{ student.username }}</td>
                  <td>{{ student.level }}</td>
                  <td>
                    <v-btn icon="mdi-eye" variant="text" color="cyan"></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- TAB: ESTADÍSTICAS -->
          <div v-if="currentTab === 'stats'">
            <h3 class="text-h4 font-weight-black text-white mb-6">TELEMETRÍA DE GRUPO</h3>
            
            <v-row v-if="groupStore.currentStats">
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">TOTAL JUEGOS</div>
                  <div class="text-h4 text-cyan-accent-3">{{ groupStore.currentStats.totalGames }}</div>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">NIVEL PROMEDIO</div>
                  <div class="text-h4 text-amber-accent-2">{{ groupStore.currentStats.avgLevel.toFixed(1) }}</div>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card class="stat-mini-card">
                  <div class="text-overline">TOTAL MIEMBROS</div>
                  <div class="text-h4 text-purple-accent-1">{{ groupStore.currentStats.totalStudents || groupStore.currentStats.totalTeachers }}</div>
                </v-card>
              </v-col>
            </v-row>
            
            <p v-else class="text-grey">No hay datos disponibles para mostrar.</p>
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
        <h3 class="text-h5 text-white mb-6">AÑADIR {{ role === 'CENTER' ? 'PROFESOR' : 'ALUMNO' }}</h3>
        <v-text-field v-model="newName" label="Nombre de Usuario" variant="solo-filled" class="mb-4"></v-text-field>
        <v-text-field v-model="newPass" label="Contraseña" type="password" variant="solo-filled" class="mb-6"></v-text-field>
        <v-btn block color="cyan-accent-3" @click="addMember">CONFIRMAR REGISTRO</v-btn>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAstroStore } from '@/stores/astroStore'
import { useGroupStore } from '@/stores/groupStore'
import { storeToRefs } from 'pinia'
import SupplyEditor from '@/components/educational/SupplyEditor.vue'

const astroStore = useAstroStore()
const groupStore = useGroupStore()
const { user, role } = storeToRefs(astroStore)

const currentTab = ref('stats')
const showAddDialog = ref(false)

// Forms
const newName = ref('')
const newPass = ref('')

onMounted(async () => {
  if (role.value === 'CENTER') {
    currentTab.value = 'teachers'
    await groupStore.fetchMembers(user.value)
    await groupStore.fetchCenterStats(user.value)
  } else if (role.value === 'TEACHER') {
    currentTab.value = 'students'
    await groupStore.fetchMembers(user.value)
    await groupStore.fetchClassStats(user.value)
    await groupStore.fetchSupplySets(user.value)
  }
})

const addMember = async () => {
  let result;
  if (role.value === 'CENTER') {
    result = await groupStore.createTeacher(user.value, { username: newName.value, password: newPass.value })
  } else {
    result = await groupStore.createStudent(user.value, { username: newName.value, password: newPass.value })
  }
  
  if (result.success) {
    showAddDialog.value = false
    newName.value = ''
    newPass.value = ''
    await groupStore.fetchMembers(user.value)
  } else {
    alert(result.message)
  }
}

const viewTeacherStats = async (tUsername) => {
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
